import { useState } from "react";
import { ChevronLeft, ChevronRight, Award, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@/lib/utils";

export default function AdminRankRequestsPage() {
  const { token } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/admin/rank-upgrade-requests", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/rank-upgrade-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load requests");
      return res.json();
    },
    enabled: !!token,
  });

  const requestList = Array.isArray(requests) ? requests : [];
  const totalPages = Math.ceil(requestList.length / 20);
  const currentData = requestList.slice((page - 1) * 20, page * 20);

  return (
    <AdminLayout title="VIP升级记录">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-700">升级历史记录</span>
            <span className="text-xs text-gray-400 ml-2">（只读）</span>
          </div>
          <div className="flex gap-2">
            {[
              { value: "", label: "全部" },
              { value: "paid", label: "已完成" },
              { value: "pending", label: "待支付" },
            ].map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={statusFilter === opt.value ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">升级路径</th>
                <th className="px-4 py-3 text-left">支付金额</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">升级时间</th>
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
              ) : currentData.length > 0 ? (
                currentData.map((req: any) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{req.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{req.userPhone || `用户${req.userId}`}</td>
                    <td className="px-4 py-3 text-sm">
                       VIP{req.currentRank || req.fromLevel || 0} <span className="text-gray-400">→</span> <span className="font-bold text-purple-600">VIP{req.targetRank || req.toLevel}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-600">¥{req.bonusAmount || (req.payAmountCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        req.status === "paid" || req.status === "approved" ? "bg-green-100 text-green-700" :
                        req.status === "pending" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {req.status === "paid" || req.status === "approved" ? "已完成" : req.status === "pending" ? "待支付" : req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateTime(req.paidAt || req.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    暂无升级记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
