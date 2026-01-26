import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/adminAuth";
import { format } from "date-fns";
import { Coins, TrendingUp, DollarSign, Search } from "lucide-react";

interface CommissionRecord {
  id: number;
  userId: number;
  fromUserId: number | null;
  amount: string;
  status: string;
  type: string;
  level: number;
  createdAt: string;
  userPhone?: string;
  sourcePhone?: string;
  rate?: string;
}

export default function AdminCommissionPage() {
  const { token } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ commissions: CommissionRecord[]; total: number }>({
    queryKey: ["/api/admin/commissions", page, activeTab, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (activeTab !== "all") {
        params.append("type", activeTab);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const res = await fetch(`/api/admin/commissions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { commissions: [], total: 0 };
      return res.json();
    },
    enabled: !!token,
  });

  const records = data?.commissions || [];
  const totalCommission = records.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const pendingCount = records.filter(r => r.status === "pending").length;

  const handleSearch = () => {
    setSearchQuery(inputValue);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, any> = {
      credited: { label: "已入账", className: "bg-green-100 text-green-700" },
      pending: { label: "待处理", className: "bg-yellow-100 text-yellow-700" },
      frozen: { label: "冻结中", className: "bg-purple-100 text-purple-700" },
    };
    const config = map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      commission: "下级返佣",
      vip_commission: "VIP返佣",
      upgrade_reward: "升级奖励",
      lottery_reward: "转盘中奖",
      lottery_commission: "转盘返佣",
    };
    return map[type] || type;
  };

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
                <p className="text-sm text-gray-500">本页总额</p>
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
                <p className="text-sm text-gray-500">记录总数</p>
                <p className="text-2xl font-bold">{data?.total || 0}</p>
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
                <p className="text-sm text-gray-500">本页待处理</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              佣金明细
            </CardTitle>
            
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="w-[400px]">
                <TabsList>
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="downline">下级返佣</TabsTrigger>
                  <TabsTrigger value="vip">VIP奖励</TabsTrigger>
                  <TabsTrigger value="lottery">转盘奖励</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex gap-2 w-full md:w-auto">
                <Input 
                  placeholder="搜索手机号/ID" 
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : !records.length ? (
            <div className="text-center py-8 text-gray-500">暂无相关记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">受益人</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">来源</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">层级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{record.id}</td>
                      <td className="px-4 py-3 text-sm">{record.userPhone || `ID:${record.userId}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{record.sourcePhone || "-"}</td>
                      <td className="px-4 py-3 text-sm">{getTypeLabel(record.type)}</td>
                      <td className="px-4 py-3 text-sm">{record.level > 0 ? `${record.level}级` : "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">+¥{record.amount}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(record.status)}
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
          
          <div className="flex justify-between items-center mt-4">
             <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</Button>
             <span className="text-sm text-gray-500">第 {page} 页</span>
             <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={records.length < 20}>下一页</Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}