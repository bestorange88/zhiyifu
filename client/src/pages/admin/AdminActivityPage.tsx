import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Gift, Timer, Image, Upload, Trash2, Plus } from "lucide-react";
import AdminLayout from "./AdminLayout";

interface SystemSetting {
  key: string;
  value: string;
}

export default function AdminActivityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 获取轮播图配置
  const { data: carouselData, isLoading: carouselLoading } = useQuery<{ images: string[] }>({
    queryKey: ["/api/admin/carousel"],
    queryFn: async () => {
      const res = await fetch("/api/admin/carousel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch carousel");
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (carouselData?.images) {
      setCarouselImages(carouselData.images);
    }
  }, [carouselData]);

  // 上传轮播图
  const handleUploadCarousel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/admin/carousel/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("上传失败");
      const data = await res.json();
      
      // 添加到轮播图列表
      const newImages = [...carouselImages, data.url];
      await saveCarouselImages(newImages);
      toast({ title: "上传成功" });
    } catch (error) {
      toast({ title: "上传失败", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 保存轮播图配置
  const saveCarouselImages = async (images: string[]) => {
    try {
      const res = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ images }),
      });
      if (!res.ok) throw new Error("保存失败");
      setCarouselImages(images);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/carousel"] });
    } catch (error) {
      toast({ title: "保存失败", variant: "destructive" });
    }
  };

  // 删除轮播图
  const handleDeleteCarousel = async (index: number) => {
    const newImages = carouselImages.filter((_, i) => i !== index);
    await saveCarouselImages(newImages);
    toast({ title: "删除成功" });
  };

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

        {/* 轮播图管理 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-green-500" />
              首页轮播图管理
            </CardTitle>
            <CardDescription>
              管理首页顶部的轮播图，支持上传、删除和排序
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {carouselImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`轮播图 ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => handleDeleteCarousel(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}
              
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCarousel}
                  className="hidden"
                />
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">添加图片</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-gray-500">
              建议尺寸：750x400像素，支持 JPG、PNG 格式，单张图片不超过 2MB
            </p>
          </CardContent>
        </Card>

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
