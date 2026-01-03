import { useState } from "react";
import { CreditCard, Check, X, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";

export default function AdminWithdrawsPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/withdraws", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/withdraws?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load withdraws");
      return res.json();
    },
    enabled: !!token,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`/api/admin/withdraws/${id}/review`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error("Failed to review withdraw");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdraws"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "提现审核完成" });
    },
    onError: (error: any) => {
      toast({ title: "审核失败", description: error.message, variant: "destructive" });
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <AdminLayout title="提现管理">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center gap-4">
          <span className="text-sm text-gray-500">状态筛选：</span>
          <div className="flex gap-2">
            {[
              { value: "", label: "全部" },
              { value: "applied", label: "待审核" },
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
                <th className="px-4 py-3 text-left">金额</th>
                <th className="px-4 py-3 text-left">方式</th>
                <th className="px-4 py-3 text-left">账户信息</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">申请时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data?.withdraws?.length > 0 ? (
                data.withdraws.map((w: any) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{w.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{w.userPhone}</td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-600">¥{w.amount}</td>
                    <td className="px-4 py-3 text-sm">{w.method}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{w.accountInfo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        w.status === "applied" ? "bg-orange-100 text-orange-700" :
                        w.status === "approved" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {w.status === "applied" ? "待审核" : w.status === "approved" ? "已通过" : "已拒绝"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(w.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      {w.status === "applied" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ id: w.id, approved: true })}
                            disabled={reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewMutation.mutate({ id: w.id, approved: false })}
                            disabled={reviewMutation.isPending}
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
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    暂无提现记录
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
