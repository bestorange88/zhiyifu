import { useState, useEffect, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Headphones, Send, User, ArrowLeft, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: number;
  userId: number;
  adminId: number | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
  userPhone?: string;
  messageCount?: number;
  lastMessage?: string;
}

interface ChatMessage {
  id: number;
  sessionId: number;
  senderType: string;
  senderId: number;
  content: string;
  createdAt: string;
}

export default function AdminServicePage() {
  const { token, admin } = useAdminAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/admin/service/sessions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/service/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 10000,
  });

  const { data: messages, refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/admin/service/sessions", selectedSession?.id, "messages"],
    queryFn: async () => {
      if (!selectedSession) return [];
      const res = await fetch(`/api/admin/service/sessions/${selectedSession.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedSession && !!token,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: number; content: string }) => {
      const res = await fetch(`/api/admin/service/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      refetchMessages();
      setInput("");
    },
    onError: () => {
      toast({ title: "发送失败", variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!input.trim() || !selectedSession) return;
    sendMessageMutation.mutate({ sessionId: selectedSession.id, content: input.trim() });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return <Badge className="bg-green-100 text-green-700">进行中</Badge>;
    }
    return <Badge variant="secondary">已关闭</Badge>;
  };

  if (selectedSession) {
    return (
      <AdminLayout title="客服中心">
        <Card className="h-[calc(100vh-180px)] flex flex-col">
          <CardHeader className="border-b flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{selectedSession.userPhone || `用户${selectedSession.userId}`}</CardTitle>
                  <p className="text-xs text-gray-500">会话ID: {selectedSession.id}</p>
                </div>
              </div>
              {getStatusBadge(selectedSession.status)}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {messages && messages.length > 0 ? (
                messages.map((msg) => {
                  const isAdmin = msg.senderType === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        isAdmin ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          isAdmin
                            ? "bg-purple-500"
                            : "bg-primary"
                        )}
                      >
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="max-w-[70%]">
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            isAdmin
                              ? "bg-purple-500 text-white rounded-tr-sm"
                              : "bg-gray-100 text-gray-800 rounded-tl-sm"
                          )}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 px-1">
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-10">
                  暂无消息
                </div>
              )}
            </div>
            <div className="border-t p-3 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="输入回复消息..."
                  data-testid="input-admin-reply"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessageMutation.isPending}
                  data-testid="button-admin-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="客服中心">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            客服会话列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : !sessions?.length ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无客服会话</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  data-testid={`session-${session.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{session.userPhone || `用户${session.userId}`}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(session.createdAt), "MM-dd HH:mm")}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                  {session.lastMessage && (
                    <p className="text-sm text-gray-600 truncate pl-13">{session.lastMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
