import { useState } from "react";
import { Users, Search, ChevronLeft, ChevronRight, Ban, CheckCircle, Plus, Minus, Eye, X, GitBranch, ArrowUp, ArrowDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserDetail {
  id: number;
  phone: string;
  inviteCode: string;
  vipLevel: number;
  status: string;
  createdAt: string;
  wallet: {
    balanceCashAvailable: string;
    balanceCashPending: string;
    balanceGift: string;
    totalDeposited: string;
    totalWithdrawn: string;
    totalEarnings: string;
  } | null;
  invitedBy: string | null;
  referralCount: number;
}

export default function AdminUsersPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [vipFilter, setVipFilter] = useState<string>("all");
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [relationshipModalOpen, setRelationshipModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerCurrency, setLedgerCurrency] = useState("cash_available");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [balanceType, setBalanceType] = useState<"add" | "subtract">("add");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserVipLevel, setNewUserVipLevel] = useState(0);
  const [newUserInviterCode, setNewUserInviterCode] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/users", page, searchQuery, vipFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.append("search", searchQuery);
      if (vipFilter !== "all") params.append("vipLevel", vipFilter);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: userDetail, isLoading: loadingDetail } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", selectedUser?.id, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load user detail");
      return res.json();
    },
    enabled: !!selectedUser && detailModalOpen,
  });

  const { data: relationshipData, isLoading: loadingRelationship } = useQuery({
    queryKey: ["/api/admin/users", selectedUser?.id, "relationship"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/relationship`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load relationship");
      return res.json();
    },
    enabled: !!selectedUser && relationshipModalOpen,
  });

  const { data: ledgerData, isLoading: loadingLedger } = useQuery({
    queryKey: ["/api/admin/users", selectedUser?.id, "ledger", ledgerPage, ledgerCurrency],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        page: String(ledgerPage), 
        limit: "10", 
        currency: ledgerCurrency 
      });
      const res = await fetch(`/api/admin/users/${selectedUser.id}/ledger?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load ledger");
      return res.json();
    },
    enabled: !!selectedUser && ledgerModalOpen,
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

  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, currency, reason }: { userId: number; amount: number; currency: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, currency, reason }),
      });
      if (!res.ok) throw new Error("Failed to adjust balance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setBalanceModalOpen(false);
      setBalanceAmount("");
      setBalanceReason("");
      toast({ title: "余额调整成功" });
    },
    onError: () => {
      toast({ title: "余额调整失败", variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { phone: string; password: string; vipLevel: number; inviterCode?: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "创建失败");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateUserModalOpen(false);
      setNewUserPhone("");
      setNewUserPassword("");
      setNewUserVipLevel(0);
      setNewUserInviterCode("");
      toast({ title: "用户创建成功" });
    },
    onError: (error: any) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateUser = () => {
    if (!newUserPhone || !newUserPassword) {
      toast({ title: "请填写手机号和密码", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({
      phone: newUserPhone,
      password: newUserPassword,
      vipLevel: newUserVipLevel,
      inviterCode: newUserInviterCode || undefined,
    });
  };

  const handleBalanceAdjust = () => {
    if (!selectedUser || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "请输入有效金额", variant: "destructive" });
      return;
    }
    const finalAmount = balanceType === "subtract" ? -amount : amount;
    adjustBalanceMutation.mutate({ 
      userId: selectedUser.id, 
      amount: finalAmount, 
      currency: "cny",
      reason: balanceReason || (balanceType === "add" ? "管理员加款" : "管理员扣款")
    });
  };

  const openBalanceModal = (user: any, type: "add" | "subtract") => {
    setSelectedUser(user);
    setBalanceType(type);
    setBalanceAmount("");
    setBalanceReason("");
    setBalanceModalOpen(true);
  };

  const openDetailModal = (user: any) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const openRelationshipModal = (user: any) => {
    setSelectedUser(user);
    setRelationshipModalOpen(true);
  };

  const openLedgerModal = (user: any) => {
    setSelectedUser(user);
    setLedgerModalOpen(true);
    setLedgerPage(1);
  };

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <AdminLayout title="用户管理">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="搜索手机号..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">共 {data?.total || 0} 位用户</span>
              <Button
                size="sm"
                onClick={() => setCreateUserModalOpen(true)}
                data-testid="button-create-user"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                新建用户
              </Button>
            </div>
          </div>
          
          <Tabs value={vipFilter} onValueChange={(val) => { setVipFilter(val); setPage(1); }}>
            <TabsList className="grid w-full grid-cols-7" data-testid="tabs-vip-filter">
              <TabsTrigger value="all" data-testid="tab-vip-all">全部</TabsTrigger>
              <TabsTrigger value="0" data-testid="tab-vip-0">普通</TabsTrigger>
              <TabsTrigger value="1" data-testid="tab-vip-1">V1</TabsTrigger>
              <TabsTrigger value="2" data-testid="tab-vip-2">V2</TabsTrigger>
              <TabsTrigger value="3" data-testid="tab-vip-3">V3</TabsTrigger>
              <TabsTrigger value="4" data-testid="tab-vip-4">V4</TabsTrigger>
              <TabsTrigger value="5" data-testid="tab-vip-5">V5</TabsTrigger>
            </TabsList>
          </Tabs>
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
                <th className="px-4 py-3 text-left">积分</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">注册时间</th>
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
                    <td className="px-4 py-3 text-sm text-orange-600 font-medium">
                      {user.wallet?.balancePoints || 0}
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
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openBalanceModal(user, "add")}
                          className="text-green-600 border-green-200"
                          data-testid={`button-add-balance-${user.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openBalanceModal(user, "subtract")}
                          className="text-red-600 border-red-200"
                          data-testid={`button-subtract-balance-${user.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailModal(user)}
                          data-testid={`button-user-detail-${user.id}`}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRelationshipModal(user)}
                          className="text-purple-600 border-purple-200"
                          data-testid={`button-user-relationship-${user.id}`}
                        >
                          <GitBranch className="w-3 h-3" />
                        </Button>
                        {user.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ userId: user.id, status: "banned" })}
                            className="text-red-600 border-red-200"
                            data-testid={`button-ban-user-${user.id}`}
                          >
                            <Ban className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ userId: user.id, status: "active" })}
                            className="text-green-600 border-green-200"
                            data-testid={`button-enable-user-${user.id}`}
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
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

      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{balanceType === "add" ? "加款" : "扣款"} - {selectedUser?.phone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>金额</Label>
              <Input
                type="number"
                placeholder="请输入金额"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                data-testid="input-balance-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                placeholder="请输入备注（可选）"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                data-testid="input-balance-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBalanceModalOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={handleBalanceAdjust}
                disabled={adjustBalanceMutation.isPending}
                variant={balanceType === "subtract" ? "destructive" : "default"}
                data-testid="button-confirm-balance"
              >
                {adjustBalanceMutation.isPending ? "处理中..." : "确认"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="py-8 text-center text-gray-500">加载中...</div>
          ) : userDetail ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">手机号</Label>
                  <p className="font-medium">{userDetail.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">邀请码</Label>
                  <p className="font-mono text-purple-600">{userDetail.inviteCode}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">VIP等级</Label>
                  <p>{userDetail.vipLevel > 0 ? `VIP${userDetail.vipLevel}` : "普通用户"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">状态</Label>
                  <p className={userDetail.status === "active" ? "text-green-600" : "text-red-600"}>
                    {userDetail.status === "active" ? "正常" : "禁用"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">注册时间</Label>
                  <p>{new Date(userDetail.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">邀请人</Label>
                  <p>{userDetail.invitedBy || "无"}</p>
                </div>
              </div>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">钱包信息</h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => {
                      setDetailModalOpen(false);
                      openLedgerModal(selectedUser);
                    }}
                  >
                    资金明细
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">可用余额</span>
                    <p className="font-bold text-green-600">¥{userDetail.wallet?.balanceCashAvailable || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">冻结余额</span>
                    <p className="font-bold text-orange-600">¥{userDetail.wallet?.balanceCashPending || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">赠送余额</span>
                    <p className="font-bold">¥{userDetail.wallet?.balanceGift || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">累计充值</span>
                    <p className="font-bold">¥{userDetail.wallet?.totalDeposited || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">累计提现</span>
                    <p className="font-bold">¥{userDetail.wallet?.totalWithdrawn || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">累计收益</span>
                    <p className="font-bold">¥{userDetail.wallet?.totalEarnings || "0.00"}</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>邀请人数: {userDetail.referralCount || 0} 人</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">加载失败</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={relationshipModalOpen} onOpenChange={setRelationshipModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              上下级关系 - {selectedUser?.phone}
            </DialogTitle>
          </DialogHeader>
          {loadingRelationship ? (
            <div className="py-8 text-center text-gray-500">加载中...</div>
          ) : relationshipData ? (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">当前用户</p>
                <p className="font-bold text-lg">{relationshipData.user?.phone}</p>
                <p className="text-xs text-purple-600">邀请码: {relationshipData.user?.inviteCode}</p>
              </div>

              {relationshipData.stats && (
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                      <span className="font-bold text-gray-800">下级：{relationshipData.stats.total}人</span>
                      <span className="text-gray-600">直推：{relationshipData.stats.l1}人</span>
                      <span className="text-gray-600">间推：{relationshipData.stats.l2}人</span>
                      <span className="text-gray-600">三代：{relationshipData.stats.l3}人</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map(level => {
                        const count = relationshipData.stats.vipCounts[level] || 0;
                        const details = relationshipData.stats.vipDetails?.[level] || [];
                        
                        if (count === 0) return null;

                        return (
                          <TooltipProvider key={level}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded border border-amber-200 cursor-pointer hover:bg-amber-200 transition-colors">
                                  VIP{level}: {count}人
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] max-h-[300px] overflow-y-auto">
                                <p className="font-semibold mb-1 text-xs">VIP{level} 用户列表</p>
                                {details.length > 0 ? (
                                  <div className="text-xs space-y-0.5">
                                    {details.map((phone: string, idx: number) => (
                                      <div key={idx}>{phone}</div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">无详情</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      {Object.values(relationshipData.stats.vipCounts).every((c: any) => c === 0) && (
                         <span className="text-xs text-gray-400">暂无VIP下级</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ArrowUp className="w-4 h-4 text-blue-500" />
                  上级链 ({relationshipData.upline?.length || 0}层)
                </div>
                {relationshipData.upline?.length > 0 ? (
                  <div className="space-y-1 pl-6">
                    {relationshipData.upline.map((parent: any) => (
                      <div 
                        key={parent.id} 
                        className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm"
                      >
                        <span className="font-medium">{parent.phone}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">第{parent.level}级</span>
                          {parent.vipLevel > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                              VIP{parent.vipLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pl-6 text-sm text-gray-400">无上级</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ArrowDown className="w-4 h-4 text-green-500" />
                  直推下级 ({relationshipData.downline?.length || 0}人)
                </div>
                {relationshipData.downline?.length > 0 ? (
                  <div className="space-y-1 pl-6">
                    {relationshipData.downline.map((child: any) => (
                      <div 
                        key={child.id} 
                        className="flex items-center justify-between p-2 bg-green-50 rounded text-sm"
                      >
                        <span className="font-medium">{child.phone}</span>
                        <div className="flex items-center gap-2">
                          {child.subCount > 0 && (
                            <span className="text-xs text-gray-500">下级{child.subCount}人</span>
                          )}
                          {child.vipLevel > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                              VIP{child.vipLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pl-6 text-sm text-gray-400">无下级</p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">加载失败</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-500" />
              新建用户
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>手机号 *</Label>
              <Input
                placeholder="请输入手机号"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                data-testid="input-new-user-phone"
              />
            </div>
            <div className="space-y-2">
              <Label>密码 *</Label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                data-testid="input-new-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label>VIP等级</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={newUserVipLevel}
                onChange={(e) => setNewUserVipLevel(parseInt(e.target.value))}
                data-testid="select-new-user-vip"
              >
                <option value={0}>普通用户</option>
                <option value={1}>VIP1</option>
                <option value={2}>VIP2</option>
                <option value={3}>VIP3</option>
                <option value={4}>VIP4</option>
                <option value={5}>VIP5</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>邀请码（可选）</Label>
              <Input
                placeholder="填写上级邀请码"
                value={newUserInviterCode}
                onChange={(e) => setNewUserInviterCode(e.target.value)}
                data-testid="input-new-user-inviter"
              />
            </div>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="w-full"
              data-testid="button-submit-create-user"
            >
              {createUserMutation.isPending ? "创建中..." : "创建用户"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ledgerModalOpen} onOpenChange={setLedgerModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>资金往来明细 - {selectedUser?.phone}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={ledgerCurrency} onValueChange={(v) => { setLedgerCurrency(v); setLedgerPage(1); }}>
            <TabsList>
              <TabsTrigger value="cash_available">可用余额</TabsTrigger>
              <TabsTrigger value="cash_frozen">冻结余额</TabsTrigger>
              <TabsTrigger value="points">积分</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">时间</th>
                  <th className="px-3 py-2 text-left">类型</th>
                  <th className="px-3 py-2 text-right">变动金额</th>
                  <th className="px-3 py-2 text-right">变动后余额</th>
                  <th className="px-3 py-2 text-left">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingLedger ? (
                  <tr><td colSpan={5} className="text-center py-4">加载中...</td></tr>
                ) : ledgerData?.records?.length > 0 ? (
                  ledgerData.records.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{new Date(record.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                         <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{record.type}</span>
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${parseFloat(record.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(record.amount) > 0 ? '+' : ''}{record.amount}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {record.balanceAfter}
                      </td>
                      <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate" title={record.description}>
                        {record.description}
                      </td>
                    </tr>
                  ))
                ) : (
                   <tr><td colSpan={5} className="text-center py-8 text-gray-400">暂无记录</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
             <span className="text-xs text-gray-500">共 {ledgerData?.total || 0} 条</span>
             <div className="flex gap-2">
               <Button size="sm" variant="outline" disabled={ledgerPage <= 1} onClick={() => setLedgerPage(p => p - 1)}>
                 上一页
               </Button>
               <Button size="sm" variant="outline" disabled={ledgerPage * 10 >= (ledgerData?.total || 0)} onClick={() => setLedgerPage(p => p + 1)}>
                 下一页
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
