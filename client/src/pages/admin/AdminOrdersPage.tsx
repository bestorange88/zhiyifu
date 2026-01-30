import { useState } from "react";
import { ShoppingBag, ChevronLeft, ChevronRight, Eye, Search, RefreshCw, Truck, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminOrdersPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Shipping Dialog State
  const [shippingOrder, setShippingOrder] = useState<any>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/orders", page, statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
    enabled: !!token,
  });

  const shipMutation = useMutation({
    mutationFn: async (data: { id: number; carrier: string; trackingNo: string }) => {
      const res = await fetch(`/api/admin/orders/${data.id}/ship`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ carrier: data.carrier, trackingNo: data.trackingNo }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "发货失败");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "发货成功", description: "订单状态已更新" });
      setShippingOrder(null);
      setCarrier("");
      setTrackingNo("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: Error) => {
      toast({ title: "发货失败", description: error.message, variant: "destructive" });
    },
  });

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/simulate/shopping", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "模拟失败");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "模拟下单成功", description: `生成订单: ${data.orderNo}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: Error) => {
      toast({ title: "模拟失败", description: error.message, variant: "destructive" });
    },
  });

  const handleShip = () => {
    if (!carrier || !trackingNo) {
      toast({ title: "请填写完整", description: "物流公司和运单号不能为空", variant: "destructive" });
      return;
    }
    shipMutation.mutate({ id: shippingOrder.id, carrier, trackingNo });
  };

  const totalPages = Math.ceil((data?.total || 0) / 20);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_payment": return "待支付";
      case "pending_shipment": return "待发货";
      case "shipped": return "已发货";
      case "completed": return "已完成";
      case "cancelled": return "已取消";
      case "refunded": return "已退款";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment": return "bg-orange-100 text-orange-700";
      case "pending_shipment": return "bg-blue-100 text-blue-700";
      case "shipped": return "bg-purple-100 text-purple-700";
      case "completed": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getOrderName = (order: any) => {
    if (order.isVirtualOrder) return "虚拟买家订单";
    if (order.type === "vip") return `升级VIP${order.productId}`;
    if (order.type === "deposit") return "账户充值";
    if (order.type === "lottery") return "抽奖购买";
    return order.type === "shop" ? "商品订单" : (order.type || "未知");
  };

  return (
    <AdminLayout title="订单管理">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索订单号或手机号..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                data-testid="input-search-orders"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateMutation.mutate()}
                disabled={simulateMutation.isPending}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {simulateMutation.isPending ? "模拟中..." : "模拟虚拟买家下单"}
              </Button>
              <span className="text-sm text-gray-500">共 {data?.total || 0} 条订单</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] })}
                data-testid="button-refresh-orders"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-500">状态筛选：</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "", label: "全部" },
                { value: "pending_payment", label: "待支付" },
                { value: "pending_shipment", label: "待发货" },
                { value: "shipped", label: "已发货" },
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
                  data-testid={`button-filter-${opt.value || "all"}`}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
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
                    <td className="px-4 py-3 text-sm font-mono">
                      {order.orderNo}
                      {order.isVirtualOrder && (
                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">虚</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{order.userPhone || "虚拟用户"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {getOrderName(order)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">¥{order.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {order.status === "pending_shipment" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => setShippingOrder(order)}
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          发货
                        </Button>
                      )}
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
                  <p>{selectedOrder.userPhone || (selectedOrder.isVirtualOrder ? "虚拟用户" : "-")}</p>
                </div>
                <div>
                  <p className="text-gray-500">金额</p>
                  <p className="font-bold text-green-600">¥{selectedOrder.amount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">订单名目</p>
                  <p className="font-medium text-purple-600">{getOrderName(selectedOrder)}</p>
                </div>
                {selectedOrder.carrier && (
                  <div className="col-span-2 bg-gray-50 p-3 rounded">
                    <p className="text-gray-500 text-xs mb-1">物流信息</p>
                    <p className="font-medium">{selectedOrder.carrier} - {selectedOrder.trackingNo}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-gray-500">创建时间</p>
                  <p>{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.paidAt && (
                  <div className="col-span-2">
                    <p className="text-gray-500">支付时间</p>
                    <p>{formatDateTime(selectedOrder.paidAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!shippingOrder} onOpenChange={(open) => !open && setShippingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>订单发货</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>物流公司</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="选择物流公司" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SF">顺丰速运</SelectItem>
                  <SelectItem value="YTO">圆通速递</SelectItem>
                  <SelectItem value="ZTO">中通快递</SelectItem>
                  <SelectItem value="JD">京东物流</SelectItem>
                  <SelectItem value="EMS">EMS</SelectItem>
                  <SelectItem value="DHL">DHL (跨境)</SelectItem>
                  <SelectItem value="FEDEX">FedEx (跨境)</SelectItem>
                  <SelectItem value="UPS">UPS (跨境)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>运单号</Label>
              <Input 
                value={trackingNo} 
                onChange={(e) => setTrackingNo(e.target.value)}
                placeholder="输入运单号"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingOrder(null)}>取消</Button>
            <Button onClick={handleShip} disabled={shipMutation.isPending}>
              {shipMutation.isPending ? "发货中..." : "确认发货"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
