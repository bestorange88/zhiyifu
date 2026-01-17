import { useState } from "react";
import { useLocation } from "wouter";
import { Crown, ArrowLeft, Check, Zap, Gift, Clock, Shield, Star, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VipLevel {
  id: number;
  level: number;
  name: string;
  priceCents: number;
  priceYuan: number;
  upgradeRewardCents: number;
  upgradeRewardYuan: number;
  dailyLottery: number;
  withdrawMinYuan: number;
  withdrawSpeed: string;
  winMultiplier: string;
  directRequired: number;
  team3GenRequired: number;
  upgradeCommission: {
    directRate: number;
    indirectRate: number;
  };
  lotteryCommission: {
    directRate: number;
    indirectRate: number;
  };
}

interface VipStatus {
  vipLevel: number;
  vipName: string;
  expireAt: string | null;
  qualified: boolean;
  directCount: number;
  team3GenCount: number;
  frozenCommission: number;
  requirements: {
    directRequired: number;
    team3GenRequired: number;
    directMet: boolean;
    team3GenMet: boolean;
  };
}

const rankColors: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
  1: { 
    bg: "from-slate-100 to-slate-200", 
    border: "border-slate-300",
    badge: "bg-slate-600",
    icon: "text-slate-600"
  },
  2: { 
    bg: "from-amber-100 to-yellow-200", 
    border: "border-amber-400",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-500",
    icon: "text-amber-600"
  },
  3: { 
    bg: "from-teal-100 to-emerald-200", 
    border: "border-teal-400",
    badge: "bg-gradient-to-r from-teal-500 to-emerald-500",
    icon: "text-teal-600"
  },
  4: { 
    bg: "from-purple-100 via-pink-100 to-rose-100", 
    border: "border-purple-400",
    badge: "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500",
    icon: "text-purple-600"
  },
  5: { 
    bg: "from-rose-100 via-orange-100 to-amber-100", 
    border: "border-rose-400",
    badge: "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500",
    icon: "text-rose-600"
  },
};

export default function VipPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<VipLevel | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(1);

  const { data: levels, isLoading } = useQuery<VipLevel[]>({
    queryKey: ["/api/vip/levels"],
  });

  const { data: vipStatus } = useQuery<VipStatus>({
    queryKey: ["/api/vip/status"],
    enabled: !!user,
  });

  const buyMutation = useMutation({
    mutationFn: async (level: number) => {
      const buyRes = await apiRequest("POST", "/api/vip/buy", { level });
      const buyData = await buyRes.json();
      
      const confirmRes = await apiRequest("POST", "/api/vip/confirm", { orderId: buyData.orderId });
      return confirmRes.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vip/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referral/summary"] });
      toast({
        title: "开通成功",
        description: `恭喜您成为${selectedLevel?.name}会员！${data.rewardYuan && data.rewardYuan > 0 ? `获得¥${data.rewardYuan}现金奖励` : ''}`,
      });
      setShowConfirmDialog(false);
      setSelectedLevel(null);
    },
    onError: (error: any) => {
      toast({
        title: "开通失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectLevel = (level: VipLevel) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可开通VIP会员",
        variant: "destructive",
      });
      return;
    }
    setSelectedLevel(level);
    setShowConfirmDialog(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedLevel) {
      buyMutation.mutate(selectedLevel.level);
    }
  };

  const getFeatures = (level: VipLevel) => {
    const features = [];
    features.push(`${level.dailyLottery}次/日抽奖机会`);
    features.push(`提现最低${level.withdrawMinYuan}元起`);
    features.push(`${level.withdrawSpeed}到账速度`);
    features.push(`中奖倍率${level.winMultiplier}x`);
    features.push(`直推${(level.upgradeCommission.directRate * 100).toFixed(0)}%分佣`);
    if (level.upgradeCommission.indirectRate > 0) {
      features.push(`间推${(level.upgradeCommission.indirectRate * 100).toFixed(0)}%分佣`);
    }
    return features;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 px-4 pt-4 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-10" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-yellow-300/20 rounded-full blur-3xl -ml-20 mb-10" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={() => setLocation("/mine")}
            className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
            data-testid="button-back-vip"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">VIP会员中心</h1>
        </div>

        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Crown className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-shadow-sm">尊享VIP特权</h2>
          <p className="text-white/80 text-sm">开通会员 · 享受更多专属权益</p>
          
          {user && vipStatus && vipStatus.vipLevel > 0 && (
            <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block backdrop-blur-sm">
              <p className="text-sm">
                当前等级：<span className="font-bold">{vipStatus.vipName}</span>
                {vipStatus.qualified ? (
                  <span className="ml-2 text-xs bg-green-500/30 px-2 py-0.5 rounded-full">已达标</span>
                ) : (
                  <span className="ml-2 text-xs bg-amber-500/30 px-2 py-0.5 rounded-full">待达标</span>
                )}
              </p>
              {vipStatus.expireAt && (
                <p className="text-xs text-white/70 mt-1">
                  到期时间：{new Date(vipStatus.expireAt).toLocaleDateString()}
                </p>
              )}
              {!vipStatus.qualified && (
                <p className="text-xs text-white/70 mt-1">
                  直推: {vipStatus.directCount}/{vipStatus.requirements.directRequired} | 
                  三代: {vipStatus.team3GenCount}/{vipStatus.requirements.team3GenRequired}
                </p>
              )}
              {vipStatus.frozenCommission > 0 && (
                <p className="text-xs text-amber-200 mt-1">
                  待解冻佣金: ¥{vipStatus.frozenCommission.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20 pb-8">
        {/* V1-V5 Level Tabs */}
        {levels && levels.length > 0 && (
          <div className="flex justify-center mb-4 bg-white rounded-2xl p-2 shadow-lg">
            {levels.map((level) => {
              const colors = rankColors[level.level] || rankColors[1];
              const isActive = activeTab === level.level;
              return (
                <button
                  key={level.level}
                  onClick={() => setActiveTab(level.level)}
                  className={cn(
                    "flex-1 py-2 px-1 rounded-xl text-center transition-all text-sm font-medium",
                    isActive 
                      ? `bg-gradient-to-br ${colors.bg} ${colors.border} border shadow-sm` 
                      : "text-gray-500 hover:text-gray-800"
                  )}
                  data-testid={`tab-v${level.level}`}
                >
                  <span className={cn(isActive && colors.icon)}>V{level.level}</span>
                </button>
              );
            })}
          </div>
        )}

        {levels && levels.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              会员权益对比
            </h3>
            <div className="overflow-x-auto">
              <div className={`grid gap-1 text-center text-xs min-w-[400px]`} style={{ gridTemplateColumns: `repeat(${levels.length + 1}, minmax(0, 1fr))` }}>
                <div className="font-medium text-gray-500">权益</div>
                {levels.map((l) => (
                  <div key={`name-${l.level}`} className={`font-bold ${rankColors[l.level]?.icon || 'text-gray-600'}`}>
                    {l.name}
                  </div>
                ))}
                
                <div className="text-gray-500 py-2 border-t">开通费</div>
                {levels.map((l) => (
                  <div key={`fee-${l.level}`} className="py-2 border-t">¥{l.priceYuan}</div>
                ))}
                
                <div className="text-gray-500 py-2 border-t">抽奖/日</div>
                {levels.map((l) => (
                  <div key={`spin-${l.level}`} className="py-2 border-t">{l.dailyLottery}次</div>
                ))}
                
                <div className="text-gray-500 py-2 border-t">中奖倍率</div>
                {levels.map((l) => (
                  <div key={`mult-${l.level}`} className="py-2 border-t">{l.winMultiplier}x</div>
                ))}
                
                <div className="text-gray-500 py-2 border-t">现金奖励</div>
                {levels.map((l) => (
                  <div key={`bonus-${l.level}`} className={`py-2 border-t ${l.upgradeRewardYuan > 0 ? "text-orange-500 font-bold" : ""}`}>
                    {l.upgradeRewardYuan > 0 ? `¥${l.upgradeRewardYuan}` : "-"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-10 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {levels?.map((level) => {
              const colors = rankColors[level.level] || rankColors[1];
              const features = getFeatures(level);
              const currentLevel = vipStatus?.vipLevel || 0;
              const isCurrentLevel = currentLevel === level.level;
              const isAlreadyOwned = currentLevel >= level.level;
              const canUpgrade = level.level === currentLevel + 1;
              const isLocked = level.level > currentLevel + 1;
              const cashBonus = level.upgradeRewardYuan;
              
              return (
                <div
                  key={level.id}
                  className={cn(
                    "bg-gradient-to-br rounded-2xl p-5 shadow-lg border-2 relative overflow-hidden",
                    colors.bg,
                    colors.border,
                    isCurrentLevel && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {level.level === 5 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                        最高等级
                      </span>
                    </div>
                  )}
                  {level.level === 3 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                        最受欢迎
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.badge)}>
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{level.name}</h3>
                        <p className="text-xs text-orange-600 font-medium">开通费: ¥{level.priceYuan}</p>
                      </div>
                    </div>
                    {cashBonus > 0 && (
                      <span className="text-orange-500 font-bold text-sm">
                        奖励¥{level.upgradeRewardYuan}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 mb-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2">
                      直推{level.directRequired}人
                    </span>
                    {level.team3GenRequired > 0 && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        三代内{level.team3GenRequired}人
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                      直推{(level.upgradeCommission.directRate * 100).toFixed(0)}%
                    </span>
                    {level.upgradeCommission.indirectRate > 0 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                        间推{(level.upgradeCommission.indirectRate * 100).toFixed(0)}%
                      </span>
                    )}
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded">
                      {level.dailyLottery}次/日抽奖
                    </span>
                    <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded">
                      {level.winMultiplier}x倍率
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-5">
                    {features.slice(0, 5).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className={cn("w-4 h-4 flex-shrink-0", colors.icon)} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSelectLevel(level)}
                    disabled={isAlreadyOwned || isLocked}
                    className={cn(
                      "w-full",
                      isAlreadyOwned
                        ? "bg-gray-200 text-gray-500"
                        : isLocked
                        ? "bg-gray-300 text-gray-500"
                        : level.level === 5
                        ? "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600"
                        : level.level === 4
                        ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600"
                        : level.level === 3
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                        : level.level === 2
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                        : "bg-slate-600 hover:bg-slate-700"
                    )}
                    data-testid={`button-select-level-${level.level}`}
                  >
                    {isCurrentLevel ? "当前等级" : isAlreadyOwned ? "已开通" : isLocked ? `需先开通VIP${level.level - 1}` : "立即开通"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            会员保障
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">即时生效</p>
                <p className="text-xs text-gray-400">开通即享权益</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">现金奖励</p>
                <p className="text-xs text-gray-400">高级VIP享奖励</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">24小时服务</p>
                <p className="text-xs text-gray-400">专属客服响应</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">推广分成</p>
                <p className="text-xs text-gray-400">邀请好友赚佣金</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 px-4">
          开通VIP即表示同意《VIP服务协议》
          <br />
          如有问题请联系客服
        </p>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              确认开通
            </DialogTitle>
          </DialogHeader>

          {selectedLevel && (
            <div className="py-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{selectedLevel.name}</h3>
                <p className="text-sm text-gray-500 mt-1">30天会员权益</p>
                <div className="mt-4 text-3xl font-bold text-orange-500">
                  ¥{selectedLevel.priceYuan}
                </div>
                {selectedLevel.upgradeRewardYuan > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    开通即送 ¥{selectedLevel.upgradeRewardYuan} 现金奖励
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p className="flex items-center justify-between">
                  <span>每日抽奖次数</span>
                  <span className="font-medium">{selectedLevel.dailyLottery}次</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>提现门槛</span>
                  <span className="font-medium">{selectedLevel.withdrawMinYuan}元起</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>到账速度</span>
                  <span className="font-medium">{selectedLevel.withdrawSpeed}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>中奖倍率</span>
                  <span className="font-medium">{selectedLevel.winMultiplier}x</span>
                </p>
              </div>

              <Button
                onClick={handleConfirmPurchase}
                disabled={buyMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                data-testid="button-confirm-level"
              >
                {buyMutation.isPending ? "处理中..." : "确认支付"}
              </Button>

              <p className="text-center text-xs text-gray-400 mt-3">
                支付后将从账户余额扣除
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
