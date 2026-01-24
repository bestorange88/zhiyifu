import { useState } from "react";
import { Check, X, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";

export default function AdminRankRequestsPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
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

  const approveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note?: string }) => {
      const res = await fetch(`/api/admin/rank-upgrade-requests/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) throw new Error("Failed to approve request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rank-upgrade-requests"] });
      toast({ title: "审核通过，奖金已发放" });
    },
    onError: (error: any) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note?: string }) => {
      const res = await fetch(`/api/admin/rank-upgrade-requests/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) throw new Error("Failed to reject request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rank-upgrade-requests"] });
      toast({ title: "已拒绝申请" });
    },
    onError: (error: any) => {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    },
  });

  const requestList = Array.isArray(requests) ? requests : [];
  const totalPages = Math.ceil(requestList.length / 20);
  const currentData = requestList.slice((page - 1) * 20, page * 20);

  return (
    <AdminLayout title="VIP晋级审核">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center gap-4">
          <span className="text-sm text-gray-500">状态筛选：</span>
          <div className="flex gap-2">
            {[
              { value: "", label: "全部" },
              { value: "pending", label: "待审核" },
              { value: "approved", label: "已通过" },
              { value: "rejected", label: "已拒绝" },
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
                <th className="px-4 py-3 text-left">当前/目标等级</th>
                <th className="px-4 py-3 text-left">直推人数</th>
                <th className="px-4 py-3 text-left">三代团队</th>
                <th className="px-4 py-3 text-left">晋级奖金</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">申请时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : currentData.length > 0 ? (
                currentData.map((req: any) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{req.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{req.userPhone}</td>
                    <td className="px-4 py-3 text-sm">
                       VIP{req.currentRank} <span className="text-gray-400">→</span> <span className="font-bold text-purple-600">VIP{req.targetRank}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{req.directCount}人</td>
                    <td className="px-4 py-3 text-sm">{req.team3genCount}人</td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-600">¥{req.bonusAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        req.status === "pending" ? "bg-orange-100 text-orange-700" :
                        req.status === "approved" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {req.status === "pending" ? "待审核" : req.status === "approved" ? "已通过" : "已拒绝"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({ id: req.id })}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate({ id: req.id })}
                            disabled={rejectMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            拒绝
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">已处理</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    暂无审核申请
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
