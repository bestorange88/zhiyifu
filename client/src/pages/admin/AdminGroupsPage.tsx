import { useState, useRef, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, X, Check, UserPlus, MessageCircle, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GroupMember {
  id: number;
  userId: number;
  role: string;
  phone: string | null;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  members: GroupMember[];
}

interface UserForGroup {
  id: number;
  phone: string | null;
  status: string;
}

interface GroupMessage {
  id: number;
  groupId: number;
  userId: number | null;
  senderType: string;
  senderName: string | null;
  content: string;
  createdAt: string;
  phone: string | null;
}

export default function AdminGroupsPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [chatGroup, setChatGroup] = useState<Group | null>(null);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/admin/groups"],
    queryFn: async () => {
      const res = await fetch("/api/admin/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load groups");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: allUsers } = useQuery<UserForGroup[]>({
    queryKey: ["/api/admin/users-for-group"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users-for-group", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
    enabled: !!token && (showCreateDialog || !!editingGroup),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; memberIds: number[] }) => {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      toast({ title: "群组创建成功" });
      resetForm();
    },
    onError: () => {
      toast({ title: "创建失败", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; memberIds: number[] } }) => {
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      toast({ title: "群组更新成功" });
      resetForm();
    },
    onError: () => {
      toast({ title: "更新失败", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      toast({ title: "群组已删除" });
    },
    onError: () => {
      toast({ title: "删除失败", variant: "destructive" });
    },
  });

  const { data: chatMessages, refetch: refetchMessages } = useQuery<GroupMessage[]>({
    queryKey: ["/api/admin/groups", chatGroup?.id, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/groups/${chatGroup!.id}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && !!chatGroup,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/admin/groups/${chatGroup!.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      refetchMessages();
      setChatInput("");
    },
    onError: () => {
      toast({ title: "发送失败", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (chatScrollRef.current && chatMessages) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(chatInput.trim());
  };

  const resetForm = () => {
    setShowCreateDialog(false);
    setEditingGroup(null);
    setGroupName("");
    setGroupDescription("");
    setSelectedMembers([]);
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setSelectedMembers(group.members.map(m => m.userId));
  };

  const handleSubmit = () => {
    const data = {
      name: groupName,
      description: groupDescription,
      memberIds: selectedMembers,
    };
    
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <AdminLayout title="群组管理">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">共 {groups?.length || 0} 个群组</span>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-group">
            <Plus className="w-4 h-4 mr-2" />
            创建群组
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">群组名称</th>
                <th className="px-4 py-3 text-left">描述</th>
                <th className="px-4 py-3 text-left">成员数</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">创建时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : groups && groups.length > 0 ? (
                groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50" data-testid={`row-group-${group.id}`}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{group.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{group.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {group.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        <Users className="w-3 h-3 mr-1" />
                        {group.members.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.isActive
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                        {group.isActive ? "启用" : "停用"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(group.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setChatGroup(group)}
                          data-testid={`button-chat-group-${group.id}`}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          对话
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(group)}
                          data-testid={`button-edit-group-${group.id}`}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("确定要删除该群组吗？")) {
                              deleteMutation.mutate(group.id);
                            }
                          }}
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
                          data-testid={`button-delete-group-${group.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    暂无群组，点击上方按钮创建
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showCreateDialog || !!editingGroup} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "编辑群组" : "创建群组"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                群组名称
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="输入群组名称"
                data-testid="input-group-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                群组描述
              </label>
              <Textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="输入群组描述（可选）"
                rows={2}
                data-testid="input-group-description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <UserPlus className="w-4 h-4 inline mr-1" />
                选择成员 ({selectedMembers.length} 已选)
              </label>
              <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1 bg-gray-50 dark:bg-gray-900">
                {allUsers && allUsers.length > 0 ? (
                  allUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                        data-testid={`checkbox-user-${user.id}`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {user.phone || `用户 ${user.id}`}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">加载中...</div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!groupName.trim() || createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-group"
              >
                {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!chatGroup} onOpenChange={() => setChatGroup(null)}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setChatGroup(null)}
              data-testid="button-close-chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">
                {chatGroup?.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {chatGroup?.members.length || 0} 成员
              </p>
            </div>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
          >
            {(!chatMessages || chatMessages.length === 0) ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                暂无消息，开始对话吧
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isAdmin = msg.senderType === "admin";
                const displayName = isAdmin ? (msg.senderName || "管理员") : (msg.phone || `用户 ${msg.userId}`);
                return (
                  <div key={msg.id} className={cn("flex gap-2", isAdmin && "flex-row-reverse")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isAdmin 
                        ? "bg-gradient-to-br from-orange-400 to-red-500" 
                        : "bg-gradient-to-br from-primary to-cyan-500"
                    )}>
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className={cn("flex items-center gap-2 mb-1", isAdmin && "justify-end")}>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {displayName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(msg.createdAt), "MM-dd HH:mm")}
                        </span>
                      </div>
                      <div className={cn(
                        "rounded-lg px-3 py-2 shadow-sm",
                        isAdmin 
                          ? "bg-gradient-to-br from-orange-400 to-red-500 text-white ml-auto max-w-[80%]" 
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 max-w-[80%]"
                      )}>
                        <p className="text-sm whitespace-pre-line">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {sendMessageMutation.isPending && (
              <div className="flex gap-2 justify-end">
                <div className="bg-primary/10 text-primary rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">发送中...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="输入消息..."
                className="flex-1"
                data-testid="input-admin-group-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || sendMessageMutation.isPending}
                data-testid="button-send-admin-group-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
