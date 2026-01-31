import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/adminAuth";
import { formatDate, formatDateTimeShort } from "@/lib/utils";
import { Users, TrendingUp, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TeamStats {
  leaderId: number;
  leaderPhone: string | null;
  leaderVip: number;
  joinDate: string;
  teamSize: number;
  vipCounts: {
    v1: number;
    v2: number;
    v3: number;
    v4: number;
    v5: number;
  };
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
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { data: teamData, isLoading: teamsLoading } = useQuery<{ teams: TeamStats[]; total: number }>({
    queryKey: ["/api/admin/distribution/teams", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const res = await fetch(`/api/admin/distribution/teams?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { teams: [], total: 0 };
      return res.json();
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

  const handleSearch = () => {
    setSearchQuery(inputValue);
    setPage(1);
  };

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

  const teams = teamData?.teams || [];
  const totalTeams = teamData?.total || 0;

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
                <p className="text-sm text-gray-500">团队总数</p>
                <p className="text-2xl font-bold">{totalTeams}</p>
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
                <p className="text-sm text-gray-500">VIP团队数</p>
                <p className="text-2xl font-bold">{teams.filter(t => t.leaderVip > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                团队列表
              </CardTitle>
              <div className="flex gap-2 w-full md:w-auto">
                <Input 
                  placeholder="搜索团长手机号/ID" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full md:w-[200px]"
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : !teams.length ? (
              <div className="text-center py-8 text-gray-500">暂无团队数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">团长</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">等级</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">团队总人数</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">VIP分布</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {teams.map((team) => (
                      <tr key={team.leaderId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{team.leaderPhone || `用户${team.leaderId}`}</div>
                          <div className="text-xs text-gray-400">ID: {team.leaderId}</div>
                        </td>
                        <td className="px-4 py-3">{getRankBadge(team.leaderVip)}</td>
                        <td className="px-4 py-3 text-sm font-bold">{team.teamSize}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            {team.vipCounts.v1 > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 rounded text-xs">V1:{team.vipCounts.v1}</span>}
                            {team.vipCounts.v2 > 0 && <span className="bg-green-50 text-green-600 px-1.5 rounded text-xs">V2:{team.vipCounts.v2}</span>}
                            {team.vipCounts.v3 > 0 && <span className="bg-yellow-50 text-yellow-600 px-1.5 rounded text-xs">V3:{team.vipCounts.v3}</span>}
                            {team.vipCounts.v4 > 0 && <span className="bg-orange-50 text-orange-600 px-1.5 rounded text-xs">V4:{team.vipCounts.v4}</span>}
                            {team.vipCounts.v5 > 0 && <span className="bg-red-50 text-red-600 px-1.5 rounded text-xs">V5:{team.vipCounts.v5}</span>}
                            {Object.values(team.vipCounts).every(c => c === 0) && <span className="text-gray-400 text-xs">无VIP</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(team.joinDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
               <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</Button>
               <span className="text-sm text-gray-500">第 {page} 页</span>
               <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={teams.length < 20}>下一页</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              最近邀请记录
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
                          {formatDateTimeShort(record.createdAt)}
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
