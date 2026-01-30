import { useState } from "react";
import { CreditCard, Check, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTime } from "@/lib/utils";

export default function AdminIdentityPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [batchRejectDialog, setBatchRejectDialog] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/identity-verifications", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/identity-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load verifications");
      return res.json();
    },
    enabled: !!token,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approved, reviewNote }: { id: number; approved: boolean; reviewNote?: string }) => {
      const res = await fetch(`/api/admin/identity-verifications/${id}/review`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved, reviewNote }),
      });
      if (!res.ok) throw new Error("Failed to review verification");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/identity-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "审核完成" });
      setRejectDialog({ open: false, id: null });
      setRejectReason("");
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "审核失败", description: error.message, variant: "destructive" });
    },
  });

  const batchReviewMutation = useMutation({
    mutationFn: async ({ ids, approved, reviewNote }: { ids: number[]; approved: boolean; reviewNote?: string }) => {
      const res = await fetch(`/api/admin/identity-verifications/batch-review`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids, approved, reviewNote }),
      });
      if (!res.ok) throw new Error("批量审核失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/identity-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "批量审核完成" });
      setSelectedIds([]);
      setBatchRejectDialog(false);
      setRejectReason("");
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "批量审核失败", description: error.message, variant: "destructive" });
    },
  });

  const handleReject = () => {
    if (!rejectDialog.id) return;
    if (!rejectReason.trim()) {
      toast({ title: "请输入拒绝原因", variant: "destructive" });
      return;
    }
    reviewMutation.mutate({ id: rejectDialog.id, approved: false, reviewNote: rejectReason });
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要批量通过选中的 ${selectedIds.length} 个申请吗？`)) {
      // Ensure IDs are numbers
      const numericIds = selectedIds.map(id => Number(id));
      batchReviewMutation.mutate({ ids: numericIds, approved: true });
    }
  };

  const handleBatchReject = () => {
    if (selectedIds.length === 0) return;
    if (!rejectReason.trim()) {
      toast({ title: "请输入拒绝原因", variant: "destructive" });
      return;
    }
    // Ensure IDs are numbers
    const numericIds = selectedIds.map(id => Number(id));
    batchReviewMutation.mutate({ ids: numericIds, approved: false, reviewNote: rejectReason });
  };

  const filteredData = data?.filter((v: any) => {
    if (!statusFilter) return true;
    return v.status === statusFilter;
  }) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = filteredData.filter((v: any) => v.status === "pending").map((v: any) => v.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: number) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const viewImage = (imageUrl: string) => {
    setCurrentImage(imageUrl);
    setShowImageDialog(true);
  };

  return (
    <AdminLayout title="实名认证审核">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">状态筛选：</span>
            <div className="flex gap-2">
              {[
                { value: "pending", label: "待审核" },
                { value: "approved", label: "已通过" },
                { value: "rejected", label: "已拒绝" },
                { value: "", label: "全部" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={statusFilter === opt.value ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setSelectedIds([]);
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {selectedIds.length > 0 && statusFilter === "pending" && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <Button
                size="sm"
                onClick={handleBatchApprove}
                disabled={batchReviewMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-3 h-3 mr-1" />
                批量通过 ({selectedIds.length})
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setRejectReason("信息不符或照片不清晰");
                  setBatchRejectDialog(true);
                }}
                disabled={batchReviewMutation.isPending}
              >
                <X className="w-3 h-3 mr-1" />
                批量拒绝 ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 w-10">
                  {statusFilter === "pending" && filteredData.length > 0 && (
                    <Checkbox 
                      checked={selectedIds.length > 0 && selectedIds.length === filteredData.filter((v: any) => v.status === "pending").length}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">真实姓名</th>
                <th className="px-4 py-3 text-left">身份证号</th>
                <th className="px-4 py-3 text-left">证件照片</th>
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
              ) : filteredData.length > 0 ? (
                filteredData.map((v: any) => (
                  <tr key={v.id} className={`hover:bg-gray-50 ${selectedIds.includes(v.id) ? "bg-blue-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      {v.status === "pending" && (
                        <Checkbox 
                          checked={selectedIds.includes(v.id)}
                          onCheckedChange={(checked) => handleSelectOne(checked as boolean, v.id)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{v.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{v.userPhone || `用户${v.userId}`}</p>
                        <p className="text-xs text-gray-400">ID: {v.userId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{v.realName}</td>
                    <td className="px-4 py-3 text-sm font-mono">{v.idNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded overflow-hidden border cursor-pointer hover:opacity-80"
                          onClick={() => viewImage(v.idFrontImage)}
                        >
                          <img src={v.idFrontImage} alt="正面" className="w-full h-full object-cover" />
                        </div>
                        <div 
                          className="w-10 h-10 rounded overflow-hidden border cursor-pointer hover:opacity-80"
                          onClick={() => viewImage(v.idBackImage)}
                        >
                          <img src={v.idBackImage} alt="背面" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        v.status === "pending" ? "bg-orange-100 text-orange-700" :
                        v.status === "approved" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {v.status === "pending" ? "待审核" : v.status === "approved" ? "已通过" : "已拒绝"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateTime(v.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {v.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ id: v.id, approved: true })}
                            disabled={reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectDialog({ open: true, id: v.id });
                              setRejectReason("信息不符或照片不清晰");
                            }}
                            disabled={reviewMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            拒绝
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {v.reviewNote || "已处理"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    暂无实名认证申请
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">拒绝原因</label>
            <textarea
              className="w-full p-2 border rounded-md min-h-[100px]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因，例如：身份证照片模糊、信息不一致等"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>取消</Button>
            <Button variant="destructive" onClick={handleReject} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? "处理中..." : "确认拒绝"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchRejectDialog} onOpenChange={setBatchRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量拒绝申请</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">拒绝原因</label>
            <textarea
              className="w-full p-2 border rounded-md min-h-[100px]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因，例如：身份证照片模糊、信息不一致等"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBatchRejectDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleBatchReject} disabled={batchReviewMutation.isPending}>
              {batchReviewMutation.isPending ? "处理中..." : `确认拒绝 (${selectedIds.length}项)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>查看证件照片</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img 
              src={currentImage} 
              alt="证件照片" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
