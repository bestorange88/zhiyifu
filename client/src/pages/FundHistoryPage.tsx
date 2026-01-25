import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Wallet, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function FundHistoryPage() {
  const [, setLocation] = useLocation();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/wallet/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet/history?limit=50");
      return res.json();
    },
  });

  const getIcon = (amount: string) => {
    return parseFloat(amount) >= 0 ? (
      <ArrowDownLeft className="w-5 h-5 text-green-500" />
    ) : (
      <ArrowUpRight className="w-5 h-5 text-red-500" />
    );
  };

  const getAmountClass = (amount: string) => {
    return parseFloat(amount) >= 0 ? "text-green-600" : "text-red-600";
  };

  const formatType = (type: string, description: string) => {
    if (description) return description;
    const typeMap: Record<string, string> = {
      checkin_bonus: "签到奖励",
      spin_win: "转盘中奖",
      spin_commission: "转盘佣金",
      vip_purchase: "购买VIP",
      vip_upgrade: "升级VIP",
      vip_commission: "VIP佣金",
      rank_purchase: "购买等级",
      rank_bonus: "等级奖金",
      upgrade_reward: "升级奖励",
      commission_unfreeze: "佣金解冻",
      lottery_commission: "彩票佣金",
      signin_cash: "签到现金",
      withdraw_apply: "提现申请",
      withdraw_success: "提现成功",
      withdraw_reject: "提现拒绝",
      referral_reward: "推荐奖励",
      admin_adjust: "管理员调整",
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => setLocation("/mine")}>
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold">资金明细</h1>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">加载中...</div>
        ) : transactions && transactions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="p-4 border-b border-gray-100 last:border-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${parseFloat(tx.amount) >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    {getIcon(tx.amount)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{formatType(tx.type, tx.description)}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getAmountClass(tx.amount)}`}>
                    {parseFloat(tx.amount) > 0 ? "+" : ""}
                    {parseFloat(tx.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    余额: {tx.balanceAfter || "-"}
                  </div>
                  {tx.balanceBefore && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      变动前: {tx.balanceBefore}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无资金记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
