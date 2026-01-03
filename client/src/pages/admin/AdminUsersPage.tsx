import { useState } from "react";
import { useLocation } from "wouter";
import { Users, Search, ChevronLeft, ChevronRight, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";

export default function AdminUsersPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/users", page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
    enabled: !!token,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "用户状态已更新" });
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <AdminLayout title="用户管理">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="搜索用户..." className="pl-10" />
          </div>
          <span className="text-sm text-gray-500">共 {data?.total || 0} 位用户</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">手机号</th>
                <th className="px-4 py-3 text-left">邀请码</th>
                <th className="px-4 py-3 text-left">VIP等级</th>
                <th className="px-4 py-3 text-left">余额</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">注册时间</th>
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
              ) : data?.users?.length > 0 ? (
                data.users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{user.phone}</td>
                    <td className="px-4 py-3 text-sm font-mono text-purple-600">{user.inviteCode}</td>
                    <td className="px-4 py-3">
                      {user.vipLevel > 0 ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          VIP{user.vipLevel}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">普通</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      ¥{user.wallet?.balanceCashAvailable || "0.00"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {user.status === "active" ? "正常" : "禁用"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      {user.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ userId: user.id, status: "banned" })}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Ban className="w-3 h-3 mr-1" />
                          禁用
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ userId: user.id, status: "active" })}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          启用
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    暂无用户数据
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
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
