import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Crown, TrendingUp, Users, Wallet, HelpCircle, ChevronRight, Calculator, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { formatDateTimeShort, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function CommissionRewardsPage() {
  const [, setLocation] = useLocation();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: summary } = useQuery({
    queryKey: ["/api/referral/summary"],
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["/api/referral/commissions"],
  });

  const commissionList = Array.isArray(records) ? records : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-4 pt-4 pb-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/mine")} className="hover:bg-white/10 text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">佣金奖励</h1>
        </div>

        <div className="relative z-10">
          <p className="text-amber-100 text-xs mb-1">累计获得奖金(元)</p>
          <h2 className="text-3xl font-bold mb-4">{summary?.totalCommissionYuan || "0.00"}</h2>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-amber-100 text-xs">直推奖励</p>
                <p className="text-lg font-bold">¥{summary?.directCommissionYuan || "0.00"}</p>
             </div>
             <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-amber-100 text-xs">团队间推</p>
                <p className="text-lg font-bold">¥{summary?.teamCommissionYuan || "0.00"}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-20 space-y-4">
        
        {/* Promotion Rules Card */}
        <Card className="shadow-lg border-none overflow-hidden">
           <CardContent className="p-0">
              <div className="bg-amber-50/50 p-4 border-b border-amber-100">
                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    推广收益规则 (限三代内)
                 </h3>
              </div>
              
              <div className="p-4">
                 <div className="overflow-x-auto rounded-lg border border-gray-100 mb-4">
                    <table className="w-full text-xs text-center">
                       <thead>
                          <tr className="bg-gray-50 text-gray-500 font-medium">
                             <th className="py-2 px-2 border-b border-r">VIP等级</th>
                             <th className="py-2 px-2 border-b border-r">直推奖励</th>
                             <th className="py-2 px-2 border-b">间推奖励</th>
                          </tr>
                       </thead>
                       <tbody className="text-gray-700">
                          {[
                             { lv: "V1", d: "10%", i: "0%" },
                             { lv: "V2", d: "10%", i: "5%" },
                             { lv: "V3", d: "11%", i: "6%" },
                             { lv: "V4", d: "12%", i: "7%" },
                             { lv: "V5", d: "14%", i: "8%" },
                          ].map((row, idx) => (
                             <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-2 border-r font-medium">{row.lv}</td>
                                <td className="py-2 border-r text-orange-600 font-bold">{row.d}</td>
                                <td className="py-2 text-blue-600 font-bold">{row.i}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-2 text-blue-800">
                    <p className="flex items-start gap-1.5">
                       <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                       <span className="font-bold">直推奖励：</span>
                       <span>直接推荐用户产生的收益分成</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                       <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                       <span className="font-bold">间推奖励：</span>
                       <span>推荐用户的下级产生的收益分成 (限三代内有效)</span>
                    </p>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Calculation Example */}
        <Card className="shadow-lg border-none">
           <CardContent className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                 <Calculator className="w-4 h-4 text-green-600" />
                 收益演算示例
              </h3>
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed">
                 <div className="flex items-center gap-2 mb-2 justify-center font-bold text-gray-800">
                    <span>你(V3)</span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span>A</span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span>B</span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span className="text-orange-600">C (产生收益¥100)</span>
                 </div>
                 <p className="mb-1">假设你是V3等级 (间推奖励6%)：</p>
                 <p>1. C 是你的第三代下级 (间推范围内)</p>
                 <p>2. C 产生收益 ¥100 (如购买VIP或充值)</p>
                 <p className="mt-1 font-bold text-green-700 bg-green-100 inline-block px-2 py-0.5 rounded">
                    你的收益 = ¥100 × 6% = ¥6.00
                 </p>
              </div>
           </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 px-1 text-sm">最近收益记录</h3>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 text-xs">加载中...</div>
          ) : commissionList.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
               <Wallet className="w-8 h-8 text-gray-300" />
               <p className="text-xs">暂无收益记录</p>
            </div>
          ) : (
            commissionList.map((item: any) => (
              <Card 
                key={item.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer border-none shadow-sm"
                onClick={() => setSelectedRecord(item)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      item.bizType === 'vip_upgrade' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.bizType === 'vip_upgrade' ? <Crown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {item.bizType === 'vip_upgrade' ? 'VIP推广奖励' : '活动返佣'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateTimeShort(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">+ {item.amount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      来自 {item.fromUserPhone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Rules Footer */}
        <div className="text-center text-xs text-gray-400 pb-4 space-y-1">
           <p>• 所有收益以系统实际结算为准</p>
           <p>• 严禁虚假推广/刷人头/异常套利，违者取消资格</p>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-[90%] w-[350px] mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>收益详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
               <p className="text-xs text-gray-500 mb-1">入账金额</p>
               <p className="text-3xl font-bold text-orange-600">+{selectedRecord?.amount}</p>
            </div>
            <div className="space-y-3 text-sm">
               <div className="flex justify-between">
                  <span className="text-gray-500">来源用户</span>
                  <span>{selectedRecord?.fromUserPhone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-gray-500">来源层级</span>
                  <span className="font-bold text-gray-900">
                    {selectedRecord?.relationLevel === 1 ? "直推 (第一代)" : 
                     selectedRecord?.relationLevel === 2 ? "间推 (第二代)" : "间推 (第三代)"}
                  </span>
               </div>
               <div className="flex justify-between">
                  <span className="text-gray-500">分佣比例</span>
                  <span>{(parseFloat(selectedRecord?.rate || "0") * 100).toFixed(0)}%</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-gray-500">交易时间</span>
                  <span>{selectedRecord && formatDateTime(selectedRecord.createdAt)}</span>
               </div>
               
               <div className="pt-3 border-t">
                 <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded leading-relaxed">
                   说明：{selectedRecord?.description || "推广奖励"}
                 </p>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
