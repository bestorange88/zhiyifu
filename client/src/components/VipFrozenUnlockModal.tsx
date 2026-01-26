import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { useUnlockCommission } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface VipFrozenUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vipStatus: any;
}

export function VipFrozenUnlockModal({ open, onOpenChange, vipStatus }: VipFrozenUnlockModalProps) {
  const { toast } = useToast();
  const unlockMutation = useUnlockCommission();
  const [loading, setLoading] = useState(false);

  const progressPercent = Math.min(100, Math.max(0, (vipStatus?.progress || 0) * 100));
  const frozenAmount = parseFloat(vipStatus?.frozenCommission || 0);
  const unlockableNow = parseFloat(vipStatus?.unlockableNow || 0);

  const handleUnlock = async () => {
    if (unlockableNow <= 0) return;
    setLoading(true);
    try {
      const res = await unlockMutation.mutateAsync();
      toast({
        title: res.success ? "解冻成功" : "解冻失败",
        description: res.success ? `成功解冻 ¥${res.unlocked}` : res.message,
        variant: res.success ? "default" : "destructive",
      });
      if (res.success) {
        // Keep open or close? User might want to see result.
      }
    } catch (error: any) {
       toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg h-[85vh] max-h-[800px] flex flex-col gap-0 p-0 bg-gradient-to-br from-purple-50 to-white overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="p-3 pb-2 shrink-0 border-b border-purple-100/50">
          <DialogTitle className="flex items-center gap-2 text-purple-900 text-base">
            <Lock className="w-4 h-4" /> 冻结资金管理
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 pt-2 space-y-3 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
          {/* Amount Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 p-3 rounded-xl text-center border border-purple-100">
              <div className="text-[10px] text-purple-600 mb-0.5">当前冻结总额</div>
              <div className="text-lg font-bold text-purple-900">¥{frozenAmount.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-center border border-green-100">
              <div className="text-[10px] text-green-600 mb-0.5">本次可解冻</div>
              <div className="text-lg font-bold text-green-700">¥{unlockableNow.toFixed(2)}</div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 font-medium">VIP任务进度</span>
              <span className="text-purple-600 font-bold">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="relative h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <div 
                 className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500"
                 style={{ width: `${progressPercent}%` }}
               />
            </div>
            <p className="text-[10px] text-gray-400">
              * 解冻额度 = 冻结总额 × 任务进度 - 已解冻额度
            </p>
          </div>

          {/* Bonus Info */}
          {progressPercent >= 80 && (
             <div className="bg-orange-50 border border-orange-100 p-2 rounded-lg flex gap-2 items-start">
               <div className="mt-0.5 bg-orange-100 p-0.5 rounded-full">
                 <Unlock className="w-2.5 h-2.5 text-orange-600" />
               </div>
               <div className="text-[10px] text-orange-800 leading-tight">
                 <div className="font-bold mb-0.5">高进度奖励机会!</div>
                 当前进度已超过80%，点击解冻有概率获得随机现金红包！
               </div>
             </div>
          )}
          
          {progressPercent >= 100 && (
             <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-[10px] text-blue-800 leading-tight">
                恭喜任务已完成！升级VIP等级时将自动解冻剩余全部资金，并获得延时满足奖金。
             </div>
          )}

          {/* Action Button */}
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md shadow-purple-200 h-10 text-sm"
            onClick={handleUnlock}
            disabled={unlockableNow <= 0 || loading}
          >
            {loading ? "处理中..." : (unlockableNow > 0 ? "立即解冻资金" : "暂无可解冻资金")}
          </Button>

          {/* Rules Text - Compact Mode */}
          <div className="text-[10px] text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100 leading-relaxed">
            <h4 className="font-bold text-center text-gray-800 mb-2">智医服 · 延时满足成长激励机制</h4>
            
            <p className="mb-2 text-center text-gray-400">
              为保障人工智能医疗健康平台的专业性与可持续发展，<br/>
              智医服基于「长期、持续、可信」的健康价值理念，<br/>
              对部分会员激励收益实行阶段性释放管理。
            </p>
            
            <div className="my-2 space-y-1">
              <div className="font-bold text-gray-700">具体规则如下：</div>
              <p>• 会员通过合规方式获得的部分激励收益，将先进入冻结收益池，与当前 VIP 成长任务绑定。</p>
              <p>• 冻结收益并非扣除或失效，所有收益始终归属于会员本人。</p>
              <p>• 冻结收益将随 VIP 任务完成进度逐步释放，支持多次、按进度解冻。</p>
              <p>• 当任务进度达到 80% 及以上，点击解冻有机会获得随机激励奖励。</p>
              <p>• 当完成当前 VIP 等级全部成长目标后，若未手动解冻，系统将在升级时自动解冻全部剩余冻结收益，并发放「延时满足成长奖励」。</p>
            </div>
            
            <div className="mt-2 bg-white p-2 rounded-lg border border-dashed border-gray-200">
              <div className="font-bold text-gray-700 mb-0.5">机制说明</div>
              <p className="mb-1 text-gray-400 leading-tight">
                该机制旨在鼓励真实、持续的参与行为，减少短期套利行为对平台生态的干扰，构建以健康成长为导向的会员激励体系。
              </p>
              <div className="font-bold text-purple-600 text-center mt-1 pt-1 border-t border-gray-100">
                智医服承诺：所有进度与收益状态 清晰可查、规则透明、长期有效。
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}