import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Crown, Users, Percent, Gift, Zap, Headphones, Sparkles, Star, RefreshCw } from "lucide-react";

interface RankRule {
  id: number;
  rank: number;
  name: string;
  openingFee: string | null;
  directRequired: number | null;
  team3genRequired: number | null;
  directCommissionRate: string | null;
  indirectCommissionRate: string | null;
  cashBonus: string | null;
  dailySpins: number | null;
  withdrawMinAmount: string | null;
  withdrawSpeed: string | null;
  winMultiplier: string | null;
  hasVipService: boolean | null;
  hasUnlimitedAI: boolean | null;
  hasPromoBonus: boolean | null;
  hasPriorityWelfare: boolean | null;
}

export default function AdminVipRanksPage() {
  const { toast } = useToast();
  const [editingRank, setEditingRank] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<RankRule>>({});

  const { data: ranks, isLoading } = useQuery<RankRule[]>({
    queryKey: ["/api/admin/ranks"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ rank, data }: { rank: number; data: Partial<RankRule> }) => {
      return apiRequest("PUT", `/api/admin/ranks/${rank}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ranks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referral/ranks"] });
      toast({ title: "保存成功", description: "等级规则已更新" });
      setEditingRank(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (rank: RankRule) => {
    setEditingRank(rank.rank);
    setFormData({ ...rank });
  };

  const handleSave = () => {
    if (editingRank && formData) {
      const { id, rank, ...editableFields } = formData as any;
      updateMutation.mutate({ rank: editingRank, data: editableFields });
    }
  };

  const handleCancel = () => {
    setEditingRank(null);
    setFormData({});
  };

  const updateField = (field: keyof RankRule, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout title="VIP等级管理">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="VIP等级管理">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">VIP等级规则配置</h2>
            <p className="text-sm text-gray-500">配置各等级的开通费用、升级要求、佣金比例和权益</p>
          </div>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/ranks"] })}
            data-testid="button-refresh-ranks"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>

        <div className="grid gap-6">
          {ranks?.map((rank) => (
            <Card key={rank.id} className="overflow-visible" data-testid={`card-rank-${rank.rank}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rank.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">等级 {rank.rank}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingRank === rank.rank ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          data-testid={`button-cancel-${rank.rank}`}
                        >
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          data-testid={`button-save-${rank.rank}`}
                        >
                          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                          保存
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rank)}
                        data-testid={`button-edit-${rank.rank}`}
                      >
                        编辑
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingRank === rank.rank ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Gift className="w-4 h-4" /> 基本信息
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label>等级名称</Label>
                          <Input
                            value={formData.name || ""}
                            onChange={(e) => updateField("name", e.target.value)}
                            data-testid={`input-name-${rank.rank}`}
                          />
                        </div>
                        <div>
                          <Label>开通费用 (元)</Label>
                          <Input
                            value={formData.openingFee || ""}
                            onChange={(e) => updateField("openingFee", e.target.value)}
                            data-testid={`input-openingFee-${rank.rank}`}
                          />
                        </div>
                        <div>
                          <Label>升级现金奖励 (元)</Label>
                          <Input
                            value={formData.cashBonus || ""}
                            onChange={(e) => updateField("cashBonus", e.target.value)}
                            data-testid={`input-cashBonus-${rank.rank}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Users className="w-4 h-4" /> 升级要求
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label>直推人数要求</Label>
                          <Input
                            type="number"
                            value={formData.directRequired || 0}
                            onChange={(e) => updateField("directRequired", parseInt(e.target.value) || 0)}
                            data-testid={`input-directRequired-${rank.rank}`}
                          />
                        </div>
                        <div>
                          <Label>三代团队人数要求</Label>
                          <Input
                            type="number"
                            value={formData.team3genRequired || 0}
                            onChange={(e) => updateField("team3genRequired", parseInt(e.target.value) || 0)}
                            data-testid={`input-team3genRequired-${rank.rank}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Percent className="w-4 h-4" /> 佣金设置
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label>直推佣金比例</Label>
                          <Input
                            value={formData.directCommissionRate || ""}
                            onChange={(e) => updateField("directCommissionRate", e.target.value)}
                            placeholder="0.10 = 10%"
                            data-testid={`input-directCommissionRate-${rank.rank}`}
                          />
                        </div>
                        <div>
                          <Label>间推佣金比例</Label>
                          <Input
                            value={formData.indirectCommissionRate || ""}
                            onChange={(e) => updateField("indirectCommissionRate", e.target.value)}
                            placeholder="0.05 = 5%"
                            data-testid={`input-indirectCommissionRate-${rank.rank}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> 抽奖与提现
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label>每日抽奖次数</Label>
                          <Input
                            type="number"
                            value={formData.dailySpins || 0}
                            onChange={(e) => updateField("dailySpins", parseInt(e.target.value) || 0)}
                            data-testid={`input-dailySpins-${rank.rank}`}
                          />
                        </div>
                        <div>
                          <Label>最低提现金额 (元)</Label>
                          <Input
                            value={formData.withdrawMinAmount || ""}
                            onChange={(e) => updateField("withdrawMinAmount", e.target.value)}
                            data-testid={`input-withdrawMinAmount-${rank.rank}`}
                          />
                        </div>
                        <div>
                          <Label>提现到账速度</Label>
                          <Input
                            value={formData.withdrawSpeed || ""}
                            onChange={(e) => updateField("withdrawSpeed", e.target.value)}
                            placeholder="T+0 或 T+1"
                            data-testid={`input-withdrawSpeed-${rank.rank}`}
                          />
                        </div>
                        <div>
                          <Label>中奖倍率</Label>
                          <Input
                            value={formData.winMultiplier || ""}
                            onChange={(e) => updateField("winMultiplier", e.target.value)}
                            placeholder="1.2"
                            data-testid={`input-winMultiplier-${rank.rank}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 md:col-span-2">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Star className="w-4 h-4" /> 特权开关
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <Label className="text-sm">专属VIP客服</Label>
                          <Switch
                            checked={formData.hasVipService ?? false}
                            onCheckedChange={(v) => updateField("hasVipService", v)}
                            data-testid={`switch-hasVipService-${rank.rank}`}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <Label className="text-sm">无限AI使用</Label>
                          <Switch
                            checked={formData.hasUnlimitedAI ?? false}
                            onCheckedChange={(v) => updateField("hasUnlimitedAI", v)}
                            data-testid={`switch-hasUnlimitedAI-${rank.rank}`}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <Label className="text-sm">推广奖金加成</Label>
                          <Switch
                            checked={formData.hasPromoBonus ?? false}
                            onCheckedChange={(v) => updateField("hasPromoBonus", v)}
                            data-testid={`switch-hasPromoBonus-${rank.rank}`}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <Label className="text-sm">优先福利</Label>
                          <Switch
                            checked={formData.hasPriorityWelfare ?? false}
                            onCheckedChange={(v) => updateField("hasPriorityWelfare", v)}
                            data-testid={`switch-hasPriorityWelfare-${rank.rank}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">开通费用</p>
                      <p className="font-semibold text-lg text-orange-600">{rank.openingFee || "0"}元</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">升级要求</p>
                      <p className="font-medium">直推 {rank.directRequired || 0} 人</p>
                      {(rank.team3genRequired || 0) > 0 && (
                        <p className="text-sm text-muted-foreground">三代 {rank.team3genRequired} 人</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">佣金比例</p>
                      <p className="font-medium">直推 {(parseFloat(rank.directCommissionRate || "0") * 100).toFixed(0)}%</p>
                      {parseFloat(rank.indirectCommissionRate || "0") > 0 && (
                        <p className="text-sm text-muted-foreground">间推 {(parseFloat(rank.indirectCommissionRate || "0") * 100).toFixed(0)}%</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">升级奖励</p>
                      <p className="font-semibold text-green-600">{rank.cashBonus || "0"}元</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">每日抽奖</p>
                      <p className="font-medium">{rank.dailySpins || 0} 次</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">提现规则</p>
                      <p className="font-medium">{rank.withdrawMinAmount || "0"}元起 / {rank.withdrawSpeed || "T+1"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">中奖倍率</p>
                      <p className="font-medium">{rank.winMultiplier || "1.0"}x</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">特权</p>
                      <div className="flex flex-wrap gap-1">
                        {rank.hasVipService && <Badge variant="secondary"><Headphones className="w-3 h-3 mr-1" />VIP客服</Badge>}
                        {rank.hasUnlimitedAI && <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />无限AI</Badge>}
                        {rank.hasPromoBonus && <Badge variant="secondary"><Gift className="w-3 h-3 mr-1" />推广加成</Badge>}
                        {rank.hasPriorityWelfare && <Badge variant="secondary"><Star className="w-3 h-3 mr-1" />优先福利</Badge>}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
