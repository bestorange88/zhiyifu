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
import { Headphones, Send, User, MessageCircle, Zap, Search, Clock } from "lucide-react";
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

const quickReplies = [
  { category: "问候语", title: "欢迎语", content: "您好，欢迎来到智医服！我是您的专属客服，请问有什么可以帮助您的吗？" },
  { category: "问候语", title: "结束语", content: "感谢您的咨询！如有其他问题，请随时与我们联系。祝您交易顺利！" },
  { category: "问候语", title: "稍等提示", content: "请您稍等，我正在为您查询相关资讯..." },
  { category: "其他", title: "无法解决", content: "非常抱歉，您的问题可能需要进一步修复处理。我已经记录您的问题，会转换专业团队处理，近期请留意您的消息通知。" },
  { category: "充值", title: "充值方式", content: "目前平台支援以下储值方式：\n1. USDT (TRC20/ERC20/BEP20网络)\n2. 比特币\n请在【资产】-【充值】页面获取最新充值地址。" },
  { category: "充值", title: "充值确认时间", content: "储值到账时间取决于区块链网络确认：\n- USDT-TRC20: 约1-5分钟\n- USDT-ERC20: 约5-15分钟\n请您耐心等待。" },
  { category: "充值", title: "充错地址/网络", content: "如果您储值时选错了网络或地址，请立即联络我们并提供交易详情（哈希值）。部分情况下资产可能无法找回，请务必仔细核对。" },
  { category: "提现", title: "提现流程", content: "提现流程如下：\n1. 进入【资产】-【提现】\n2. 选择提现币种和网络路径\n3. 输入目标地址和金额\n4. 验证安全密码后提交。" },
  { category: "提现", title: "提现手续费", content: "提现手续费取决于当前区块链网络拥堵情况，具体金额会在提现页面实时显示。" },
  { category: "KYC", title: "KYC认证", content: "为了保障您的账户安全，我们需要您完成KYC身份认证。请在【个人中心】-【身份认证】上传您的证件照片。" },
  { category: "KYC", title: "审核时间", content: "KYC审核通常在提交后24小时内完成。如遇高峰期可能会稍有延迟，请您谅解。" },
  { category: "安全", title: "修改密码", content: "您可以在【个人中心】-【安全设置】中修改您的登录密码或资金密码。" },
  { category: "安全", title: "防诈骗提醒", content: "平台工作人员不会以任何理由要求您提供私钥或转账到个人账户，请警惕诈骗风险。" },
];

export default function AdminServicePage() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const lastSessionCountRef = useRef<number>(0);
  
  // Quick Reply States
  const [quickReplySearch, setQuickReplySearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  // Initialize notification audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

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

    // Play notification sound when new session arrives
    useEffect(() => {
      if (sessions && sessions.length > 0) {
        const openSessions = sessions.filter(s => s.status === "open").length;
        if (lastSessionCountRef.current > 0 && openSessions > lastSessionCountRef.current) {
          audioRef.current?.play().catch(() => {});
          toast({ title: "新会话", description: "有新的客服会话请求" });
        }
        lastSessionCountRef.current = openSessions;
      }
    }, [sessions, toast]);

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

    // Play notification sound when new user message arrives
    useEffect(() => {
      if (messages && messages.length > 0) {
        const userMessages = messages.filter(m => m.senderType === "user").length;
        if (lastMessageCountRef.current > 0 && userMessages > lastMessageCountRef.current) {
          audioRef.current?.play().catch(() => {});
        }
        lastMessageCountRef.current = userMessages;
      }
    }, [messages]);

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

  const handleQuickReply = (text: string) => {
    setInput(prev => prev ? prev + "\n" + text : text);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">进行中</Badge>;
    }
    return <Badge variant="secondary">已关闭</Badge>;
  };

  const categories = ["全部", ...Array.from(new Set(quickReplies.map(r => r.category)))];
  const filteredReplies = quickReplies.filter(r => {
    const matchesCategory = activeCategory === "全部" || r.category === activeCategory;
    const matchesSearch = r.title.toLowerCase().includes(quickReplySearch.toLowerCase()) || 
                          r.content.toLowerCase().includes(quickReplySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AdminLayout title="客服中心">
      <div className="flex h-[calc(100vh-120px)] gap-4">
        {/* Left Column: Session List (20%) */}
        <Card className="w-1/5 flex flex-col border-none shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              会话列表 ({sessions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {sessionsLoading ? (
              <div className="text-center py-8 text-gray-500 text-xs">加载中...</div>
            ) : !sessions?.length ? (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                <MessageCircle className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-xs">暂无会话</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={cn(
                      "p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      selectedSession?.id === session.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-primary" : "border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate max-w-[100px]">
                        {session.userPhone || `用户${session.userId}`}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(session.createdAt), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate max-w-[120px]">
                        {session.lastMessage || "暂无消息"}
                      </p>
                      {session.status === "open" && (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Middle Column: Chat (60%) */}
        <Card className="w-3/5 flex flex-col border-none shadow-sm bg-white dark:bg-gray-800">
          {selectedSession ? (
            <>
              <CardHeader className="py-3 px-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {selectedSession.userPhone || `用户${selectedSession.userId}`}
                      </CardTitle>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ID: {selectedSession.id}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(selectedSession.status)}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50" ref={scrollRef}>
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
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                              isAdmin
                                ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                                : "bg-white border border-gray-200 text-gray-600"
                            )}
                          >
                            <User className={cn("w-4 h-4", isAdmin ? "text-white" : "text-gray-500")} />
                          </div>
                          <div className="max-w-[70%]">
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 shadow-sm text-sm",
                                isAdmin
                                  ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tr-sm"
                                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                              )}
                            >
                              <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                            </div>
                            <p className={cn(
                              "text-[10px] mt-1 px-1 opacity-70",
                              isAdmin ? "text-right" : "text-left"
                            )}>
                              {format(new Date(msg.createdAt), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                      <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-sm">暂无消息记录</p>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="输入回复消息..."
                      className="flex-1"
                      data-testid="input-admin-reply"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || sendMessageMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-admin-send"
                    >
                      {sendMessageMutation.isPending ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/30 dark:bg-gray-900/30">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium">请从左侧选择一个会话</p>
              <p className="text-xs mt-1 text-gray-400">开始与用户的即时沟通</p>
            </div>
          )}
        </Card>

        {/* Right Column: Quick Replies (20%) */}
        <Card className="w-1/5 flex flex-col border-none shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <CardTitle className="text-sm font-medium">快捷回复</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{filteredReplies.length}</Badge>
            </div>
          </CardHeader>
          
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <Input 
                className="h-9 pl-8 text-xs bg-gray-50 border-gray-200 focus-visible:ring-1" 
                placeholder="搜索快捷回复..." 
                value={quickReplySearch}
                onChange={e => setQuickReplySearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full transition-all border",
                    activeCategory === cat 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <CardContent className="p-0 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/30">
            <div className="p-2 space-y-2">
              {filteredReplies.length > 0 ? (
                filteredReplies.map((reply, i) => (
                  <div 
                    key={i}
                    onClick={() => handleQuickReply(reply.content)}
                    className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary/30 hover:shadow-sm cursor-pointer group transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-xs text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                        {reply.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
                        {reply.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 group-hover:text-gray-600">
                      {reply.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  没有找到相关回复
                </div>
              )}
            </div>
          </CardContent>
          
          <div className="p-2 border-t text-center bg-yellow-50/50 dark:bg-yellow-900/10">
            <p className="text-[10px] text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              点击卡片即可填入输入框
            </p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
