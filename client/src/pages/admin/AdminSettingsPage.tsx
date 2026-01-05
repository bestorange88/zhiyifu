import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Image, Globe, Key } from "lucide-react";

interface SystemSetting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

const defaultSettings = [
  { key: "platform_name", label: "平台名称", icon: Globe, defaultValue: "云智医服" },
  { key: "platform_slogan", label: "平台标语", icon: Globe, defaultValue: "云端智能医疗服务" },
  { key: "logo_url", label: "Logo地址", icon: Image, defaultValue: "" },
  { key: "contact_phone", label: "客服电话", icon: Globe, defaultValue: "" },
  { key: "contact_wechat", label: "客服微信", icon: Globe, defaultValue: "" },
  { key: "invite_code", label: "默认邀请码", icon: Key, defaultValue: "911522" },
  { key: "api_base_url", label: "API基础地址", icon: Globe, defaultValue: "" },
];

export default function AdminSettingsPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "保存成功" });
    },
    onError: () => {
      toast({ title: "保存失败", variant: "destructive" });
    },
  });

  const getValue = (key: string) => {
    if (formValues[key] !== undefined) return formValues[key];
    const setting = settings?.find((s) => s.key === key);
    return setting?.value || "";
  };

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    saveMutation.mutate({ key, value: getValue(key) });
  };

  return (
    <AdminLayout title="系统设置">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              基础设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : (
              defaultSettings.map((item) => (
                <div key={item.key} className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-gray-500" />
                      {item.label}
                    </Label>
                    <Input
                      value={getValue(item.key)}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      placeholder={item.defaultValue || `请输入${item.label}`}
                      data-testid={`input-setting-${item.key}`}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(item.key)}
                    disabled={saveMutation.isPending}
                    data-testid={`button-save-${item.key}`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
