import { useState } from "react";
import { useLocation } from "wouter";
import { Crown, ArrowLeft, Check, Zap, Gift, Clock, Shield, Star, Sparkles, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VipPlan {
  id: number;
  level: number;
  name: string;
  price: string;
  dailyExtraSpins: number;
  withdrawMinAmount: string;
  withdrawSpeed: string;
  winMultiplier: string;
}

interface VipStatus {
  level: number;
  name: string;
  expireAt: string | null;
  dailyExtraSpins: number;
  withdrawMinAmount: string;
  withdrawSpeed: string;
}

const planFeatures: Record<number, string[]> = {
  1: [
    "每日额外2次抽奖机会",
    "提现最低50元起",
    "T+1到账速度",
    "中奖倍率1.2倍",
    "专属VIP客服",
  ],
  2: [
    "每日额外5次抽奖机会",
    "提现最低30元起",
    "T+0即时到账",
    "中奖倍率1.5倍",
    "专属VIP客服",
    "AI工具无限使用",
  ],
  3: [
    "每日额外10次抽奖机会",
    "提现最低20元起",
    "T+0即时到账",
    "中奖倍率2.0倍",
    "专属VIP客服",
    "AI工具无限使用",
    "专属推广佣金加成",
    "优先参与新功能测试",
  ],
};

const planColors: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
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
    bg: "from-purple-100 via-pink-100 to-rose-100", 
    border: "border-purple-400",
    badge: "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500",
    icon: "text-purple-600"
  },
};

export default function VipPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: plans, isLoading } = useQuery<VipPlan[]>({
    queryKey: ["/api/vip/plans"],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vip/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      toast({
        title: "开通成功",
        description: `恭喜您成为${selectedPlan?.name}会员！`,
      });
      setShowConfirmDialog(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "开通失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (plan: VipPlan) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可开通VIP会员",
        variant: "destructive",
      });
      return;
    }
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedPlan) {
      buyMutation.mutate(selectedPlan.level);
    }
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
          
          {user && vipStatus && vipStatus.level > 0 && (
            <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block backdrop-blur-sm">
              <p className="text-sm">
                当前等级：<span className="font-bold">{vipStatus.name}</span>
              </p>
              {vipStatus.expireAt && (
                <p className="text-xs text-white/70 mt-1">
                  到期时间：{new Date(vipStatus.expireAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20 pb-8">
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            会员权益对比
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="font-medium text-gray-500">权益</div>
            <div className="font-bold text-slate-600">VIP1</div>
            <div className="font-bold text-amber-600">VIP2</div>
            <div className="font-bold text-purple-600">VIP3</div>
            
            <div className="text-gray-500 py-2 border-t">抽奖次数</div>
            <div className="py-2 border-t">+2/天</div>
            <div className="py-2 border-t">+5/天</div>
            <div className="py-2 border-t">+10/天</div>
            
            <div className="text-gray-500 py-2 border-t">提现门槛</div>
            <div className="py-2 border-t">50元</div>
            <div className="py-2 border-t">30元</div>
            <div className="py-2 border-t">20元</div>
            
            <div className="text-gray-500 py-2 border-t">到账速度</div>
            <div className="py-2 border-t">T+1</div>
            <div className="py-2 border-t">T+0</div>
            <div className="py-2 border-t">T+0</div>
            
            <div className="text-gray-500 py-2 border-t">中奖倍率</div>
            <div className="py-2 border-t">1.2x</div>
            <div className="py-2 border-t">1.5x</div>
            <div className="py-2 border-t">2.0x</div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
            {plans?.map((plan) => {
              const colors = planColors[plan.level] || planColors[1];
              const features = planFeatures[plan.level] || [];
              const isCurrentPlan = vipStatus?.level === plan.level;
              
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "bg-gradient-to-br rounded-2xl p-5 shadow-lg border-2 relative overflow-hidden",
                    colors.bg,
                    colors.border,
                    isCurrentPlan && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {plan.level === 3 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                        最受欢迎
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.badge)}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{plan.name}</h3>
                      <p className="text-xs text-gray-500">30天有效期</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gray-800">¥{plan.price}</span>
                    <span className="text-gray-400 text-sm">/月</span>
                  </div>

                  <div className="space-y-2 mb-5">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className={cn("w-4 h-4 flex-shrink-0", colors.icon)} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                    className={cn(
                      "w-full",
                      isCurrentPlan
                        ? "bg-gray-200 text-gray-500"
                        : plan.level === 3
                        ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600"
                        : plan.level === 2
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                        : "bg-slate-600 hover:bg-slate-700"
                    )}
                    data-testid={`button-select-vip-${plan.level}`}
                  >
                    {isCurrentPlan ? "当前套餐" : "立即开通"}
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
                <p className="font-medium text-gray-800 text-sm">专属福利</p>
                <p className="text-xs text-gray-400">更多优惠活动</p>
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
                <p className="font-medium text-gray-800 text-sm">无忧续费</p>
                <p className="text-xs text-gray-400">到期提醒</p>
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
              <Crown className="w-5 h-5 text-amber-500" />
              确认开通
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="py-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{selectedPlan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">30天会员权益</p>
                <div className="mt-4 text-3xl font-bold text-orange-500">
                  ¥{selectedPlan.price}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p className="flex items-center justify-between">
                  <span>每日额外抽奖</span>
                  <span className="font-medium">+{selectedPlan.dailyExtraSpins}次</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>提现门槛</span>
                  <span className="font-medium">{selectedPlan.withdrawMinAmount}元起</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>到账速度</span>
                  <span className="font-medium">{selectedPlan.withdrawSpeed}</span>
                </p>
              </div>

              <Button
                onClick={handleConfirmPurchase}
                disabled={buyMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                data-testid="button-confirm-vip"
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
