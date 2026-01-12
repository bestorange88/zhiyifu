import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, Gift, Share2, Crown, Settings, Wallet, LogIn, Copy, Check, ChevronRight, Clock, Zap, LogOut, Sparkles, Moon, Sun, Trash2, Info, Shield, MessageCircle, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useWallet, useCheckinStatus, useCheckin, useSpinBalance, useReferralSummary } from "@/hooks/use-api";
import LotteryWheel from "@/components/LotteryWheel";

const benefits = [
  { id: 'lottery', title: '转盘奖励', description: '资助贡献值', action: '去抽奖', icon: <Gift className="w-5 h-5 text-rose-500" />, gradient: 'from-rose-50 to-pink-50' },
  { id: 'agent', title: '分佣奖励', description: '申请代理', action: '去开通', icon: <Zap className="w-5 h-5 text-amber-500" />, gradient: 'from-amber-50 to-orange-50' },
  { id: 'invite', title: '邀请好友', description: '无限福利', action: '去邀请', icon: <Share2 className="w-5 h-5 text-blue-500" />, gradient: 'from-blue-50 to-indigo-50' },
  { id: 'vip', title: '月卡季卡', description: 'AI会员套餐', action: '立即开通', icon: <Crown className="w-5 h-5 text-amber-500" />, gradient: 'from-amber-50 to-yellow-50' },
];

export default function MinePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login, register, logout, isLoading: authLoading } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLotteryDialog, setShowLotteryDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const inviteCode = user?.inviteCode || "ADMIN888";
  const inviteLink = `https://365zhmz.com/invite?code=${inviteCode}`;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      case 'vip':
        setLocation('/vip');
        break;
      case 'lottery':
        setShowLotteryDialog(true);
        break;
      case 'agent':
        setLocation('/referral');
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
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            code: smsCode,
            password,
            confirmPassword,
            inviteCode: inviteCodeInput || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "注册失败");
        }
        localStorage.setItem("auth_token", data.token);
        toast({ title: "注册成功", description: "欢迎加入云智医服！" });
        window.location.reload();
      } else {
        await login(phone, password);
        toast({ title: "登录成功" });
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
              <h3 className="font-bold text-lg text-shadow-sm">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                {user.vipLevel > 0 ? (
                  <span className="badge-sm bg-amber-400/90 text-amber-900">VIP{user.vipLevel}</span>
                ) : (
                  <span className="badge-sm bg-white/20 text-white/90">普通用户</span>
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
          onClick={() => handleBenefitClick('vip')}
          className="w-full bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-2xl p-4 shadow-lg border border-amber-200/50 cursor-pointer hover:shadow-xl transition-all shine text-left"
          data-testid="button-vip-banner"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-amber-800 font-bold block">VIP医疗守护金</span>
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
        </div>
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        <div className="card-elevated p-4 text-center">
          <p className="text-2xl font-bold text-primary">{spinBalance?.availableSpins || 0}</p>
          <p className="text-xs text-gray-400 mt-1">抽奖次数</p>
        </div>
        <button 
          onClick={() => setLocation('/checkin')}
          className="card-elevated p-4 text-center hover:bg-gray-50/50 transition-colors"
          data-testid="button-checkin-streak"
        >
          <p className="text-2xl font-bold text-orange-500">{checkinStatus?.currentStreak || 0}</p>
          <p className="text-xs text-gray-400 mt-1">连续签到</p>
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
        <h3 className="section-title mb-3">
          <Clock className="w-4 h-4 text-primary" />
          每日任务
        </h3>
        <div className="card-elevated divide-y divide-gray-50">
          {tasks.map((task, index) => (
            <button
              key={index}
              onClick={task.action}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
              data-testid={`button-task-${index}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${task.completed ? 'bg-gray-100' : 'gradient-primary'}`}>
                  <Gift className={`w-4 h-4 ${task.completed ? 'text-gray-400' : 'text-white'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                  <p className="text-xs text-emerald-500 font-medium">{task.reward}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${task.completed ? 'text-gray-400 bg-gray-100' : 'text-primary bg-primary/10'}`}>
                {task.completed ? '已完成' : '去完成'}
              </span>
            </button>
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
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 font-bold">
              <Share2 className="w-5 h-5 text-primary" />
              邀请好友
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
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
    </div>
  );
}
