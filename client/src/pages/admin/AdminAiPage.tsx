import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/adminAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Save, MessageSquare, BarChart, Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminAiPage() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("logs");

  // 1. Stats
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/ai/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ai/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    enabled: !!token,
  });

  // 2. Logs
  const { data: messagesData } = useQuery({
    queryKey: ["/api/admin/ai/messages", search],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ai/messages?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!token,
  });

  // 3. Settings
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/ai/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ai/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    enabled: !!token,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/ai/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "设置已保存", description: "AI配置已更新" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/settings"] });
    },
  });

  const [sensitiveWords, setSensitiveWords] = useState("");
  const [presetReplies, setPresetReplies] = useState("");

  // Sync state when data loads
  if (settings && sensitiveWords === "" && presetReplies === "") {
    setSensitiveWords(settings.sensitiveWords || "");
    setPresetReplies(settings.presetReplies || "");
  }

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      sensitiveWords,
      presetReplies
    });
  };

  return (
    <AdminLayout title="AI问答管理">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总提问数</p>
                <h3 className="text-2xl font-bold">{stats?.totalQuestions || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <BarChart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">今日提问</p>
                <h3 className="text-2xl font-bold">{stats?.todayQuestions || 0}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 问答记录
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" /> 配置管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">用户提问记录</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索内容或手机号"
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户</TableHead>
                      <TableHead>提问内容</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messagesData?.messages?.map((msg: any) => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <div className="font-medium">{msg.userPhone || "未知用户"}</div>
                          <div className="text-xs text-gray-500">ID: {msg.userId}</div>
                        </TableCell>
                        <TableCell className="max-w-md truncate" title={msg.content}>
                          {msg.content}
                        </TableCell>
                        <TableCell>
                          {new Date(msg.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!messagesData?.messages || messagesData.messages.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          暂无记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">敏感词过滤 (用逗号分隔)</label>
                  <Textarea 
                    placeholder="例如: 赌博, 诈骗, 暴力..." 
                    rows={4}
                    value={sensitiveWords}
                    onChange={(e) => setSensitiveWords(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">包含这些词的用户提问将被拦截或标记。</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">预设回复短语 (每行一条)</label>
                  <Textarea 
                    placeholder="请输入预设回复..." 
                    rows={6}
                    value={presetReplies}
                    onChange={(e) => setPresetReplies(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">这些短语将显示在后台回复快捷栏中。</p>
                </div>

                <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? "保存中..." : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> 保存配置
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
