import { useState } from "react";
import { ShoppingBag, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminOrdersPage() {
  const { token } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/orders", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
    enabled: !!token,
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "待支付";
      case "paid": return "已支付";
      case "completed": return "已完成";
      case "cancelled": return "已取消";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-700";
      case "paid": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout title="订单管理">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <span className="text-sm text-gray-500">状态筛选：</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "", label: "全部" },
              { value: "pending", label: "待支付" },
              { value: "paid", label: "已支付" },
              { value: "completed", label: "已完成" },
              { value: "cancelled", label: "已取消" },
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
                <th className="px-4 py-3 text-left">订单号</th>
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">商品</th>
                <th className="px-4 py-3 text-left">金额</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">创建时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data?.orders?.length > 0 ? (
                data.orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{order.orderNo}</td>
                    <td className="px-4 py-3 text-sm">{order.userPhone}</td>
                    <td className="px-4 py-3 text-sm">
                      {order.productType === "vip" ? (
                        <span className="text-amber-600">VIP{order.productId}会员</span>
                      ) : (
                        order.productType
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">¥{order.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    暂无订单
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

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">订单号</p>
                  <p className="font-mono">{selectedOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-gray-500">状态</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">用户</p>
                  <p>{selectedOrder.userPhone}</p>
                </div>
                <div>
                  <p className="text-gray-500">金额</p>
                  <p className="font-bold text-green-600">¥{selectedOrder.amount}</p>
                </div>
                <div>
                  <p className="text-gray-500">商品类型</p>
                  <p>{selectedOrder.productType}</p>
                </div>
                <div>
                  <p className="text-gray-500">商品ID</p>
                  <p>{selectedOrder.productId}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">创建时间</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                {selectedOrder.paidAt && (
                  <div className="col-span-2">
                    <p className="text-gray-500">支付时间</p>
                    <p>{new Date(selectedOrder.paidAt).toLocaleString("zh-CN")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
