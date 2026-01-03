import { BarChart3, TrendingUp, Users, CreditCard, ShoppingBag, Wallet } from "lucide-react";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card } from "@/components/ui/card";

export default function AdminStatsPage() {
  const { token } = useAdminAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    enabled: !!token,
  });

  const statCards = [
    { label: "总用户数", value: stats?.totalUsers || 0, icon: Users, color: "blue" },
    { label: "VIP用户", value: stats?.vipUsers || 0, icon: TrendingUp, color: "amber" },
    { label: "总订单数", value: stats?.totalOrders || 0, icon: ShoppingBag, color: "green" },
    { label: "总收入", value: `¥${stats?.totalRevenue || 0}`, icon: Wallet, color: "purple" },
    { label: "待处理提现", value: stats?.pendingWithdraws || 0, icon: CreditCard, color: "orange" },
    { label: "待审核代理", value: stats?.pendingAgents || 0, icon: Users, color: "pink" },
  ];

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600",
      amber: "bg-amber-100 text-amber-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600",
      pink: "bg-pink-100 text-pink-600",
    };
    return colors[color] || colors.blue;
  };

  return (
    <AdminLayout title="数据统计">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-sm">{stat.label}</span>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClass(stat.color)}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                今日数据
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">今日新增用户</span>
                  <span className="font-bold text-blue-600">{stats?.todayUsers || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">今日新增订单</span>
                  <span className="font-bold text-green-600">{stats?.todayOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">今日收入</span>
                  <span className="font-bold text-purple-600">¥{stats?.todayRevenue || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">今日提现申请</span>
                  <span className="font-bold text-orange-600">{stats?.todayWithdraws || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                VIP分布
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">VIP1 会员</span>
                  <span className="font-bold">{stats?.vip1Count || 0} 人</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">VIP2 会员</span>
                  <span className="font-bold">{stats?.vip2Count || 0} 人</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">VIP3 会员</span>
                  <span className="font-bold">{stats?.vip3Count || 0} 人</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
