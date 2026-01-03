import { useState } from "react";
import { useLocation } from "wouter";
import { User, Gift, Share2, Crown, Settings, Wallet, LogIn, Copy, Check, ChevronRight, Clock, Zap, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useWallet, useCheckinStatus, useCheckin, useSpinBalance, useReferralSummary } from "@/hooks/use-api";
import LotteryWheel from "@/components/LotteryWheel";

const benefits = [
  { id: 'lottery', title: '转盘奖励', description: '资助贡献值', action: '去抽奖', icon: <Gift className="w-5 h-5 text-red-500" /> },
  { id: 'agent', title: '分佣奖励', description: '申请代理', action: '去开通', icon: <Zap className="w-5 h-5 text-yellow-500" /> },
  { id: 'invite', title: '邀请好友', description: '无限福利', action: '去邀请', icon: <Share2 className="w-5 h-5 text-blue-500" /> },
  { id: 'vip', title: '月卡季卡', description: 'AI会员套餐', action: '立即开通', icon: <Crown className="w-5 h-5 text-amber-500" /> },
];

export default function MinePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login, register, logout, isLoading: authLoading } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLotteryDialog, setShowLotteryDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: wallet } = useWallet();
  const { data: checkinStatus } = useCheckinStatus();
  const { data: spinBalance } = useSpinBalance();
  const { data: referralSummary } = useReferralSummary();
  const checkinMutation = useCheckin();

  const inviteCode = user?.inviteCode || "ADMIN888";
  const inviteLink = `https://365zhmz.com/invite?code=${inviteCode}`;

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
        toast({
          title: "VIP会员",
          description: "VIP会员功能即将上线，敬请期待！",
        });
        break;
      case 'lottery':
        setShowLotteryDialog(true);
        break;
      case 'agent':
        toast({
          title: "代理申请",
          description: "代理功能即将上线，敬请期待！",
        });
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
    
    if (!phone || phone.length !== 11) {
      toast({ title: "请输入正确的手机号", variant: "destructive" });
      return;
    }
    if (!password || password.length < 6) {
      toast({ title: "密码至少6位", variant: "destructive" });
      return;
    }
    if (isRegisterMode && !inviteCodeInput) {
      toast({ title: "请输入邀请码", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        await register(phone, password, inviteCodeInput);
        toast({ title: "注册成功", description: "欢迎加入365智慧问诊！" });
      } else {
        await login(phone, password);
        toast({ title: "登录成功" });
      }
      setShowLoginDialog(false);
      setPhone("");
      setPassword("");
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
      action: handleCheckin,
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
    <div className="pb-24 min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-6 pt-8 pb-20 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex items-center justify-between relative z-10 mb-8">
          <h1 className="font-bold text-xl text-white">我的</h1>
          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={logout}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            )}
            <button 
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-white flex-1">
              <h3 className="font-bold text-lg">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</h3>
              <p className="text-sm opacity-80 mt-1">
                {user.vipLevel > 0 ? `VIP${user.vipLevel}会员` : '普通用户'}
                {referralSummary?.currentRank > 0 && ` · ${referralSummary.currentRankName}`}
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginDialog(true)}
            className="flex items-center gap-4 relative z-10 w-full text-left"
            data-testid="button-login-trigger"
          >
            <div className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="text-white flex-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                点击登录/注册
                <ChevronRight className="w-4 h-4 opacity-70" />
              </h3>
              <p className="text-sm opacity-80 mt-1">登录体验更多功能</p>
            </div>
          </button>
        )}
      </div>

      <div className="mx-4 -mt-12 relative z-20">
        <div 
          onClick={() => handleBenefitClick('vip')}
          className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-2xl p-4 shadow-lg border border-amber-200 cursor-pointer hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-amber-800 font-bold block">VIP医疗守护金</span>
                <span className="text-[10px] text-amber-600 font-medium bg-amber-200/50 px-1.5 py-0.5 rounded">新年特惠</span>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-full shadow-md transition-colors">
              立即查看
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary mb-2">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{wallet?.balancePoints || 0}</p>
            <p className="text-xs text-gray-500 font-medium">我的积分</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-2">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {parseFloat(wallet?.balanceCashAvailable || '0').toFixed(2)} 
              <span className="text-sm font-normal text-gray-400">¥</span>
            </p>
            <p className="text-xs text-gray-500 font-medium">账户余额</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-primary">{spinBalance?.availableSpins || 0}</p>
          <p className="text-xs text-gray-500">抽奖次数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-orange-500">{checkinStatus?.currentStreak || 0}</p>
          <p className="text-xs text-gray-500">连续签到天数</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <h3 className="font-bold text-gray-800 mb-4 px-1">福利中心</h3>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit) => (
            <button
              key={benefit.id}
              onClick={() => handleBenefitClick(benefit.id)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md hover:border-blue-100 transition-all text-left"
              data-testid={`button-benefit-${benefit.id}`}
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                {benefit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{benefit.title}</h4>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{benefit.description}</p>
                <span className="text-[10px] text-primary font-medium mt-1 inline-block">{benefit.action}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <h3 className="font-bold text-gray-800 mb-4 px-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          每日任务
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {tasks.map((task, index) => (
            <button
              key={index}
              onClick={task.action}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              data-testid={`button-task-${index}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Gift className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                  <p className="text-xs text-green-600 font-medium">{task.reward}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${task.completed ? 'text-gray-400 bg-gray-100' : 'text-primary bg-blue-50'}`}>
                {task.completed ? '已完成' : '去完成'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{isRegisterMode ? '注册账号' : '登录账号'}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <p className="text-sm text-gray-500">{isRegisterMode ? '创建账号享受完整功能' : '登录后可享受完整功能'}</p>
            </div>

            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              data-testid="input-phone"
            />
            
            <input
              type="password"
              placeholder="请输入密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              data-testid="input-password"
            />

            {isRegisterMode && (
              <input
                type="text"
                placeholder="请输入邀请码"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                data-testid="input-invite-code"
              />
            )}

            <button
              onClick={handleSubmitAuth}
              disabled={isSubmitting}
              className="w-full bg-primary text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              data-testid="button-login-submit"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? '处理中...' : (isRegisterMode ? '注册' : '登录')}
            </button>

            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="w-full text-primary text-sm py-2"
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
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              邀请好友
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-center text-white">
              <h3 className="font-bold text-lg mb-2">邀请好友得奖励</h3>
              <p className="text-sm opacity-90">每邀请一位好友注册，获得50积分</p>
              <div className="mt-4 bg-white/20 rounded-xl py-3 px-4">
                <p className="text-xs opacity-80 mb-1">我的邀请码</p>
                <p className="font-bold text-xl tracking-wider">{inviteCode}</p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">邀请链接</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm text-gray-700 truncate">{inviteLink}</p>
                <button
                  onClick={handleCopyInvite}
                  className="p-2 bg-primary text-white rounded-lg flex-shrink-0"
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
    </div>
  );
}
