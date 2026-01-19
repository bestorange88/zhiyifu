import { useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Image, Globe, Key, Upload, X, CreditCard, Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SystemSetting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

interface PaymentQrCode {
  id: number;
  name: string | null;
  type: string;
  url: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const defaultSettings = [
  { key: "platform_name", label: "平台名称", icon: Globe, defaultValue: "云智医服" },
  { key: "platform_slogan", label: "平台标语", icon: Globe, defaultValue: "云端智能医疗服务" },
  { key: "contact_phone", label: "客服电话", icon: Globe, defaultValue: "" },
  { key: "contact_wechat", label: "客服微信", icon: Globe, defaultValue: "" },
  { key: "invite_code", label: "默认邀请码", icon: Key, defaultValue: "911522" },
  { key: "api_base_url", label: "API基础地址", icon: Globe, defaultValue: "" },
];

export default function AdminSettingsPage() {
    const { token } = useAdminAuth();
    const { toast } = useToast();
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingQr, setUploadingQr] = useState(false);
    const [newQrType, setNewQrType] = useState<string>("alipay");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrFileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const logoSetting = data.find((s: SystemSetting) => s.key === "logo_url");
      if (logoSetting?.value) {
        setLogoPreview(logoSetting.value);
      }
      return data;
    },
    enabled: !!token,
  });

  const { data: qrCodes = [], isLoading: loadingQr } = useQuery<PaymentQrCode[]>({
    queryKey: ["/api/admin/payment-qr"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payment-qr", {
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

    const addQrMutation = useMutation({
      mutationFn: async (data: { url: string; name?: string; type?: string }) => {
        const res = await fetch("/api/admin/payment-qr", {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to add QR code");
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-qr"] });
        toast({ title: "添加成功" });
      },
      onError: () => {
        toast({ title: "添加失败", variant: "destructive" });
      },
    });

    const updateQrMutation = useMutation({
      mutationFn: async ({ id, ...data }: { id: number; isActive?: boolean; name?: string; type?: string }) => {
        const res = await fetch(`/api/admin/payment-qr/${id}`, {
          method: "PUT",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update QR code");
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-qr"] });
        toast({ title: "更新成功" });
      },
      onError: () => {
        toast({ title: "更新失败", variant: "destructive" });
      },
    });

  const deleteQrMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/payment-qr/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete QR code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-qr"] });
      toast({ title: "删除成功" });
    },
    onError: () => {
      toast({ title: "删除失败", variant: "destructive" });
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "图片大小不能超过2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      setLogoPreview(url);
      saveMutation.mutate({ key: "logo_url", value: url });
    } catch (error) {
      toast({ title: "上传失败", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    saveMutation.mutate({ key: "logo_url", value: "" });
  };

    const handleQrFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({ title: "请选择图片文件", variant: "destructive" });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "图片大小不能超过2MB", variant: "destructive" });
        return;
      }

      setUploadingQr(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const { url } = await res.json();
        addQrMutation.mutate({ url, type: newQrType });
      } catch (error) {
        toast({ title: "上传失败", variant: "destructive" });
      } finally {
        setUploadingQr(false);
        if (qrFileInputRef.current) {
          qrFileInputRef.current.value = "";
        }
      }
    };

    const handleUpdateQrType = (id: number, type: string) => {
      updateQrMutation.mutate({ id, type });
    };

  const handleDeleteQr = (id: number) => {
    if (confirm("确定要删除这个收款码吗？")) {
      deleteQrMutation.mutate(id);
    }
  };

  const handleToggleQrActive = (id: number, isActive: boolean) => {
    updateQrMutation.mutate({ id, isActive });
  };

  return (
    <AdminLayout title="系统设置">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Logo设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      data-testid="button-remove-logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400">
                    <Image className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">暂无Logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">支持 JPG、PNG 格式，文件大小不超过 2MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-logo-file"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    data-testid="button-upload-logo"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "上传中..." : "选择图片"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>或输入Logo地址</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formValues["logo_url"] || logoPreview || ""}
                      onChange={(e) => {
                        handleChange("logo_url", e.target.value);
                        setLogoPreview(e.target.value);
                      }}
                      placeholder="https://example.com/logo.png"
                      data-testid="input-logo-url"
                    />
                    <Button
                      onClick={() => handleSave("logo_url")}
                      disabled={saveMutation.isPending}
                      data-testid="button-save-logo-url"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                收款二维码设置
              </div>
              <span className="text-sm font-normal text-gray-500">
                可上传多个二维码，前端将随机显示
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                            <div className="flex items-center gap-4 flex-wrap">
                              <input
                                ref={qrFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleQrFileSelect}
                                className="hidden"
                                data-testid="input-qr-file"
                              />
                              <Select value={newQrType} onValueChange={setNewQrType}>
                                <SelectTrigger className="w-32" data-testid="select-qr-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="alipay">支付宝</SelectItem>
                                  <SelectItem value="wechat">微信</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={() => qrFileInputRef.current?.click()}
                                disabled={uploadingQr || addQrMutation.isPending}
                                data-testid="button-upload-qr"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                {uploadingQr ? "上传中..." : "添加收款码"}
                              </Button>
                              <p className="text-sm text-gray-500">
                                支持 JPG、PNG 格式，建议尺寸 300x300 像素
                              </p>
                            </div>

              {loadingQr ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : qrCodes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无收款码，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {qrCodes.map((qr) => (
                    <div
                      key={qr.id}
                      className={`relative border rounded-lg p-2 ${
                        qr.isActive ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                      data-testid={`qr-card-${qr.id}`}
                    >
                                            <div className="aspect-square overflow-hidden rounded-md bg-white mb-2">
                                              <img
                                                src={qr.url}
                                                alt={qr.name || "收款码"}
                                                className="w-full h-full object-contain"
                                              />
                                            </div>
                                            <div className="text-center text-sm text-gray-600 truncate mb-1">
                                              {qr.name || `收款码${qr.id}`}
                                            </div>
                                            <div className="mb-2">
                                              <Select 
                                                value={qr.type || "alipay"} 
                                                onValueChange={(value) => handleUpdateQrType(qr.id, value)}
                                              >
                                                <SelectTrigger className="h-7 text-xs" data-testid={`select-qr-type-${qr.id}`}>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="alipay">支付宝</SelectItem>
                                                  <SelectItem value="wechat">微信</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-1">
                                                <Switch
                                                  checked={qr.isActive}
                                                  onCheckedChange={(checked) => handleToggleQrActive(qr.id, checked)}
                                                  data-testid={`switch-qr-active-${qr.id}`}
                                                />
                                                <span className="text-xs text-gray-500">
                                                  {qr.isActive ? "启用" : "禁用"}
                                                </span>
                                              </div>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDeleteQr(qr.id)}
                                                data-testid={`button-delete-qr-${qr.id}`}
                                              >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                              </Button>
                                            </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
