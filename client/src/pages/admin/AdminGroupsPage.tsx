import { useState, useRef, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, X, Check, UserPlus, MessageCircle, Send, ArrowLeft, Loader2, Gift, Image, Video, Clock, Power, PowerOff } from "lucide-react";
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
import { cn, maskPhoneNumber, formatDate, formatDateTime, formatDateTimeShort } from "@/lib/utils";

interface GroupMember {
  id: number;
  userId: number;
  role: string;
  phone: string | null;
  isMuted: boolean;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  announcement: string | null;
  openHours: string | null;
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
  messageType: string;
  content: string;
  mediaUrl: string | null;
  createdAt: string;
  phone: string | null;
}

interface ScheduledRedPacket {
  id: number;
  groupId: number;
  groupName: string | null;
  scheduledTime: string;
  packetCount: number;
  amountPerPacket: string;
  claimCountPerPacket: number;
  greeting: string | null;
  isEnabled: boolean;
  lastExecutedAt: string | null;
  createdAt: string;
}

export default function AdminGroupsPage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupAnnouncement, setGroupAnnouncement] = useState("");
  const [groupOpenHours, setGroupOpenHours] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [manageMembersDialog, setManageMembersDialog] = useState(false);
  const [currentGroupMembers, setCurrentGroupMembers] = useState<GroupMember[]>([]);
  const [chatGroup, setChatGroup] = useState<Group | null>(null);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // 新消息提示音
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  
  // 红包相关状态
  const [showRedPacketDialog, setShowRedPacketDialog] = useState(false);
  const [redPacketGroup, setRedPacketGroup] = useState<Group | null>(null);
  const [redPacketAmount, setRedPacketAmount] = useState("");
  const [redPacketCount, setRedPacketCount] = useState("");
  const [redPacketPacketCount, setRedPacketPacketCount] = useState("1");
  const [redPacketGreeting, setRedPacketGreeting] = useState("恭喜发财，大吉大利");
  
  // 定时红包相关状态
  const [showScheduledDialog, setShowScheduledDialog] = useState(false);
  const [scheduledGroup, setScheduledGroup] = useState<Group | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledPacketCount, setScheduledPacketCount] = useState("1");
  const [scheduledAmountPerPacket, setScheduledAmountPerPacket] = useState("");
  const [scheduledClaimCount, setScheduledClaimCount] = useState("");
  const [scheduledGreeting, setScheduledGreeting] = useState("恭喜发财，大吉大利");
  const [editingSchedule, setEditingSchedule] = useState<ScheduledRedPacket | null>(null);

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
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; announcement: string; openHours: string; memberIds: number[] } }) => {
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

  const updateMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId, data }: { groupId: number; userId: number; data: any }) => {
      const res = await fetch(`/api/admin/groups/${groupId}/members/${userId}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      toast({ title: "成员状态已更新" });
      // 更新本地状态以即时反映变化
      setCurrentGroupMembers(prev => prev.map(m => {
        // @ts-ignore
        if (m.userId === updateMemberMutation.variables?.userId) {
          // @ts-ignore
          return { ...m, ...updateMemberMutation.variables?.data };
        }
        return m;
      }));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      const res = await fetch(`/api/admin/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to remove member");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      toast({ title: "成员已移除" });
      setCurrentGroupMembers(prev => prev.filter(m => m.userId !== variables.userId));
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

  // 初始化提示音
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // 新消息提示音 - 当有新的用户消息时播放
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0 && chatGroup) {
      const userMessages = chatMessages.filter(m => m.senderType === "user").length;
      if (lastMessageCountRef.current > 0 && userMessages > lastMessageCountRef.current) {
        audioRef.current?.play().catch(() => {});
      }
      lastMessageCountRef.current = userMessages;
    }
  }, [chatMessages, chatGroup]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; messageType?: string; mediaUrl?: string }) => {
      const res = await fetch(`/api/admin/groups/${chatGroup!.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
    sendMessageMutation.mutate({ content: chatInput.trim() });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      toast({ title: "只支持图片和视频文件", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "文件大小不能超过50MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (!res.ok) throw new Error("上传失败");
      
      const { url } = await res.json();
      const messageType = isImage ? "image" : "video";
      const content = isImage ? "[图片]" : "[视频]";
      
      sendMessageMutation.mutate({ content, messageType, mediaUrl: url });
    } catch (error) {
      toast({ title: "上传失败", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 发送红包
  const sendRedPacketMutation = useMutation({
    mutationFn: async (data: { groupId: number; totalAmount: number; totalCount: number; packetCount: number; greeting: string }) => {
      const res = await fetch(`/api/admin/groups/${data.groupId}/red-packets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "发送失败");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `红包发送成功${data.count ? `，共${data.count}个红包` : ""}` });
      resetRedPacketForm();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const resetRedPacketForm = () => {
    setShowRedPacketDialog(false);
    setRedPacketGroup(null);
    setRedPacketAmount("");
    setRedPacketCount("");
    setRedPacketPacketCount("1");
    setRedPacketGreeting("恭喜发财，大吉大利");
  };

  const openRedPacketDialog = (group: Group) => {
    setRedPacketGroup(group);
    setShowRedPacketDialog(true);
  };

  const handleSendRedPacket = () => {
    if (!redPacketGroup || !redPacketAmount || !redPacketCount) return;
    sendRedPacketMutation.mutate({
      groupId: redPacketGroup.id,
      totalAmount: parseFloat(redPacketAmount),
      totalCount: parseInt(redPacketCount),
      packetCount: parseInt(redPacketPacketCount) || 1,
      greeting: redPacketGreeting,
    });
  };

  // 定时红包查询
  const { data: scheduledRedPackets, refetch: refetchScheduled } = useQuery<ScheduledRedPacket[]>({
    queryKey: ["/api/admin/scheduled-red-packets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/scheduled-red-packets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load scheduled red packets");
      return res.json();
    },
    enabled: !!token,
  });

  // 创建定时红包
  const createScheduledMutation = useMutation({
    mutationFn: async (data: { groupId: number; scheduledTime: string; packetCount: number; amountPerPacket: number; claimCountPerPacket: number; greeting: string }) => {
      const res = await fetch(`/api/admin/groups/${data.groupId}/scheduled-red-packets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "创建失败");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "定时红包创建成功" });
      resetScheduledForm();
      refetchScheduled();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // 更新定时红包
  const updateScheduledMutation = useMutation({
    mutationFn: async (data: { id: number; scheduledTime?: string; packetCount?: number; amountPerPacket?: number; claimCountPerPacket?: number; greeting?: string; isEnabled?: boolean }) => {
      const res = await fetch(`/api/admin/scheduled-red-packets/${data.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "更新失败");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "定时红包更新成功" });
      resetScheduledForm();
      refetchScheduled();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // 删除定时红包
  const deleteScheduledMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/scheduled-red-packets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("删除失败");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "定时红包已删除" });
      refetchScheduled();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // 切换定时红包启用状态
  const toggleScheduledMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      const res = await fetch(`/api/admin/scheduled-red-packets/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isEnabled }),
      });
      if (!res.ok) throw new Error("更新失败");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: variables.isEnabled ? "定时红包已启用" : "定时红包已停用" });
      refetchScheduled();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const resetScheduledForm = () => {
    setShowScheduledDialog(false);
    setScheduledGroup(null);
    setScheduledTime("");
    setScheduledPacketCount("1");
    setScheduledAmountPerPacket("");
    setScheduledClaimCount("");
    setScheduledGreeting("恭喜发财，大吉大利");
    setEditingSchedule(null);
  };

  const openScheduledDialog = (group: Group) => {
    setScheduledGroup(group);
    setShowScheduledDialog(true);
  };

  const openEditScheduledDialog = (schedule: ScheduledRedPacket, group: Group) => {
    setEditingSchedule(schedule);
    setScheduledGroup(group);
    setScheduledTime(schedule.scheduledTime);
    setScheduledPacketCount(String(schedule.packetCount));
    setScheduledAmountPerPacket(schedule.amountPerPacket);
    setScheduledClaimCount(String(schedule.claimCountPerPacket));
    setScheduledGreeting(schedule.greeting || "恭喜发财，大吉大利");
    setShowScheduledDialog(true);
  };

  const handleSaveScheduled = () => {
    if (!scheduledGroup || !scheduledTime || !scheduledAmountPerPacket || !scheduledClaimCount) return;
    
    if (editingSchedule) {
      updateScheduledMutation.mutate({
        id: editingSchedule.id,
        scheduledTime,
        packetCount: parseInt(scheduledPacketCount) || 1,
        amountPerPacket: parseFloat(scheduledAmountPerPacket),
        claimCountPerPacket: parseInt(scheduledClaimCount),
        greeting: scheduledGreeting,
      });
    } else {
      createScheduledMutation.mutate({
        groupId: scheduledGroup.id,
        scheduledTime,
        packetCount: parseInt(scheduledPacketCount) || 1,
        amountPerPacket: parseFloat(scheduledAmountPerPacket),
        claimCountPerPacket: parseInt(scheduledClaimCount),
        greeting: scheduledGreeting,
      });
    }
  };

  const handleManageMembers = (group: Group) => {
    setEditingGroup(group);
    setCurrentGroupMembers(group.members);
    setManageMembersDialog(true);
  };

  const resetForm = () => {
    setShowCreateDialog(false);
    setEditingGroup(null);
    setGroupName("");
    setGroupDescription("");
    setGroupAnnouncement("");
    setGroupOpenHours("");
    setSelectedMembers([]);
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setGroupAnnouncement(group.announcement || "");
    setGroupOpenHours(group.openHours || "");
    setSelectedMembers(group.members.map(m => m.userId));
  };

  const handleSubmit = () => {
    if (editingGroup) {
      updateMutation.mutate({ 
        id: editingGroup.id, 
        data: {
          name: groupName,
          description: groupDescription,
          announcement: groupAnnouncement,
          openHours: groupOpenHours,
          memberIds: selectedMembers,
        }
      });
    } else {
      createMutation.mutate({
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers,
      });
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
                      {formatDate(group.createdAt)}
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
                          onClick={() => openRedPacketDialog(group)}
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
                          data-testid={`button-red-packet-group-${group.id}`}
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          发红包
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openScheduledDialog(group)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/30"
                          data-testid={`button-scheduled-red-packet-group-${group.id}`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          定时红包
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                群公告
              </label>
              <Textarea
                value={groupAnnouncement}
                onChange={(e) => setGroupAnnouncement(e.target.value)}
                placeholder="输入群公告（可选）"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                开放时间段 (例如: 09:00-22:00)
              </label>
              <Input
                value={groupOpenHours}
                onChange={(e) => setGroupOpenHours(e.target.value)}
                placeholder="输入开放时间段"
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
                        {maskPhoneNumber(user.phone) || `用户 ${user.id}`}
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
                const displayName = isAdmin ? (msg.senderName || "管理员") : (maskPhoneNumber(msg.phone) || `用户 ${msg.userId}`);
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
                          {formatDateTimeShort(msg.createdAt)}
                        </span>
                      </div>
                      <div className={cn(
                        "rounded-lg px-3 py-2 shadow-sm",
                        isAdmin 
                          ? "bg-gradient-to-br from-orange-400 to-red-500 text-white ml-auto max-w-[80%]" 
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 max-w-[80%]"
                      )}>
                        {msg.messageType === "image" && msg.mediaUrl ? (
                          <img 
                            src={msg.mediaUrl} 
                            alt="图片" 
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                            onClick={() => window.open(msg.mediaUrl!, "_blank")}
                          />
                        ) : msg.messageType === "video" && msg.mediaUrl ? (
                          <video 
                            src={msg.mediaUrl} 
                            controls 
                            className="max-w-full rounded-lg"
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-line">
                            {msg.content}
                          </p>
                        )}
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => chatGroup && handleManageMembers(chatGroup)}
                title="管理成员"
              >
                <Users className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || sendMessageMutation.isPending}
                title="发送图片或视频"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </Button>
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
                disabled={!chatInput.trim() || sendMessageMutation.isPending || isUploading}
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

      <Dialog open={manageMembersDialog} onOpenChange={setManageMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>管理群成员 - {editingGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">用户ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">手机号</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentGroupMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2 text-sm">{member.userId}</td>
                    <td className="px-4 py-2 text-sm">{member.phone}</td>
                    <td className="px-4 py-2 text-sm">
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberMutation.mutate({
                          groupId: editingGroup!.id,
                          userId: member.userId,
                          data: { role: e.target.value }
                        })}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="member">成员</option>
                        <option value="admin">管理员</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${member.isMuted ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                        {member.isMuted ? "已禁言" : "正常"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMemberMutation.mutate({
                            groupId: editingGroup!.id,
                            userId: member.userId,
                            data: { isMuted: !member.isMuted }
                          })}
                        >
                          {member.isMuted ? "解禁" : "禁言"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("确定要踢出该成员吗？")) {
                              removeMemberMutation.mutate({
                                groupId: editingGroup!.id,
                                userId: member.userId
                              });
                            }
                          }}
                        >
                          踢出
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 红包发送弹窗 */}
      <Dialog open={showRedPacketDialog} onOpenChange={() => resetRedPacketForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-red-500" />
              发送红包到 {redPacketGroup?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                单个红包金额 (元)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={redPacketAmount}
                onChange={(e) => setRedPacketAmount(e.target.value)}
                placeholder="输入红包总金额"
                data-testid="input-red-packet-amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                单个红包份数
              </label>
              <Input
                type="number"
                min="1"
                value={redPacketCount}
                onChange={(e) => setRedPacketCount(e.target.value)}
                placeholder="输入红包份数"
                data-testid="input-red-packet-count"
              />
              <p className="text-xs text-gray-500 mt-1">
                每个红包将被随机分成这么多份
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                发送红包个数
              </label>
              <Input
                type="number"
                min="1"
                value={redPacketPacketCount}
                onChange={(e) => setRedPacketPacketCount(e.target.value)}
                placeholder="一次发送多少个红包"
                data-testid="input-red-packet-packet-count"
              />
              <p className="text-xs text-gray-500 mt-1">
                可以一次性发送多个相同配置的红包
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                红包祝福语
              </label>
              <Input
                value={redPacketGreeting}
                onChange={(e) => setRedPacketGreeting(e.target.value)}
                placeholder="输入祝福语"
                data-testid="input-red-packet-greeting"
              />
            </div>

            {redPacketAmount && redPacketCount && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm">
                <p className="text-red-700 dark:text-red-300">
                  将发送 <strong>{redPacketPacketCount || 1}</strong> 个红包，
                  每个红包 <strong>¥{parseFloat(redPacketAmount).toFixed(2)}</strong>，
                  分成 <strong>{redPacketCount}</strong> 份
                </p>
                <p className="text-red-600 dark:text-red-400 mt-1">
                  总计: ¥{(parseFloat(redPacketAmount) * (parseInt(redPacketPacketCount) || 1)).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetRedPacketForm}>
                取消
              </Button>
              <Button
                onClick={handleSendRedPacket}
                disabled={!redPacketAmount || !redPacketCount || sendRedPacketMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white"
                data-testid="button-send-red-packet"
              >
                {sendRedPacketMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    发送红包
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 定时红包创建/编辑对话框 */}
      <Dialog open={showScheduledDialog} onOpenChange={() => resetScheduledForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              {editingSchedule ? "编辑定时红包" : "创建定时红包"} - {scheduledGroup?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                发送时间 (北京时间)
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                data-testid="input-scheduled-time"
              />
              <p className="text-xs text-gray-500 mt-1">
                每天在指定时间自动发送红包
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                发送红包个数
              </label>
              <Input
                type="number"
                min="1"
                value={scheduledPacketCount}
                onChange={(e) => setScheduledPacketCount(e.target.value)}
                placeholder="每次发送几个红包"
                data-testid="input-scheduled-packet-count"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                每个红包金额 (元)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={scheduledAmountPerPacket}
                onChange={(e) => setScheduledAmountPerPacket(e.target.value)}
                placeholder="每个红包的金额"
                data-testid="input-scheduled-amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                每个红包可领取人数
              </label>
              <Input
                type="number"
                min="1"
                value={scheduledClaimCount}
                onChange={(e) => setScheduledClaimCount(e.target.value)}
                placeholder="每个红包可以被多少人领取"
                data-testid="input-scheduled-claim-count"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                红包祝福语
              </label>
              <Input
                value={scheduledGreeting}
                onChange={(e) => setScheduledGreeting(e.target.value)}
                placeholder="输入祝福语"
                data-testid="input-scheduled-greeting"
              />
            </div>

            {scheduledTime && scheduledAmountPerPacket && scheduledClaimCount && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-sm">
                <p className="text-orange-700 dark:text-orange-300">
                  每天 <strong>{scheduledTime}</strong> 自动发送 <strong>{scheduledPacketCount || 1}</strong> 个红包
                </p>
                <p className="text-orange-600 dark:text-orange-400 mt-1">
                  每个红包 <strong>¥{parseFloat(scheduledAmountPerPacket || "0").toFixed(2)}</strong>，
                  可被 <strong>{scheduledClaimCount}</strong> 人领取
                </p>
                <p className="text-orange-600 dark:text-orange-400 mt-1">
                  每日总计: ¥{(parseFloat(scheduledAmountPerPacket || "0") * (parseInt(scheduledPacketCount) || 1)).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetScheduledForm}>
                取消
              </Button>
              <Button
                onClick={handleSaveScheduled}
                disabled={!scheduledTime || !scheduledAmountPerPacket || !scheduledClaimCount || createScheduledMutation.isPending || updateScheduledMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-save-scheduled"
              >
                {(createScheduledMutation.isPending || updateScheduledMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    {editingSchedule ? "保存修改" : "创建定时红包"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 定时红包列表 */}
      {scheduledRedPackets && scheduledRedPackets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mt-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              定时红包列表
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">群组</th>
                  <th className="px-4 py-3 text-left">发送时间</th>
                  <th className="px-4 py-3 text-left">红包配置</th>
                  <th className="px-4 py-3 text-left">状态</th>
                  <th className="px-4 py-3 text-left">上次执行</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {scheduledRedPackets.map((schedule) => {
                  const group = groups?.find(g => g.id === schedule.groupId);
                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {schedule.groupName || `群组 ${schedule.groupId}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <span className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                          <Clock className="w-3 h-3 mr-1" />
                          {schedule.scheduledTime}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {schedule.packetCount}个红包 × ¥{parseFloat(schedule.amountPerPacket).toFixed(2)} × {schedule.claimCountPerPacket}人
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          schedule.isEnabled
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}>
                          {schedule.isEnabled ? "已启用" : "已停用"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {schedule.lastExecutedAt ? formatDateTime(schedule.lastExecutedAt) : "从未执行"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleScheduledMutation.mutate({ id: schedule.id, isEnabled: !schedule.isEnabled })}
                            className={schedule.isEnabled 
                              ? "text-gray-600 border-gray-200 hover:bg-gray-50" 
                              : "text-green-600 border-green-200 hover:bg-green-50"}
                          >
                            {schedule.isEnabled ? <PowerOff className="w-3 h-3 mr-1" /> : <Power className="w-3 h-3 mr-1" />}
                            {schedule.isEnabled ? "停用" : "启用"}
                          </Button>
                          {group && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditScheduledDialog(schedule, group)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              编辑
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("确定要删除该定时红包吗？")) {
                                deleteScheduledMutation.mutate(schedule.id);
                              }
                            }}
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
