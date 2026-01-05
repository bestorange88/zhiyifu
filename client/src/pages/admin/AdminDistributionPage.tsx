import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/adminAuth";
import { format } from "date-fns";
import { Users, TrendingUp, UserPlus } from "lucide-react";

interface UserWithReferrals {
  id: number;
  phone: string | null;
  inviteCode: string;
  inviterId: number | null;
  vipLevel: number;
  createdAt: string;
  directCount: number;
  teamCount: number;
  currentRank: number;
}

interface ReferralRecord {
  id: number;
  userId: number;
  fromUserId: number;
  level: number;
  amount: string;
  status: string;
  createdAt: string;
  userPhone?: string;
  fromUserPhone?: string;
}

export default function AdminDistributionPage() {
  const { token } = useAdminAuth();

  const { data: users, isLoading: usersLoading } = useQuery<UserWithReferrals[]>({
    queryKey: ["/api/admin/distribution/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/distribution/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || data || [];
    },
    enabled: !!token,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<ReferralRecord[]>({
    queryKey: ["/api/admin/distribution/referrals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/distribution/referrals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const getRankBadge = (rank: number) => {
    const rankNames = ["普通", "V1", "V2", "V3", "V4", "V5"];
    const colors = [
      "bg-gray-100 text-gray-700",
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-yellow-100 text-yellow-700",
      "bg-orange-100 text-orange-700",
      "bg-red-100 text-red-700",
    ];
    return <Badge className={colors[rank] || colors[0]}>{rankNames[rank] || `V${rank}`}</Badge>;
  };

  return (
    <AdminLayout title="分销管理">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总会员数</p>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">邀请记录数</p>
                <p className="text-2xl font-bold">{referrals?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">代理数</p>
                <p className="text-2xl font-bold">{users?.filter(u => u.currentRank > 0).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              会员层级
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : !users?.length ? (
              <div className="text-center py-8 text-gray-500">暂无数据</div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">邀请码</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">直推</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">团队</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">等级</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{user.phone || `ID${user.id}`}</td>
                        <td className="px-4 py-3 text-sm font-mono">{user.inviteCode}</td>
                        <td className="px-4 py-3 text-sm">{user.directCount}</td>
                        <td className="px-4 py-3 text-sm">{user.teamCount}</td>
                        <td className="px-4 py-3">{getRankBadge(user.currentRank)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              邀请记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralsLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : !referrals?.length ? (
              <div className="text-center py-8 text-gray-500">暂无邀请记录</div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">受益人</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">来源</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">层级</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {referrals.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{record.userPhone || `用户${record.userId}`}</td>
                        <td className="px-4 py-3 text-sm">{record.fromUserPhone || `用户${record.fromUserId}`}</td>
                        <td className="px-4 py-3 text-sm">{record.level}级</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">+¥{record.amount}</td>
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
      </div>
    </AdminLayout>
  );
}
