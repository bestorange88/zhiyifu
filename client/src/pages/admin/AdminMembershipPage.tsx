import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Crown, Edit, Save } from "lucide-react";

interface VipPlan {
  id: number;
  level: number;
  name: string;
  price: string;
  dailyExtraSpins: number | null;
  withdrawMinAmount: string | null;
  withdrawSpeed: string | null;
  winMultiplier: string | null;
}

export default function AdminMembershipPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [editPlan, setEditPlan] = useState<VipPlan | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: plans, isLoading } = useQuery<VipPlan[]>({
    queryKey: ["/api/admin/vip-plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vip-plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: Partial<VipPlan> & { id: number }) => {
      const res = await fetch(`/api/admin/vip-plans/${data.id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vip-plans"] });
      toast({ title: "保存成功" });
      setShowEditDialog(false);
    },
  });

  const handleEditPlan = (plan: VipPlan) => {
    setEditPlan({ ...plan });
    setShowEditDialog(true);
  };

  const handleSavePlan = () => {
    if (!editPlan) return;
    updatePlanMutation.mutate(editPlan);
  };

  const getLevelBadge = (level: number) => {
    const colors = [
      "bg-gray-100 text-gray-700",
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-yellow-100 text-yellow-700",
    ];
    return <Badge className={colors[level] || colors[0]}>VIP{level}</Badge>;
  };

  return (
    <AdminLayout title="会员中心">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            VIP会员等级设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : !plans?.length ? (
            <div className="text-center py-8 text-gray-500">暂无VIP等级配置</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">等级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">价格</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">每日抽奖次数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">最低提现</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">提现速度</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">中奖倍率</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{getLevelBadge(plan.level)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{plan.name}</td>
                      <td className="px-4 py-3 text-sm font-medium text-orange-600">¥{plan.price}</td>
                      <td className="px-4 py-3 text-sm">{plan.dailyExtraSpins || 0}次</td>
                      <td className="px-4 py-3 text-sm">¥{plan.withdrawMinAmount || 100}</td>
                      <td className="px-4 py-3 text-sm">{plan.withdrawSpeed || "T+1"}</td>
                      <td className="px-4 py-3 text-sm">{plan.winMultiplier || 1}x</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑VIP等级</DialogTitle>
          </DialogHeader>
          {editPlan && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  value={editPlan.name}
                  onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                  data-testid="input-plan-name"
                />
              </div>
              <div className="space-y-2">
                <Label>价格 (元)</Label>
                <Input
                  type="number"
                  value={editPlan.price}
                  onChange={(e) => setEditPlan({ ...editPlan, price: e.target.value })}
                  data-testid="input-plan-price"
                />
              </div>
              <div className="space-y-2">
                <Label>每日额外抽奖次数</Label>
                <Input
                  type="number"
                  value={editPlan.dailyExtraSpins || 0}
                  onChange={(e) => setEditPlan({ ...editPlan, dailyExtraSpins: parseInt(e.target.value) || 0 })}
                  data-testid="input-plan-spins"
                />
              </div>
              <div className="space-y-2">
                <Label>最低提现金额 (元)</Label>
                <Input
                  type="number"
                  value={editPlan.withdrawMinAmount || ""}
                  onChange={(e) => setEditPlan({ ...editPlan, withdrawMinAmount: e.target.value })}
                  data-testid="input-plan-min-withdraw"
                />
              </div>
              <div className="space-y-2">
                <Label>提现速度</Label>
                <Input
                  value={editPlan.withdrawSpeed || ""}
                  onChange={(e) => setEditPlan({ ...editPlan, withdrawSpeed: e.target.value })}
                  placeholder="T+1"
                  data-testid="input-plan-withdraw-speed"
                />
              </div>
              <div className="space-y-2">
                <Label>中奖倍率</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editPlan.winMultiplier || ""}
                  onChange={(e) => setEditPlan({ ...editPlan, winMultiplier: e.target.value })}
                  data-testid="input-plan-multiplier"
                />
              </div>
              <Button onClick={handleSavePlan} disabled={updatePlanMutation.isPending} className="w-full" data-testid="button-save-plan">
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
