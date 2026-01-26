import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Gift, Timer } from "lucide-react";
import AdminLayout from "./AdminLayout";

interface SystemSetting {
  key: string;
  value: string;
}

export default function AdminActivityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");

  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (settings) {
      const newValues: Record<string, string> = {};
      settings.forEach((s) => {
        newValues[s.key] = s.value;
      });
      setFormValues(newValues);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to save setting");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "保存成功", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => {
      toast({ title: "保存失败", variant: "destructive" });
    },
  });

  const handleSave = (key: string) => {
    if (saveMutation.isPending) return;
    saveMutation.mutate({ key, value: formValues[key] || "" });
  };

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout title="活动管理">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">活动管理</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
        {/* Unlock Random Reward Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              解冻随机奖励配置
            </CardTitle>
            <CardDescription>
              设置VIP资金解冻时（进度≥80%）触发随机现金红包的规则
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>获得概率 (0-100%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formValues["unlock_random_reward_prob"] || "5"}
                  onChange={(e) => handleChange("unlock_random_reward_prob", e.target.value)}
                  placeholder="默认: 5"
                />
                <Button onClick={() => handleSave("unlock_random_reward_prob")}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">输入数字，例如 30 代表 30% 概率</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>最小金额 (元)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formValues["unlock_random_reward_min"] || "2"}
                    onChange={(e) => handleChange("unlock_random_reward_min", e.target.value)}
                    placeholder="默认: 2"
                  />
                  <Button onClick={() => handleSave("unlock_random_reward_min")}>
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>最大金额 (元)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formValues["unlock_random_reward_max"] || "200"}
                    onChange={(e) => handleChange("unlock_random_reward_max", e.target.value)}
                    placeholder="默认: 200"
                  />
                  <Button onClick={() => handleSave("unlock_random_reward_max")}>
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deferred Satisfaction Reward Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-blue-500" />
              延时满足奖配置
            </CardTitle>
            <CardDescription>
              设置VIP升级时发放的固定“延时满足”奖励金额
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>奖励金额 (元)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formValues["deferred_reward_amount"] || ""}
                  onChange={(e) => handleChange("deferred_reward_amount", e.target.value)}
                  placeholder="默认: 等级 x 10"
                />
                <Button onClick={() => handleSave("deferred_reward_amount")}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                如果不设置，系统默认使用公式：升级前等级 × 10元
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  );
}