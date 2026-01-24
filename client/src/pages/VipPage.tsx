import { useState } from "react";
import { useLocation } from "wouter";
import { Crown, ArrowLeft, Check, Zap, Gift, Clock, Shield, Star, Sparkles, AlertCircle, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

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
  benefitsList?: string[];
}

interface VipStatus {
  vipLevel: number;
  vipName: string;
  expireAt: string | null;
  qualified: boolean;
  directCount: number;
  team3GenCount: number;
  frozenCommission: number;
  currentLevelDetails: VipLevel | null;
  nextLevelDetails: VipLevel | null;
  qualificationProgress: {
    directCount: number;
    directRequired: number;
    directMet: boolean;
    team3Count: number;
    team3Required: number;
    team3Met: boolean;
    downlineProgress: Record<string, { current: number, required: number, met: boolean }>;
    downlineMet: boolean;
    isQualified: boolean;
  } | null;
  canUpgrade: boolean;
  pendingRequest?: {
    id: number;
    toLevel: number;
    createdAt: string;
  } | null;
}

const rankColors: Record<number, { bg: string; border: string; badge: string; icon: string; text: string }> = {
  1: { 
    bg: "from-slate-50 to-slate-100", 
    border: "border-slate-200",
    badge: "bg-slate-600",
    icon: "text-slate-600",
    text: "text-slate-800"
  },
  2: { 
    bg: "from-amber-50 to-yellow-100", 
    border: "border-amber-200",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-500",
    icon: "text-amber-600",
    text: "text-amber-800"
  },
  3: { 
    bg: "from-teal-50 to-emerald-100", 
    border: "border-teal-200",
    badge: "bg-gradient-to-r from-teal-500 to-emerald-500",
    icon: "text-teal-600",
    text: "text-teal-800"
  },
  4: { 
    bg: "from-purple-50 via-pink-50 to-rose-100", 
    border: "border-purple-200",
    badge: "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500",
    icon: "text-purple-600",
    text: "text-purple-800"
  },
  5: { 
    bg: "from-rose-50 via-orange-50 to-amber-100", 
    border: "border-rose-200",
    badge: "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500",
    icon: "text-rose-600",
    text: "text-rose-800"
  },
};

export default function VipPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<VipLevel | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReasons, setShowReasons] = useState(false);

  const { data: levels, isLoading: levelsLoading } = useQuery<VipLevel[]>({
    queryKey: ["/api/vip/levels"],
  });

  const { data: vipStatus, isLoading: statusLoading } = useQuery<VipStatus>({
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
      
      if (data.status === "pending_review") {
        toast({
          title: "申请提交成功",
          description: "您的VIP升级申请已提交，请等待管理员审核",
        });
      } else {
        toast({
          title: "开通成功",
          description: `恭喜您成为${selectedLevel?.name}会员！`,
        });
      }
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

  const handleUpgradeClick = () => {
    if (!vipStatus?.nextLevelDetails) return;
    
    // Check if requirements met
    const prog = vipStatus.qualificationProgress;
    if (prog && !prog.isQualified) {
      toast({
        title: "条件未达标",
        description: "请先完成所有升级任务要求",
        variant: "destructive"
      });
      return;
    }

    setSelectedLevel(vipStatus.nextLevelDetails);
    setShowConfirmDialog(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedLevel) {
      buyMutation.mutate(selectedLevel.level);
    }
  };

  const currentLevel = vipStatus?.vipLevel || 0;
  const currentDetails = vipStatus?.currentLevelDetails;
  const nextDetails = vipStatus?.nextLevelDetails;
  const prog = vipStatus?.qualificationProgress;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header & Status */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-4 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={() => setLocation("/mine")}
            className="p-2 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">VIP会员中心</h1>
        </div>

        {/* Current Status Card */}
        <div className="relative z-10 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-2xl p-5 shadow-lg text-amber-900">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Crown className="w-6 h-6 text-amber-900" />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {vipStatus?.vipName || "普通用户"}
                  {currentLevel >= 2 && (
                    <span className="text-[10px] bg-black/20 text-amber-900 px-2 py-0.5 rounded-full backdrop-blur-sm border border-amber-900/10">
                      T+0极速提现
                    </span>
                  )}
                </h2>
                <p className="text-xs text-amber-800/80 font-medium mt-0.5">
                  收益倍率: {currentDetails?.winMultiplier || "1.0"}x | 今日剩余抽奖: {currentDetails?.dailyLottery || 0}次
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm flex justify-between items-center text-xs font-medium text-amber-900/90">
             <span>下一级: {nextDetails?.name || "已满级"}</span>
             {vipStatus?.pendingRequest ? (
               <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> 审核中</span>
             ) : nextDetails ? (
               <span>需直推{nextDetails.directRequired}人 / 团队{nextDetails.team3GenRequired}人</span>
             ) : (
               <span>巅峰王者</span>
             )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-20 space-y-4">
        
        {/* Upgrade Progress Section */}
        {nextDetails && prog && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
               <span>升级任务进度 (需全部达标)</span>
               <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                 目标: {nextDetails.name}
               </span>
             </h3>

             <div className="space-y-4">
                {/* Direct Referrals */}
                <div>
                   <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">直推人数</span>
                      <span className={prog.directMet ? "text-green-600 font-bold" : "text-orange-500 font-bold"}>
                        {prog.directCount} / {prog.directRequired}
                      </span>
                   </div>
                   <Progress value={Math.min(100, (prog.directCount / prog.directRequired) * 100)} className="h-2" />
                </div>

                {/* Team Size */}
                <div>
                   <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">三代内团队人数</span>
                      <span className={prog.team3Met ? "text-green-600 font-bold" : "text-orange-500 font-bold"}>
                        {prog.team3Count} / {prog.team3Required}
                      </span>
                   </div>
                   <Progress value={Math.min(100, (prog.team3Count / prog.team3Required) * 100)} className="h-2" />
                </div>

                {/* Downline Structure */}
                {Object.keys(prog.downlineProgress).length > 0 && (
                  <div className="pt-2 border-t border-dashed">
                    <p className="text-xs text-gray-500 mb-2">团队VIP结构要求 (三代内)</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(prog.downlineProgress).map(([lvl, data]) => (
                        <div 
                          key={lvl} 
                          className={cn(
                            "text-xs px-2 py-1 rounded border flex items-center gap-1",
                            data.met ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                          )}
                        >
                          <span className="font-bold">{lvl}</span>
                          <span>{data.current}/{data.required}</span>
                          {data.met ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             {/* Why can't I upgrade? */}
             {!prog.isQualified && (
               <div className="mt-4">
                 <button 
                   onClick={() => setShowReasons(!showReasons)}
                   className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors"
                 >
                   <AlertCircle className="w-3 h-3" />
                   为什么我还不能升级?
                   {showReasons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                 </button>
                 
                 {showReasons && (
                   <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg space-y-1">
                     {!prog.directMet && <p>• 直推人数未达标 (还差 {prog.directRequired - prog.directCount} 人)</p>}
                     {!prog.team3Met && <p>• 团队人数未达标 (还差 {prog.team3Required - prog.team3Count} 人)</p>}
                     {!prog.downlineMet && <p>• 团队VIP结构未达标 (请查看上方红框项目)</p>}
                     <p className="text-gray-400 mt-1 pt-1 border-t border-red-100">必须逐级升级，不可跨级</p>
                   </div>
                 )}
               </div>
             )}

             {/* Upgrade Button */}
             <div className="mt-5">
               <Button 
                 className={cn(
                   "w-full py-6 text-lg font-bold shadow-xl transition-all",
                   prog.isQualified 
                     ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white animate-pulse" 
                     : "bg-gray-200 text-gray-400 cursor-not-allowed"
                 )}
                 disabled={!prog.isQualified || vipStatus.pendingRequest !== null}
                 onClick={handleUpgradeClick}
               >
                 {vipStatus.pendingRequest 
                   ? "审核中..." 
                   : prog.isQualified 
                     ? `立即申请升级 ${nextDetails.name}` 
                     : "未满足升级条件"
                 }
               </Button>
               {prog.isQualified && !vipStatus.pendingRequest && (
                 <p className="text-center text-xs text-orange-500 mt-2">
                   恭喜达标！升级需支付 ¥{nextDetails.priceYuan}，审核通过后返还 ¥{nextDetails.upgradeRewardYuan} 奖励
                 </p>
               )}
             </div>
          </div>
        )}

        {/* Level Comparison Table */}
        <div className="bg-white rounded-2xl p-5 shadow-lg overflow-hidden">
           <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-amber-500" />
             VIP等级权益对比
           </h3>
           
           <div className="overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              <div className="grid gap-0 min-w-[500px] text-xs border border-gray-100 rounded-lg overflow-hidden" 
                   style={{ gridTemplateColumns: `80px repeat(${levels?.length || 5}, 1fr)` }}>
                
                {/* Header Row */}
                <div className="bg-gray-50 p-2 font-medium text-gray-500 flex items-center justify-center border-b border-r">等级</div>
                {levels?.map(l => (
                  <div key={l.level} className={cn("p-2 font-bold text-center border-b border-r last:border-r-0", rankColors[l.level]?.text)}>
                    {l.name}
                  </div>
                ))}

                {/* Price Row */}
                <div className="bg-gray-50 p-2 font-medium text-gray-500 flex items-center justify-center border-b border-r">开通费</div>
                {levels?.map(l => (
                  <div key={`price-${l.level}`} className="p-2 text-center border-b border-r last:border-r-0">
                    ¥{l.priceYuan}
                  </div>
                ))}

                {/* Reward Row */}
                <div className="bg-gray-50 p-2 font-medium text-gray-500 flex items-center justify-center border-b border-r">升级奖励</div>
                {levels?.map(l => (
                  <div key={`reward-${l.level}`} className="p-2 text-center border-b border-r last:border-r-0 text-orange-500 font-bold">
                    ¥{l.upgradeRewardYuan}
                  </div>
                ))}

                {/* Draws Row */}
                <div className="bg-gray-50 p-2 font-medium text-gray-500 flex items-center justify-center border-b border-r">每日抽奖</div>
                {levels?.map(l => (
                  <div key={`draw-${l.level}`} className="p-2 text-center border-b border-r last:border-r-0">
                    {l.dailyLottery}次
                  </div>
                ))}

                {/* Multiplier Row */}
                <div className="bg-gray-50 p-2 font-medium text-gray-500 flex items-center justify-center border-b border-r">收益倍率</div>
                {levels?.map(l => (
                  <div key={`mult-${l.level}`} className="p-2 text-center border-b border-r last:border-r-0">
                    {l.winMultiplier}x
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Benefits List */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
           <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
             <Gift className="w-4 h-4 text-rose-500" />
             VIP专属权益 (V2起生效)
           </h3>
           <div className="space-y-3">
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                   <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                   <h4 className="font-bold text-sm text-gray-800">提现极速到账 (T+0)</h4>
                   <p className="text-xs text-gray-400 mt-0.5">V2及以上等级专享，以系统实际结算为准</p>
                </div>
             </div>
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                   <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                   <h4 className="font-bold text-sm text-gray-800">无限AI使用权限</h4>
                   <p className="text-xs text-gray-400 mt-0.5">解锁所有高级AI克隆与对话功能</p>
                </div>
             </div>
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                   <Crown className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                   <h4 className="font-bold text-sm text-gray-800">推广收益加成</h4>
                   <p className="text-xs text-gray-400 mt-0.5">享受更高的直推与间推佣金比例</p>
                </div>
             </div>
           </div>
        </div>

        {/* Rules Footer */}
        <div className="bg-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-2">
           <p className="font-bold text-gray-700">规则补充：</p>
           <p>• 所有收益、奖励金额及到账时间以系统实际结算结果为准</p>
           <p>• 严禁虚假推广、刷人头、异常套利等违规行为，违者将冻结账户</p>
           <p>• 平台保留VIP规则的最终解释权及调整权</p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[90%] w-[350px] mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">确认升级 {selectedLevel?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedLevel && (
            <div className="py-2">
               <div className="bg-orange-50 rounded-xl p-4 text-center mb-4 border border-orange-100">
                  <p className="text-sm text-gray-500">升级费用</p>
                  <p className="text-2xl font-bold text-orange-600">¥{selectedLevel.priceYuan}</p>
                  <div className="mt-2 pt-2 border-t border-orange-200/50 flex justify-between text-xs text-orange-700">
                     <span>升级后奖励:</span>
                     <span className="font-bold">¥{selectedLevel.upgradeRewardYuan}</span>
                  </div>
               </div>

               <p className="text-xs text-gray-500 text-center mb-4">
                 支付后将提交管理员审核，审核通过后生效。<br/>
                 若审核拒绝，资金将原路退回余额。
               </p>

               <Button 
                 className="w-full bg-gradient-to-r from-amber-500 to-orange-600 font-bold"
                 onClick={handleConfirmPurchase}
                 disabled={buyMutation.isPending}
               >
                 {buyMutation.isPending ? "处理中..." : "确认支付并申请"}
               </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
