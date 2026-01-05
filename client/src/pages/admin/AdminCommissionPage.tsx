import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/adminAuth";
import { format } from "date-fns";
import { Coins, TrendingUp, DollarSign } from "lucide-react";

interface CommissionRecord {
  id: number;
  userId: number;
  fromUserId: number;
  orderId: number | null;
  level: number;
  rate: string;
  amount: string;
  status: string;
  createdAt: string;
  userPhone?: string;
  fromUserPhone?: string;
}

export default function AdminCommissionPage() {
  const { token } = useAdminAuth();

  const { data: records, isLoading } = useQuery<CommissionRecord[]>({
    queryKey: ["/api/admin/commissions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/commissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.commissions || data || [];
    },
    enabled: !!token,
  });

  const totalCommission = records?.reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0;
  const pendingCount = records?.filter(r => r.status === "pending").length || 0;

  return (
    <AdminLayout title="佣金管理">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总佣金发放</p>
                <p className="text-2xl font-bold">¥{totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">佣金记录数</p>
                <p className="text-2xl font-bold">{records?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            佣金记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : !records?.length ? (
            <div className="text-center py-8 text-gray-500">暂无佣金记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">受益人</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">来源用户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">订单ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">层级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">比例</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{record.id}</td>
                      <td className="px-4 py-3 text-sm">{record.userPhone || `用户${record.userId}`}</td>
                      <td className="px-4 py-3 text-sm">{record.fromUserPhone || `用户${record.fromUserId}`}</td>
                      <td className="px-4 py-3 text-sm">{record.orderId || "-"}</td>
                      <td className="px-4 py-3 text-sm">{record.level}级</td>
                      <td className="px-4 py-3 text-sm">{(parseFloat(record.rate) * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">+¥{record.amount}</td>
                      <td className="px-4 py-3">
                        <Badge className={record.status === "credited" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                          {record.status === "credited" ? "已入账" : record.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(record.createdAt), "MM-dd HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
