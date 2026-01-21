import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { User, CreditCard, FlaskConical, FileText, ChevronRight, ChevronDown, Headphones, Gift, MessageCircle, Send, Bot, ArrowLeft, Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

interface ChatMessage {
  id: number;
  sessionId: number;
  senderType: string;
  senderId: number;
  content: string;
  createdAt: string;
}

interface ChatGroup {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
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

interface RedPacket {
  id: number;
  groupId: number;
  totalAmount: string;
  totalCount: number;
  remainingAmount: string;
  remainingCount: number;
  greeting: string;
  status: string;
  createdAt: string;
}

interface RedPacketClaim {
  id: number;
  redPacketId: number;
  userId: number;
  amount: string;
  isLuckiest: boolean;
  claimedAt: string;
  phone?: string;
}

interface RedPacketDetail extends RedPacket {
  claims: RedPacketClaim[];
  hasClaimed?: boolean;
  userClaim?: RedPacketClaim | null;
}

const faqItems = [
  { 
    icon: <User className="w-5 h-5" />, 
    title: '账户问题', 
    description: '账户登录、注册相关问题',
    answer: '如您遇到账户登录问题，请尝试以下方法：\n\n1. 确认您的手机号/邮箱是否正确\n2. 检查网络连接是否正常\n3. 尝试使用"忘记密码"功能重置密码\n4. 清除浏览器缓存后重试\n\n如问题仍未解决，请联系在线客服获取帮助。'
  },
  { 
    icon: <CreditCard className="w-5 h-5" />, 
    title: '充值问题', 
    description: '充值不到账、金额错误',
    answer: '关于充值问题的解答：\n\n1. 充值到账通常需要1-5分钟，请耐心等待\n2. 如超过30分钟未到账，请保留支付凭证\n3. 检查支付是否成功扣款\n4. 核对充值账户是否正确\n\n如遇到充值异常，请联系客服并提供订单号。'
  },
  { 
    icon: <FlaskConical className="w-5 h-5" />, 
    title: '研发资助', 
    description: '药物研发资助、收益计算',
    answer: '研发资助计划说明：\n\n1. 用户可参与医药研发众筹项目\n2. 收益根据项目进展和投入比例计算\n3. 项目周期一般为6-24个月\n4. 详细收益说明请查看各项目详情页\n\n参与前请仔细阅读风险提示。'
  },
  { 
    icon: <FileText className="w-5 h-5" />, 
    title: '操作指南', 
    description: '平台使用教程',
    answer: '平台使用指南：\n\n1. 首页：浏览热门功能和医学资讯\n2. 工具：选择需要的AI问诊或工具\n3. 对话：与AI助手进行专业对话\n4. 客服：获取人工帮助\n5. 我的：管理账户和查看权益\n\n更多帮助请咨询在线客服。'
  },
];

const quickReplies = [
  "如何充值？",
  "忘记密码怎么办？",
  "如何提现？",
  "VIP有什么权益？",
];

const autoResponses: Record<string, string> = {
  "充值": "您好！关于充值问题：\n\n1. 进入「我的」页面，点击「钱包」\n2. 选择充值金额和支付方式\n3. 完成支付后金额将自动到账\n\n如遇充值不到账，请保留支付凭证联系我们。",
  "密码": "您好！如果忘记密码：\n\n1. 在登录页点击「忘记密码」\n2. 输入注册手机号获取验证码\n3. 验证后设置新密码\n\n如手机号已更换，请联系人工客服处理。",
  "提现": "您好！关于提现说明：\n\n1. 进入「我的」页面，点击「钱包」\n2. 选择「提现」功能\n3. 输入提现金额和收款账户\n4. 提现将在1-3个工作日内到账\n\n最低提现金额为10元。",
  "VIP": "您好！VIP会员权益包括：\n\n1. 每日签到积分翻倍\n2. 专属客服优先响应\n3. AI工具使用无限制\n4. 专属活动和优惠\n5. 推广佣金比例提升\n\n升级VIP请前往「我的」页面。",
  "default": "您好！感谢您的咨询。我是云智医服智能客服，正在为您转接人工客服，请稍候...\n\n您也可以查看下方常见问题获取帮助。",
};

function getAutoResponse(message: string): string {
  for (const [keyword, response] of Object.entries(autoResponses)) {
    if (keyword !== "default" && message.includes(keyword)) {
      return response;
    }
  }
  return autoResponses["default"];
}

export default function ServicePage() {
  const { user, token } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState<ChatGroup | null>(null);
  const [input, setInput] = useState("");
  const [groupInput, setGroupInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupScrollRef = useRef<HTMLDivElement>(null);
  const [selectedRedPacket, setSelectedRedPacket] = useState<RedPacketDetail | null>(null);
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);

  const { data: serviceSession, refetch: refetchSession } = useQuery({
    queryKey: ["/api/service/session"],
    queryFn: async () => {
      const res = await fetch("/api/service/session", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!token && showChat,
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/service/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: () => {
      refetchSession();
    },
  });

  useEffect(() => {
    if (showChat && token && serviceSession === null && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [showChat, token, serviceSession]);

  const { data: serviceMessages, refetch: refetchServiceMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/service/messages"],
    queryFn: async () => {
      const res = await fetch("/api/service/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && showChat && !!serviceSession,
    refetchInterval: 3000,
  });

  const sendServiceMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/service/messages", {
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
      refetchServiceMessages();
      setInput("");
    },
  });

  const { data: userGroups } = useQuery<ChatGroup[]>({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  // 获取系统群组（公共群组，不需要登录）
  const { data: systemGroups } = useQuery<ChatGroup[]>({
    queryKey: ["/api/groups/system"],
    queryFn: async () => {
      const res = await fetch("/api/groups/system");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: groupMessages, refetch: refetchGroupMessages } = useQuery<GroupMessage[]>({
    queryKey: ["/api/groups", showGroupChat?.id, "messages"],
    queryFn: async () => {
      if (!showGroupChat) return [];
      const res = await fetch(`/api/groups/${showGroupChat.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!showGroupChat && !!token,
    refetchInterval: 5000,
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: number; content: string }) => {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
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
      refetchGroupMessages();
      setGroupInput("");
    },
  });

  const handleSendGroupMessage = () => {
    if (!groupInput.trim() || !showGroupChat) return;
    sendGroupMessageMutation.mutate({ groupId: showGroupChat.id, content: groupInput.trim() });
  };

  // 红包相关查询
  const { data: groupRedPackets, refetch: refetchRedPackets } = useQuery<RedPacket[]>({
    queryKey: ["/api/groups", showGroupChat?.id, "red-packets"],
    queryFn: async () => {
      if (!showGroupChat) return [];
      const res = await fetch(`/api/groups/${showGroupChat.id}/red-packets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!showGroupChat && !!token,
    refetchInterval: 5000,
  });

  // 领取红包
  const claimRedPacketMutation = useMutation({
    mutationFn: async (redPacketId: number) => {
      const res = await fetch(`/api/red-packets/${redPacketId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "领取失败");
      }
      return res.json();
    },
    onSuccess: (data) => {
      refetchRedPackets();
      // 更新红包详情
      if (selectedRedPacket) {
        fetchRedPacketDetail(selectedRedPacket.id);
      }
      alert(`恭喜您领取了 ¥${parseFloat(data.amount).toFixed(2)} 元红包！`);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 获取红包详情
  const fetchRedPacketDetail = async (redPacketId: number) => {
    try {
      const res = await fetch(`/api/red-packets/${redPacketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const detail = await res.json();
        setSelectedRedPacket(detail);
      }
    } catch (error) {
      console.error("获取红包详情失败", error);
    }
  };

  const handleOpenRedPacket = async (packet: RedPacket) => {
    await fetchRedPacketDetail(packet.id);
    setShowRedPacketModal(true);
  };

  const handleClaimRedPacket = () => {
    if (selectedRedPacket && !selectedRedPacket.hasClaimed) {
      claimRedPacketMutation.mutate(selectedRedPacket.id);
    }
  };

  useEffect(() => {
    if (groupScrollRef.current) {
      groupScrollRef.current.scrollTop = groupScrollRef.current.scrollHeight;
    }
  }, [groupMessages]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [serviceMessages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || sendServiceMessageMutation.isPending) return;
    sendServiceMessageMutation.mutate(messageText);
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  if (showGroupChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button 
            onClick={() => setShowGroupChat(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            data-testid="button-back-group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-purple-500 to-pink-500">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-800 dark:text-white">{showGroupChat.name}</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">群组聊天</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={groupScrollRef}>
          {groupMessages && groupMessages.length > 0 ? (
            groupMessages.map((msg) => {
              const isMe = msg.userId === user?.id;
              const isAdmin = msg.senderType === "admin";
              const displayName = isAdmin ? (msg.senderName || "管理员") : (msg.phone || `用户${msg.userId}`);
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isMe
                        ? "bg-gradient-to-br from-primary to-cyan-500"
                        : isAdmin 
                          ? "bg-gradient-to-br from-orange-400 to-red-500"
                          : "bg-gradient-to-br from-purple-400 to-pink-500"
                    )}
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[75%]">
                    {!isMe && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{displayName}</p>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
                        isMe
                          ? "bg-gradient-to-br from-primary to-cyan-500 text-white rounded-tr-sm"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 rounded-tl-sm"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          isMe ? "text-white/70" : "text-gray-400"
                        )}
                      >
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              暂无消息，发送第一条消息吧
            </div>
          )}

          {/* 红包列表 */}
          {groupRedPackets && groupRedPackets.filter(p => p.status === "active").length > 0 && (
            <div className="mt-4 space-y-2">
              {groupRedPackets.filter(p => p.status === "active").map((packet) => (
                <div
                  key={packet.id}
                  onClick={() => handleOpenRedPacket(packet)}
                  className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1 text-white">
                      <p className="font-bold">{packet.greeting || "恭喜发财，大吉大利"}</p>
                      <p className="text-xs opacity-80">
                        剩余 {packet.remainingCount}/{packet.totalCount} 个
                      </p>
                    </div>
                    <div className="text-yellow-300 text-sm font-bold">
                      点击领取
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 红包弹窗 */}
        {showRedPacketModal && selectedRedPacket && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-b from-red-500 to-red-600 rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="relative p-6 text-center text-white">
                <button
                  onClick={() => {
                    setShowRedPacketModal(false);
                    setSelectedRedPacket(null);
                  }}
                  className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">
                  {selectedRedPacket.greeting || "恭喜发财，大吉大利"}
                </h3>
                
                {selectedRedPacket.hasClaimed && selectedRedPacket.userClaim ? (
                  <div className="mt-4">
                    <p className="text-yellow-300 text-3xl font-bold">
                      ¥{parseFloat(selectedRedPacket.userClaim.amount).toFixed(2)}
                    </p>
                    <p className="text-white/70 text-sm mt-2">
                      {selectedRedPacket.userClaim.isLuckiest && "🎉 手气最佳！"}
                    </p>
                  </div>
                ) : selectedRedPacket.status === "active" ? (
                  <button
                    onClick={handleClaimRedPacket}
                    disabled={claimRedPacketMutation.isPending}
                    className="mt-4 w-32 h-32 bg-yellow-400 hover:bg-yellow-300 rounded-full flex items-center justify-center mx-auto text-red-600 font-bold text-xl shadow-lg transition-all"
                  >
                    {claimRedPacketMutation.isPending ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      "開"
                    )}
                  </button>
                ) : (
                  <p className="text-white/70 mt-4">红包已被抢完</p>
                )}
                
                <p className="text-white/60 text-xs mt-4">
                  共 {selectedRedPacket.totalCount} 个红包，
                  已领取 {selectedRedPacket.totalCount - selectedRedPacket.remainingCount} 个
                </p>
              </div>
              
              {/* 领取记录 */}
              {selectedRedPacket.claims && selectedRedPacket.claims.length > 0 && (
                <div className="bg-white rounded-t-2xl p-4 max-h-60 overflow-y-auto">
                  <h4 className="text-gray-800 font-bold mb-3">领取记录</h4>
                  <div className="space-y-2">
                    {selectedRedPacket.claims.map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-gray-700 text-sm">
                            {claim.phone || `用户${claim.userId}`}
                          </span>
                          {claim.isLuckiest && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                              手气最佳
                            </span>
                          )}
                        </div>
                        <span className="text-red-500 font-bold">
                          ¥{parseFloat(claim.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={groupInput}
              onChange={(e) => setGroupInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendGroupMessage()}
              placeholder="输入消息..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"
              data-testid="input-group-message"
            />
            <button
              onClick={handleSendGroupMessage}
              disabled={!groupInput.trim() || sendGroupMessageMutation.isPending}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                groupInput.trim() && !sendGroupMessageMutation.isPending
                  ? "bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-400"
              )}
              data-testid="button-send-group"
            >
              {sendGroupMessageMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button 
            onClick={() => setShowChat(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="button-back-service"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-primary to-cyan-500">
            <Headphones className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-800">在线客服</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">客服在线</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {(!serviceMessages || serviceMessages.length === 0) && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-orange-400 to-red-500">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm">
                <p className="text-sm leading-relaxed whitespace-pre-line">您好！我是云智医服在线客服，很高兴为您服务。请问有什么可以帮助您的吗？</p>
              </div>
            </div>
          )}
          {serviceMessages && serviceMessages.map((msg) => {
            const isUser = msg.senderType === "user";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    isUser
                      ? "bg-gradient-to-br from-primary to-cyan-500"
                      : "bg-gradient-to-br from-orange-400 to-red-500"
                  )}
                >
                  {isUser ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3",
                    isUser
                      ? "bg-gradient-to-br from-primary to-cyan-500 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isUser ? "text-white/70" : "text-gray-400"
                    )}
                  >
                    {format(new Date(msg.createdAt), "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}

          {sendServiceMessageMutation.isPending && (
            <div className="flex gap-2 flex-row-reverse">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary to-cyan-500">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-gradient-to-br from-primary to-cyan-500 text-white rounded-tr-sm opacity-60">
                <p className="text-sm">发送中...</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-100 p-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickReplies.map((text, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(text)}
                className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors"
                data-testid={`button-quick-reply-${index}`}
              >
                {text}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="请输入您的问题..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-chat-message"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendServiceMessageMutation.isPending}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                input.trim() && !sendServiceMessageMutation.isPending
                  ? "bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg"
                  : "bg-gray-200 text-gray-400"
              )}
              data-testid="button-send-chat"
            >
              {sendServiceMessageMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header title="客服中心" showProfile={false} />

      <div className="px-4 mt-4">
        <div className="gradient-primary rounded-3xl p-6 text-white shadow-xl relative overflow-hidden shine">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-shadow-sm">您好, 亲爱的用户</h3>
              <p className="text-sm opacity-90 font-medium mt-1">欢迎来到客服中心</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-white/15 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
            <span className="text-xs font-semibold">客服在线</span>
          </div>
          
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12" />
          <div className="absolute bottom-0 right-10 w-28 h-28 bg-purple-400/20 rounded-full blur-2xl" />
        </div>
      </div>

      <div className="px-4 mt-6">
        <h3 className="section-title mb-3">
          <Headphones className="w-4 h-4 text-primary" />
          客服服务
        </h3>
        
        <div className="card-elevated p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 gradient-warm rounded-2xl flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">智能客服</h4>
              <p className="text-xs text-gray-400 mt-1">AI智能 + 人工客服 · 快速响应</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowChat(true)}
            className="btn-primary-gradient w-full flex items-center justify-center gap-2"
            data-testid="button-contact-service"
          >
            <MessageCircle className="w-4 h-4" />
            <span>开始对话</span>
          </button>
          <p className="text-center text-xs text-gray-400 mt-3 font-medium">24小时在线客服</p>
        </div>
      </div>

      {/* 系统群组入口 - 始终显示 */}
      {systemGroups && systemGroups.length > 0 && (
        <div className="px-4 mt-6">
          <h3 className="section-title mb-3">
            <Users className="w-4 h-4 text-primary" />
            交流群组
          </h3>
          
          <div className="space-y-3">
            {systemGroups.map((group) => (
              <div 
                key={group.id}
                className="card-elevated p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-white">{group.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{group.description || "群组聊天"}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) {
                        alert("请先登录后再进入群组");
                        return;
                      }
                      setShowGroupChat(group);
                    }}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                    data-testid={`button-enter-group-${group.id}`}
                  >
                    进入
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-8 pb-24">
        <h3 className="section-title mb-3">
          <MessageCircle className="w-4 h-4 text-primary" />
          常见问题
        </h3>
        
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div 
              key={index} 
              className="card-elevated overflow-hidden"
            >
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors text-left"
                data-testid={`button-faq-${index}`}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  expandedFaq === index ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                )}>
                  {expandedFaq === index ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                expandedFaq === index ? "max-h-96" : "max-h-0"
              )}>
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-primary/5 rounded-xl p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line border border-primary/10">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
