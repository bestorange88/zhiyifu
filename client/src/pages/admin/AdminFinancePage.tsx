import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Check, X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Withdraw {
  id: number;
  userId: number;
  amount: string;
  status: string;
  method: string | null;
  accountInfo: string | null;
  createdAt: string;
  phone?: string;
}

interface Deposit {
  id: number;
  userId: number;
  amount: string;
  status: string;
  method: string | null;
  proofImage: string | null;
  remark: string | null;
  createdAt: string;
  phone?: string;
}

export default function AdminFinancePage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("withdraws");

  const { data: withdraws, isLoading: withdrawsLoading } = useQuery<Withdraw[]>({
    queryKey: ["/api/admin/withdraws"],
    queryFn: async () => {
      const res = await fetch("/api/admin/withdraws", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/admin/deposits"],
    queryFn: async () => {
      const res = await fetch("/api/admin/deposits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const reviewWithdrawMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`/api/admin/withdraws/${id}/review`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdraws"] });
      toast({ title: "审核完成" });
    },
  });

  const reviewDepositMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`/api/admin/deposits/${id}/review`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] });
      toast({ title: "审核完成" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "applied":
        return <Badge variant="secondary">待审核</Badge>;
      case "approved":
      case "completed":
        return <Badge className="bg-green-100 text-green-700">已通过</Badge>;
      case "rejected":
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="充提管理">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="withdraws" className="gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            提现申请
          </TabsTrigger>
          <TabsTrigger value="deposits" className="gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            充值申请
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdraws">
          <Card>
            <CardHeader>
              <CardTitle>提现申请列表</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawsLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : !withdraws?.length ? (
                <div className="text-center py-8 text-gray-500">暂无提现申请</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">方式</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">账户</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {withdraws.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{item.id}</td>
                          <td className="px-4 py-3 text-sm">{item.phone || `用户${item.userId}`}</td>
                          <td className="px-4 py-3 text-sm font-medium text-red-600">-¥{item.amount}</td>
                          <td className="px-4 py-3 text-sm">{item.method || "-"}</td>
                          <td className="px-4 py-3 text-sm max-w-[150px] truncate">{item.accountInfo || "-"}</td>
                          <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {format(new Date(item.createdAt), "MM-dd HH:mm")}
                          </td>
                          <td className="px-4 py-3">
                            {(item.status === "pending" || item.status === "applied") && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => reviewWithdrawMutation.mutate({ id: item.id, approved: true })}
                                  disabled={reviewWithdrawMutation.isPending}
                                  data-testid={`button-approve-withdraw-${item.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => reviewWithdrawMutation.mutate({ id: item.id, approved: false })}
                                  disabled={reviewWithdrawMutation.isPending}
                                  data-testid={`button-reject-withdraw-${item.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>充值申请列表</CardTitle>
            </CardHeader>
            <CardContent>
              {depositsLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : !deposits?.length ? (
                <div className="text-center py-8 text-gray-500">暂无充值申请</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">方式</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">备注</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {deposits.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{item.id}</td>
                          <td className="px-4 py-3 text-sm">{item.phone || `用户${item.userId}`}</td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">+¥{item.amount}</td>
                          <td className="px-4 py-3 text-sm">{item.method || "-"}</td>
                          <td className="px-4 py-3 text-sm max-w-[150px] truncate">{item.remark || "-"}</td>
                          <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {format(new Date(item.createdAt), "MM-dd HH:mm")}
                          </td>
                          <td className="px-4 py-3">
                            {item.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => reviewDepositMutation.mutate({ id: item.id, approved: true })}
                                  disabled={reviewDepositMutation.isPending}
                                  data-testid={`button-approve-deposit-${item.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => reviewDepositMutation.mutate({ id: item.id, approved: false })}
                                  disabled={reviewDepositMutation.isPending}
                                  data-testid={`button-reject-deposit-${item.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
