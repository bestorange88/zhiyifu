import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/adminAuth";
import { format } from "date-fns";
import { Search, ArrowLeft, ArrowRight, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PointRecord {
  id: number;
  userId: number;
  userPhone: string;
  type: "income" | "expense";
  amount: string;
  description: string;
  createdAt: string;
}

export default function AdminPointsPage() {
  const { token } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/points-history", page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      });
      const res = await fetch(`/api/admin/points-history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load points history");
      return res.json();
    },
    enabled: !!token,
  });

  const handleSearch = () => {
    setSearchTerm(search);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <AdminLayout title="积分明细">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="搜索手机号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">类型</th>
                <th className="px-4 py-3 text-left">变动数量</th>
                <th className="px-4 py-3 text-left">描述</th>
                <th className="px-4 py-3 text-left">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !data?.history?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    暂无积分记录
                  </td>
                </tr>
              ) : (
                data.history.map((record: PointRecord) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{record.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span>{record.userPhone || "未知"}</span>
                        <span className="text-xs text-gray-400">ID: {record.userId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={record.type === "income" ? "default" : "secondary"} className={record.type === "income" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}>
                        {record.type === "income" ? "收入" : "支出"}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${record.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {record.type === "income" ? "+" : "-"}{parseFloat(record.amount).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-sm">{record.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(record.createdAt), "yyyy-MM-dd HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              显示 {(page - 1) * data.limit + 1} - {Math.min(page * data.limit, data.total)} 共 {data.total} 条
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
