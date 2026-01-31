import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDateTimeShort } from "@/lib/utils";
import { Gift, History, Edit, Plus, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface WheelPrize {
  id: number;
  name: string;
  type: string;
  amount: string | null;
  probability: string;
  stock: number | null;
  displayOrder: number | null;
  isActive: boolean | null;
}

interface WheelSpin {
  id: number;
  userId: number;
  prizeName: string | null;
  status: string;
  createdAt: string;
  phone?: string;
}

export default function AdminLotteryPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("prizes");
  const [editPrize, setEditPrize] = useState<WheelPrize | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: prizes, isLoading: prizesLoading } = useQuery<WheelPrize[]>({
    queryKey: ["/api/admin/lottery/prizes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/lottery/prizes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const { data: spins, isLoading: spinsLoading } = useQuery<WheelSpin[]>({
    queryKey: ["/api/admin/lottery/spins"],
    queryFn: async () => {
      const res = await fetch("/api/admin/lottery/spins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const updatePrizeMutation = useMutation({
    mutationFn: async (data: Partial<WheelPrize> & { id: number }) => {
      const res = await fetch(`/api/admin/lottery/prizes/${data.id}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lottery/prizes"] });
      toast({ title: "保存成功" });
      setShowEditDialog(false);
    },
  });

  const handleEditPrize = (prize: WheelPrize) => {
    setEditPrize({ ...prize });
    setShowEditDialog(true);
  };

  const handleSavePrize = () => {
    if (!editPrize) return;
    updatePrizeMutation.mutate(editPrize);
  };

  return (
    <AdminLayout title="抽奖管理">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="prizes" className="gap-2">
            <Gift className="w-4 h-4" />
            奖品设置
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <History className="w-4 h-4" />
            抽奖记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prizes">
          <Card>
            <CardHeader>
              <CardTitle>奖品列表</CardTitle>
            </CardHeader>
            <CardContent>
              {prizesLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : !prizes?.length ? (
                <div className="text-center py-8 text-gray-500">暂无奖品</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">名称</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">类型</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">金额/数量</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">概率</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">库存</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {prizes.map((prize) => (
                        <tr key={prize.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{prize.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="secondary">{prize.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{prize.amount || "-"}</td>
                          <td className="px-4 py-3 text-sm">{(parseFloat(prize.probability) * 100).toFixed(2)}%</td>
                          <td className="px-4 py-3 text-sm">{prize.stock ?? "无限"}</td>
                          <td className="px-4 py-3">
                            {prize.isActive ? (
                              <Badge className="bg-green-100 text-green-700">启用</Badge>
                            ) : (
                              <Badge variant="secondary">禁用</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditPrize(prize)}
                              data-testid={`button-edit-prize-${prize.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
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

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>抽奖记录</CardTitle>
            </CardHeader>
            <CardContent>
              {spinsLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : !spins?.length ? (
                <div className="text-center py-8 text-gray-500">暂无抽奖记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">奖品</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {spins.map((spin) => (
                        <tr key={spin.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{spin.id}</td>
                          <td className="px-4 py-3 text-sm">{spin.phone || `用户${spin.userId}`}</td>
                          <td className="px-4 py-3 text-sm font-medium">{spin.prizeName || "-"}</td>
                          <td className="px-4 py-3">
                            <Badge className={spin.status === "success" ? "bg-green-100 text-green-700" : ""}>
                              {spin.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDateTimeShort(spin.createdAt)}
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑奖品</DialogTitle>
          </DialogHeader>
          {editPrize && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  value={editPrize.name}
                  onChange={(e) => setEditPrize({ ...editPrize, name: e.target.value })}
                  data-testid="input-prize-name"
                />
              </div>
              <div className="space-y-2">
                <Label>金额</Label>
                <Input
                  type="number"
                  value={editPrize.amount || ""}
                  onChange={(e) => setEditPrize({ ...editPrize, amount: e.target.value })}
                  data-testid="input-prize-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>概率 (0-1)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editPrize.probability}
                  onChange={(e) => setEditPrize({ ...editPrize, probability: e.target.value })}
                  data-testid="input-prize-probability"
                />
              </div>
              <div className="space-y-2">
                <Label>库存</Label>
                <Input
                  type="number"
                  value={editPrize.stock ?? ""}
                  onChange={(e) => setEditPrize({ ...editPrize, stock: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="留空表示无限"
                  data-testid="input-prize-stock"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editPrize.isActive ?? true}
                  onCheckedChange={(checked) => setEditPrize({ ...editPrize, isActive: checked })}
                  data-testid="switch-prize-active"
                />
                <Label>启用</Label>
              </div>
              <Button onClick={handleSavePrize} disabled={updatePrizeMutation.isPending} className="w-full" data-testid="button-save-prize">
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
