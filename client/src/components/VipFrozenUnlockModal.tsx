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
            <Lock className="w-4 h-4" /> 待领取资金管理
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 pt-2 space-y-3 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
          {/* Amount Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 p-3 rounded-xl text-center border border-purple-100">
              <div className="text-[10px] text-purple-600 mb-0.5">待领取总额</div>
              <div className="text-lg font-bold text-purple-900">¥{frozenAmount.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-center border border-green-100">
              <div className="text-[10px] text-green-600 mb-0.5">本次可领取</div>
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

          {/* Task Status Info */}
          {progressPercent >= 100 && (
             <div className="bg-green-50 border border-green-100 p-2 rounded-lg flex gap-2 items-start">
               <div className="mt-0.5 bg-green-100 p-0.5 rounded-full">
                 <Unlock className="w-2.5 h-2.5 text-green-600" />
               </div>
               <div className="text-[10px] text-green-800 leading-tight">
                 <div className="font-bold mb-0.5">达标任务已完成！</div>
                 恭喜您已完成当前VIP等级的达标任务，升级奖励将自动派发到您的钱包余额。
               </div>
             </div>
          )}
          
          {progressPercent < 100 && progressPercent > 0 && (
             <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-[10px] text-blue-800 leading-tight">
                继续完成达标任务，任务完成后系统将自动派发VIP升级奖励到您的余额。
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
            <h4 className="font-bold text-center text-gray-800 mb-2">智医服 · VIP升级奖励机制</h4>
            
            <p className="mb-2 text-center text-gray-400">
              为保障平台的健康发展与会员权益，<br/>
              智医服采用「先升级、后达标、自动派发」的奖励机制，<br/>
              确保每位会员的付出都能获得公平回报。
            </p>
            
            <div className="my-2 space-y-1">
              <div className="font-bold text-gray-700">VIP升级奖励规则：</div>
              <p>• 用户可直接购买升级VIP等级，升级后立即享有该等级的所有权益（收益倍率、抽奖次数等）。</p>
              <p>• VIP升级奖励需完成当前等级的达标任务后，由系统自动派发到您的钱包余额。</p>
              <p>• 达标任务包括：直推人数要求、三代内团队人数要求。</p>
              <p>• 任务进度实时更新，您可随时查看当前完成情况。</p>
              <p>• 达标后奖励自动发放，无需手动申请，安全可靠。</p>
            </div>
            
            <div className="mt-2 bg-white p-2 rounded-lg border border-dashed border-gray-200">
              <div className="font-bold text-gray-700 mb-0.5">温馨提示</div>
              <p className="mb-1 text-gray-400 leading-tight">
                升级奖励与VIP等级权益分开计算。升级后即可享受VIP权益，完成达标任务后额外获得升级奖励，双重收益更有保障。
              </p>
              <div className="font-bold text-purple-600 text-center mt-1 pt-1 border-t border-gray-100">
                智医服承诺：任务进度透明可查、奖励自动派发、规则公开公正。
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
