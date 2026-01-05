import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { FileText, Stethoscope, Gift, Crown, Users, CreditCard, Wallet, Scale, Star } from "lucide-react";

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  enabled: boolean;
  description: string | null;
}

const defaultFeatures = [
  { key: "medical_tools", name: "医疗工具", icon: Stethoscope, description: "AI医疗问诊、健康评估等工具" },
  { key: "lottery", name: "抽奖功能", icon: Gift, description: "每日签到抽奖转盘" },
  { key: "vip_system", name: "VIP会员", icon: Crown, description: "VIP会员购买和权益" },
  { key: "referral_system", name: "邀请返佣", icon: Users, description: "分销推广和佣金系统" },
  { key: "withdraw", name: "提现功能", icon: CreditCard, description: "用户余额提现" },
  { key: "wallet", name: "钱包充值", icon: Wallet, description: "用户钱包充值功能" },
  { key: "insurance", name: "保险产品", icon: Scale, description: "保险产品展示和购买" },
  { key: "fortune", name: "运势分析", icon: Star, description: "AI运势分析工具" },
];

export default function AdminContentPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});

  const { data: flags, isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ["/api/admin/features"],
    queryFn: async () => {
      const res = await fetch("/api/admin/features", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (flags) {
      const flagsMap: Record<string, boolean> = {};
      flags.forEach((f) => {
        flagsMap[f.key] = f.enabled;
      });
      setLocalFlags(flagsMap);
    }
  }, [flags]);

  const toggleMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key, enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      toast({ title: "设置已保存" });
    },
    onError: () => {
      toast({ title: "保存失败", variant: "destructive" });
    },
  });

  const handleToggle = (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setLocalFlags((prev) => ({ ...prev, [key]: newValue }));
    toggleMutation.mutate({ key, enabled: newValue });
  };

  const isEnabled = (key: string) => {
    return localFlags[key] ?? true;
  };

  return (
    <AdminLayout title="内容管理">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            功能开关
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <div className="space-y-6">
              {defaultFeatures.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">{feature.name}</Label>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled(feature.key)}
                    onCheckedChange={() => handleToggle(feature.key, isEnabled(feature.key))}
                    disabled={toggleMutation.isPending}
                    data-testid={`switch-feature-${feature.key}`}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
