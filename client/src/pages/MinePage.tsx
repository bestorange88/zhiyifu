import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { User, Gift, Share2, Crown, Settings, Wallet, LogIn, Copy, Check, ChevronRight, Clock, Zap, LogOut, Sparkles, Moon, Sun, Trash2, Info, Shield, MessageCircle, Phone, CreditCard, Upload, Camera, ArrowDownCircle, History, CalendarCheck, HelpCircle, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useWallet, useCheckinStatus, useCheckin, useSpinBalance, useReferralSummary } from "@/hooks/use-api";
import LotteryWheel from "@/components/LotteryWheel";
import { VipFrozenUnlockModal } from "@/components/VipFrozenUnlockModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const benefits = [
  { id: 'lottery', title: '转盘奖励', description: '资助贡献值', action: '去抽奖', icon: <Gift className="w-5 h-5 text-rose-500" />, gradient: 'from-rose-50 to-pink-50' },
  { id: 'team', title: '我的团队', description: '团队管理', action: '去查看', icon: <User className="w-5 h-5 text-blue-500" />, gradient: 'from-blue-50 to-indigo-50' },
  { id: 'invite', title: '邀请好友', description: '无限福利', action: '去邀请', icon: <Share2 className="w-5 h-5 text-purple-500" />, gradient: 'from-purple-50 to-violet-50' },
  { id: 'commission', title: '佣金奖励', description: '查看收益', action: '去查看', icon: <Crown className="w-5 h-5 text-amber-500" />, gradient: 'from-amber-50 to-yellow-50' },
];

export default function MinePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login, register, logout, isLoading: authLoading } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLotteryDialog, setShowLotteryDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showIdentityDialog, setShowIdentityDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("alipay");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [identityRealName, setIdentityRealName] = useState("");
  const [identityIdNumber, setIdentityIdNumber] = useState("");
  const [idFrontImage, setIdFrontImage] = useState<File | null>(null);
  const [idBackImage, setIdBackImage] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string>("");
  const [idBackPreview, setIdBackPreview] = useState<string>("");
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { data: wallet } = useWallet();
  const { data: checkinStatus } = useCheckinStatus();
  const { data: spinBalance } = useSpinBalance();
  const { data: referralSummary } = useReferralSummary();
  const checkinMutation = useCheckin();

  const benefits = [
    { 
      id: 'lottery', 
      title: '转盘奖励', 
      description: `剩余次数: ${spinBalance?.availableSpins || 0}`, 
      action: '去抽奖', 
      icon: <Gift className="w-5 h-5 text-rose-500" />, 
      gradient: 'from-rose-50 to-pink-50' 
    },
    { 
      id: 'team', 
      title: '我的团队', 
      description: '团队管理', 
      action: '去查看', 
      icon: <User className="w-5 h-5 text-blue-500" />, 
      gradient: 'from-blue-50 to-indigo-50' 
    },
    { 
      id: 'invite', 
      title: '邀请好友', 
      description: '无限福利', 
      action: '去邀请', 
      icon: <Share2 className="w-5 h-5 text-purple-500" />, 
      gradient: 'from-purple-50 to-violet-50' 
    },
    { 
      id: 'commission', 
      title: '佣金奖励', 
      description: '查看收益', 
      action: '去查看', 
      icon: <Crown className="w-5 h-5 text-amber-500" />, 
      gradient: 'from-amber-50 to-yellow-50' 
    },
  ];

  const { data: vipStatus } = useQuery({
    queryKey: ["/api/vip/status"],
    enabled: !!user,
  });

  const { data: identityStatus, refetch: refetchIdentityStatus } = useQuery({
    queryKey: ["/api/identity/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/identity/status");
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (showIdentityDialog && identityStatus?.status === "rejected") {
      setIdentityRealName(identityStatus.realName || "");
    }
  }, [showIdentityDialog, identityStatus]);

  const identitySubmitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/identity/submit", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "提交失败");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "提交成功", description: "实名认证申请已提交，请等待审核" });
      setShowIdentityDialog(false);
      setIdentityRealName("");
      setIdentityIdNumber("");
      setIdFrontImage(null);
      setIdBackImage(null);
      setIdFrontPreview("");
      setIdBackPreview("");
      refetchIdentityStatus();
    },
    onError: (error: any) => {
      toast({ title: "提交失败", description: error.message, variant: "destructive" });
    },
  });

  const { data: withdrawHistory, refetch: refetchWithdrawHistory } = useQuery({
    queryKey: ["/api/withdraw/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/withdraw/history");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: withdrawRules } = useQuery({
    queryKey: ["/api/withdraw/rules"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/withdraw/rules");
      return res.json();
    },
    enabled: !!user && showWithdrawDialog,
  });

  const handleWithdrawSubmit = async () => {
    if (isWithdrawing) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "请输入有效的提现金额", variant: "destructive" });
      return;
    }
    
    const minAmount = withdrawRules?.minAmount || 100;
    if (amount < minAmount) {
      toast({ title: `最低提现金额为${minAmount}元`, variant: "destructive" });
      return;
    }
    if (!withdrawAccount.trim()) {
      toast({ title: "请输入收款账户", variant: "destructive" });
      return;
    }

    setIsWithdrawing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/withdraw/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount,
          method: withdrawMethod,
          accountInfo: withdrawAccount,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "提现申请失败");
      }
      toast({ title: "提现申请已提交", description: "请等待审核" });
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      setWithdrawAccount("");
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      refetchWithdrawHistory();
    } catch (error: any) {
      toast({ title: "提现失败", description: error.message, variant: "destructive" });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleIdFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdFrontPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIdBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdBackPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIdentitySubmit = async () => {
    if (!identityRealName || identityRealName.length < 2) {
      toast({ title: "请输入真实姓名", variant: "destructive" });
      return;
    }
    if (!identityIdNumber || !/^\d{17}[\dXx]$/.test(identityIdNumber)) {
      toast({ title: "请输入有效的身份证号码", variant: "destructive" });
      return;
    }
    if (!idFrontImage || !idBackImage) {
      toast({ title: "请上传身份证正反面照片", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("realName", identityRealName);
    formData.append("idNumber", identityIdNumber);
    formData.append("idFrontImage", idFrontImage);
    formData.append("idBackImage", idBackImage);

    identitySubmitMutation.mutate(formData);
  };

  const inviteCode = user?.inviteCode || "ADMIN888";
  const inviteLink = `https://zhiyifu.net/invite?code=${inviteCode}`;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const pendingInviteCode = localStorage.getItem("pending_invite_code");
    const urlParams = new URLSearchParams(window.location.search);
    const shouldRegister = urlParams.get("register") === "true";
    
    if (pendingInviteCode || shouldRegister) {
      if (pendingInviteCode) {
        setInviteCodeInput(pendingInviteCode);
        localStorage.removeItem("pending_invite_code");
      }
      if (!user) {
        setIsRegisterMode(true);
        setShowLoginDialog(true);
      }
    }
  }, [user]);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast({ title: "请输入正确的手机号", variant: "destructive" });
      return;
    }
    if (countdown > 0 || isSendingCode) return;

    setIsSendingCode(true);
    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "验证码已发送", description: "请查收短信" });
        setCountdown(60);
      } else {
        toast({ title: "发送失败", description: data.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "发送失败", description: error.message, variant: "destructive" });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: "复制成功",
      description: "邀请链接已复制到剪贴板",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBenefitClick = (benefitId: string) => {
    if (!user && benefitId !== 'invite') {
      setShowLoginDialog(true);
      return;
    }
    
    switch (benefitId) {
      case 'invite':
        setShowInviteDialog(true);
        break;
      case 'commission':
        setLocation('/commission-rewards');
        break;
      case 'lottery':
        setShowLotteryDialog(true);
        break;
      case 'team':
        setLocation('/team');
        break;
    }
  };

  const handleCheckin = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    if (checkinStatus?.checkedToday) {
      toast({
        title: "今日已签到",
        description: "明天再来哦！",
      });
      return;
    }

    try {
      const result = await checkinMutation.mutateAsync();
      toast({
        title: "签到成功",
        description: `连续${result.streakCount}天签到，获得${result.rewardSpins}次抽奖机会和${result.bonusPoints}积分！`,
      });
    } catch (error: any) {
      toast({
        title: "签到失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitAuth = async () => {
    if (isSubmitting) return;
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast({ title: "请输入正确的手机号", variant: "destructive" });
      return;
    }
    if (!password || password.length < 6) {
      toast({ title: "密码至少6位", variant: "destructive" });
      return;
    }
    
    if (isRegisterMode) {
      if (!smsCode || smsCode.length !== 6) {
        toast({ title: "请输入6位验证码", variant: "destructive" });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: "两次密码不一致", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        await register(phone, password, inviteCodeInput || "", smsCode, confirmPassword);
        toast({ title: "注册成功", description: "欢迎加入云智医服！" });
        setLocation("/home");
      } else {
        await login(phone, password);
        toast({ title: "登录成功" });
        setLocation("/home");
      }
      setShowLoginDialog(false);
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setSmsCode("");
      setInviteCodeInput("");
    } catch (error: any) {
      toast({ title: isRegisterMode ? "注册失败" : "登录失败", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tasks = [
    { 
      title: '每日签到', 
      reward: '+10积分', 
      completed: checkinStatus?.checkedToday || false,
      action: () => setLocation('/checkin'),
    },
    { 
      title: '完成一次AI问诊', 
      reward: '+20积分', 
      completed: false,
      action: () => setLocation('/tools'),
    },
    { 
      title: '分享给好友', 
      reward: '+50积分', 
      completed: false,
      action: () => setShowInviteDialog(true),
    },
  ];

  return (
    <div className="page-container">
      <div className="gradient-primary px-6 pt-8 pb-24 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-10 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl -ml-20" />
        
        <div className="flex items-center justify-between relative z-10 mb-8">
          <h1 className="font-bold text-xl text-white text-shadow-sm">我的</h1>
          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={logout}
                className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            )}
            <button 
              onClick={() => setShowSettingsDialog(true)}
              className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-sm transition-colors"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-18 h-18 bg-white rounded-2xl p-1 shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center overflow-hidden w-16 h-16">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-white flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-shadow-sm">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</h3>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {(vipStatus?.vipLevel || user.vipLevel) > 0 ? (
                  <span className="badge-sm bg-amber-400/90 text-amber-900">VIP{vipStatus?.vipLevel || user.vipLevel}</span>
                ) : (
                  <span className="badge-sm bg-white/20 text-white/90">普通用户</span>
                )}
                {identityStatus?.status === "approved" && (
                  <span className="badge-sm bg-green-500/90 text-white">已实名</span>
                )}
                {referralSummary?.currentRank > 0 && (
                  <span className="badge-sm bg-white/20 text-white/90">{referralSummary.currentRankName}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginDialog(true)}
            className="flex items-center gap-4 relative z-10 w-full text-left group"
            data-testid="button-login-trigger"
          >
            <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg">
              <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="text-white flex-1">
              <h3 className="font-bold text-lg flex items-center gap-2 text-shadow-sm">
                点击登录/注册
                <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-white/80 mt-1">登录体验更多功能</p>
            </div>
          </button>
        )}
      </div>

      <div className="mx-4 -mt-16 relative z-20">
        <button 
          onClick={() => setLocation('/vip')}
          className="w-full bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-2xl p-4 shadow-lg border border-amber-200/50 cursor-pointer hover:shadow-xl transition-all shine text-left"
          data-testid="button-vip-banner"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-amber-800 font-bold block">VIP尊享权益</span>
                <span className="text-[10px] text-amber-600 font-medium bg-amber-200/50 px-2 py-0.5 rounded-full">新年特惠</span>
              </div>
            </div>
            <span className="btn-primary-gradient px-4 py-2 text-xs">
              立即查看
            </span>
          </div>
        </button>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="stat-card">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center mb-3">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <p className="stat-value">{wallet?.balancePoints || 0}</p>
          <p className="stat-label">我的积分</p>
          <div className="flex gap-2 mt-2 justify-center">
            <button onClick={(e) => { e.stopPropagation(); setLocation('/points-history'); }} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200">记录</button>
            <button onClick={(e) => { e.stopPropagation(); setLocation('/points-rules'); }} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200">说明</button>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 gradient-success rounded-xl flex items-center justify-center mb-3">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <p className="stat-value">
            {parseFloat(wallet?.balanceCashAvailable || '0').toFixed(2)} 
            <span className="text-sm font-normal text-gray-400 ml-1">¥</span>
          </p>
          <p className="stat-label">账户余额</p>
          
          {/* Frozen Balance Info */}
          {(vipStatus && vipStatus.frozenCommission !== undefined) && (
            <div className="mt-1 flex items-center justify-center gap-1">
              <div className="text-[10px] text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>待领取: ¥{parseFloat(vipStatus?.frozenCommission || '0').toFixed(2)}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowUnlockModal(true); }}
                className="text-[10px] text-white bg-purple-500 px-2 py-0.5 rounded-full hover:bg-purple-600 transition-colors"
              >
                解冻
              </button>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setLocation('/deposit')}
              className="flex-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              data-testid="button-deposit"
            >
              充值
            </button>
            <button
              onClick={() => {
                if (!user) {
                  setShowLoginDialog(true);
                  return;
                }
                setShowWithdrawDialog(true);
              }}
              className="flex-1 px-2 py-1 bg-orange-500/10 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-500/20 transition-colors"
              data-testid="button-withdraw"
            >
              提现
            </button>
            <button
              onClick={() => setLocation('/transactions')}
              className="flex-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              明细
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        <button 
          onClick={() => setLocation('/help')}
          className="card-elevated p-4 text-center hover:bg-gray-50/50 transition-colors"
        >
           <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
           </div>
           <p className="font-bold text-gray-800">帮助中心</p>
           <p className="text-xs text-gray-400 mt-1">常见问题与说明</p>
        </button>

        <button 
          onClick={() => setLocation('/checkin')}
          className="card-elevated p-4 text-center hover:bg-gray-50/50 transition-colors"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
             <CalendarCheck className="w-5 h-5 text-green-500" />
          </div>
          <p className="font-bold text-gray-800">连续签到</p>
          <p className="text-xs text-gray-400 mt-1">已连续{checkinStatus?.currentStreak || 0}天</p>
        </button>
      </div>

      <div className="px-4 mt-6">
        <h3 className="section-title mb-3">福利中心</h3>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit) => (
            <button
              key={benefit.id}
              onClick={() => handleBenefitClick(benefit.id)}
              className={`card-elevated p-4 flex items-center gap-3 hover:shadow-md transition-all text-left bg-gradient-to-br ${benefit.gradient}`}
              data-testid={`button-benefit-${benefit.id}`}
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                {benefit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm truncate">{benefit.title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{benefit.description}</p>
                <span className="text-[10px] text-primary font-semibold mt-1 inline-block">{benefit.action}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6 mb-4">
        <h3 className="font-bold text-lg text-gray-800 mb-3">
          每日任务
        </h3>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl p-4 flex items-center justify-between border border-blue-100/30"
            >
              <div className="flex flex-col">
                <p className="font-bold text-gray-800 text-sm mb-1">{task.title}</p>
                <p className="text-xs text-gray-500">{task.reward}</p>
              </div>
              <button
                onClick={task.action}
                disabled={task.completed}
                className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all ${
                  task.completed 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow'
                }`}
              >
                {task.completed ? '已完成' : '去完成'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">{isRegisterMode ? '注册账号' : '登录账号'}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-400">{isRegisterMode ? '创建账号享受完整功能' : '登录后可享受完整功能'}</p>
            </div>

            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-modern"
              maxLength={11}
              data-testid="input-phone"
            />

            {isRegisterMode && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                  className="input-modern flex-1"
                  maxLength={6}
                  data-testid="input-sms-code"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode}
                  className="px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  data-testid="button-send-code"
                >
                  {countdown > 0 ? `${countdown}秒` : isSendingCode ? '发送中...' : '获取验证码'}
                </button>
              </div>
            )}
            
            <input
              type="password"
              placeholder="请输入密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-modern"
              data-testid="input-password"
            />

            {isRegisterMode && (
              <>
                <input
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-modern"
                  data-testid="input-confirm-password"
                />
                <input
                  type="text"
                  placeholder="请输入邀请码（选填）"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  className="input-modern"
                  data-testid="input-invite-code"
                />
              </>
            )}

            <button
              onClick={handleSubmitAuth}
              disabled={isSubmitting}
              className="btn-primary-gradient w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              data-testid="button-login-submit"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? '处理中...' : (isRegisterMode ? '注册' : '登录')}
            </button>

            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="w-full text-primary text-sm py-2 font-medium"
            >
              {isRegisterMode ? '已有账号？点击登录' : '没有账号？点击注册'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              登录即表示同意《用户协议》和《隐私政策》
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <LotteryWheel
        open={showLotteryDialog}
        onOpenChange={setShowLotteryDialog}
        onWin={(prize) => {
          toast({
            title: "抽奖结果",
            description: `您获得了：${prize}`,
          });
        }}
      />

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-[90%] w-[350px] mx-auto rounded-2xl px-0 overflow-hidden">
          <DialogHeader className="pt-6">
            <DialogTitle className="text-center flex items-center justify-center gap-2 font-bold">
              <Share2 className="w-5 h-5 text-primary" />
              邀请好友
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            <div className="gradient-primary rounded-2xl p-6 text-center text-white shine">
              <h3 className="font-bold text-lg mb-2 text-shadow-sm">邀请好友得奖励</h3>
              <p className="text-sm text-white/80">每邀请一位好友注册，获得50积分</p>
              <div className="mt-4 bg-white/15 rounded-xl py-3 px-4 backdrop-blur-sm">
                <p className="text-xs text-white/70 mb-1">我的邀请码</p>
                <p className="font-bold text-xl tracking-wider">{inviteCode}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">邀请链接</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm text-gray-600 truncate font-mono">{inviteLink}</p>
                <button
                  onClick={handleCopyInvite}
                  className="p-2.5 gradient-primary text-white rounded-xl shadow-lg flex-shrink-0"
                  data-testid="button-copy-invite"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                已邀请 <span className="text-primary font-bold">{referralSummary?.directCount || 0}</span> 位好友
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 font-bold">
              <Settings className="w-5 h-5 text-gray-600" />
              设置
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-2">
            <button
              onClick={() => {
                const newMode = !isDarkMode;
                setIsDarkMode(newMode);
                if (newMode) {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                }
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-toggle-theme"
            >
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <span className="font-medium">深色模式</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-300'} relative`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </button>

            <button
              onClick={() => {
                setShowSettingsDialog(false);
                setShowIdentityDialog(true);
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-identity-verification"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <span className="font-medium">实名认证</span>
              </div>
              <div className="flex items-center gap-2">
                {identityStatus?.status === "approved" && (
                  <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded">已认证</span>
                )}
                {identityStatus?.status === "pending" && (
                  <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded">审核中</span>
                )}
                {identityStatus?.status === "rejected" && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">未通过</span>
                )}
                {(!identityStatus || identityStatus?.status === "none") && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">未认证</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                toast({
                  title: "缓存已清除",
                  description: "应用缓存已成功清除",
                });
              }}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-clear-cache"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="font-medium">清除缓存</span>
            </button>

            <button
              onClick={() => setLocation('/service')}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-contact-service"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">联系客服</span>
            </button>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-400">云智医服 v1.0.0</p>
                <p className="text-xs text-gray-400">云端智能医疗服务平台</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIdentityDialog} onOpenChange={setShowIdentityDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 font-bold">
              <CreditCard className="w-5 h-5 text-blue-500" />
              实名认证
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {identityStatus?.status === "approved" ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-green-600">已完成实名认证</p>
                  <p className="text-sm text-gray-500 mt-1">姓名：{identityStatus.realName}</p>
                  <p className="text-sm text-gray-500">身份证：{identityStatus.idNumber}</p>
                </div>
              </div>
            ) : identityStatus?.status === "pending" ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-amber-600">审核中</p>
                  <p className="text-sm text-gray-500 mt-1">您的实名认证申请正在审核中，请耐心等待</p>
                </div>
              </div>
            ) : (
              <>
                {identityStatus?.status === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600">上次申请未通过：{identityStatus.reviewNote || "请重新提交"}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                    <input
                      type="text"
                      value={identityRealName}
                      onChange={(e) => setIdentityRealName(e.target.value)}
                      placeholder="请输入身份证上的姓名"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="input-identity-realname"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">身份证号码</label>
                    <input
                      type="text"
                      value={identityIdNumber}
                      onChange={(e) => setIdentityIdNumber(e.target.value.toUpperCase())}
                      placeholder="请输入18位身份证号码"
                      maxLength={18}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="input-identity-idnumber"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">身份证正面（人像面）</label>
                    <input
                      type="file"
                      ref={idFrontInputRef}
                      onChange={handleIdFrontChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => idFrontInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {idFrontPreview ? (
                        <img src={idFrontPreview} alt="身份证正面" className="max-h-32 mx-auto rounded" />
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-500">点击上传身份证正面</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">身份证背面（国徽面）</label>
                    <input
                      type="file"
                      ref={idBackInputRef}
                      onChange={handleIdBackChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => idBackInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {idBackPreview ? (
                        <img src={idBackPreview} alt="身份证背面" className="max-h-32 mx-auto rounded" />
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-500">点击上传身份证背面</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-amber-700">
                    <Info className="w-3 h-3 inline mr-1" />
                    请确保照片清晰完整，信息真实有效。您的信息将被严格保密，仅用于身份核验。
                  </p>
                </div>
                
                <button
                  onClick={handleIdentitySubmit}
                  disabled={identitySubmitMutation.isPending}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-submit-identity"
                >
                  {identitySubmitMutation.isPending ? "提交中..." : "提交认证"}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 font-bold">
              <ArrowDownCircle className="w-5 h-5 text-orange-500" />
              申请提现
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">可提现余额</p>
              <p className="text-2xl font-bold text-orange-600">
                ¥{parseFloat(wallet?.balanceCashAvailable || '0').toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">提现金额</label>
              <input
                type="number"
                placeholder={`请输入提现金额（最低${withdrawRules?.minAmount || 100}元）`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="input-modern"
                min={withdrawRules?.minAmount || 100}
                step="0.01"
                data-testid="input-withdraw-amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">提现方式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setWithdrawMethod("alipay")}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    withdrawMethod === "alipay" 
                      ? "border-blue-500 bg-blue-50 text-blue-600" 
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  支付宝
                </button>
                <button
                  onClick={() => setWithdrawMethod("wechat")}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    withdrawMethod === "wechat" 
                      ? "border-green-500 bg-green-50 text-green-600" 
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  微信
                </button>
                <button
                  onClick={() => setWithdrawMethod("bank")}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    withdrawMethod === "bank" 
                      ? "border-orange-500 bg-orange-50 text-orange-600" 
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  银行卡
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {withdrawMethod === "alipay" ? "支付宝账号" : withdrawMethod === "wechat" ? "微信号" : "银行卡号"}
              </label>
              <input
                type="text"
                placeholder={`请输入${withdrawMethod === "alipay" ? "支付宝账号" : withdrawMethod === "wechat" ? "微信号" : "银行卡号"}`}
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                className="input-modern"
                data-testid="input-withdraw-account"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                <Info className="w-3 h-3 inline mr-1" />
                提现申请提交后，将由管理员审核。审核通过后，金额将转入您的账户。
              </p>
            </div>

            <button
              onClick={handleWithdrawSubmit}
              disabled={isWithdrawing}
              className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="button-submit-withdraw"
            >
              {isWithdrawing ? "提交中..." : "提交提现申请"}
            </button>

            {withdrawHistory && withdrawHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <History className="w-4 h-4" />
                  提现记录
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {withdrawHistory.slice(0, 5).map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">¥{record.amount}</span>
                        <span className="text-gray-400 text-xs ml-2">
                          {new Date(record.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        record.status === "applied" ? "bg-orange-100 text-orange-600" :
                        record.status === "approved" ? "bg-green-100 text-green-600" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {record.status === "applied" ? "审核中" : record.status === "approved" ? "已通过" : "已拒绝"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <VipFrozenUnlockModal 
        open={showUnlockModal} 
        onOpenChange={setShowUnlockModal}
        vipStatus={vipStatus}
      />
    </div>
  );
}
