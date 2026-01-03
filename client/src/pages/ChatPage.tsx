import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { useConversations, useCreateConversation, useMessages, useChatStream } from "@/hooks/use-chat";
import { Send, Bot, User, Loader2, Plus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ChatPage() {
  const { data: conversations, isLoading: isLoadingConversations } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoadingConversations && conversations) {
      if (conversations.length > 0 && !activeId) {
        setActiveId(conversations[0].id);
      } else if (conversations.length === 0) {
        createConversation("New Consultation");
      }
    }
  }, [conversations, isLoadingConversations, activeId, createConversation]);

  if (isLoadingConversations || !activeId) {
    return (
      <div className="flex h-screen items-center justify-center page-container">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 gradient-primary rounded-2xl shadow-xl flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400 font-medium">正在连接AI医生...</p>
        </div>
      </div>
    );
  }

  return <ChatInterface conversationId={activeId} onBack={() => setActiveId(null)} />;
}

function ChatInterface({ conversationId, onBack }: { conversationId: number; onBack: () => void }) {
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId);
  const { sendMessage, streamingContent, isStreaming } = useChatStream(conversationId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-screen page-container pb-20">
      <Header className="glass-header shadow-sm border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-base">AI 智能医生</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-400 font-medium">在线 · 随时为您服务</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { }}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors"
          data-testid="button-new-chat"
        >
          <Plus className="w-5 h-5 text-gray-500" />
        </button>
      </Header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-xl">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">智能医疗助手</h3>
              <p className="text-sm text-gray-400 max-w-[240px]">
                您好！我是AI健康助手，请描述您的症状或健康问题，我将为您提供专业建议。
              </p>
            </div>
          </div>
        ) : (
          messages?.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role as 'user' | 'assistant'} content={msg.content} time={msg.createdAt} />
          ))
        )}

        {isStreaming && (
          <MessageBubble 
            role="assistant" 
            content={streamingContent} 
            isTyping={!streamingContent} 
            time={new Date()}
          />
        )}
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100/50 pb-24 lg:pb-4">
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="描述您的症状..."
            disabled={isStreaming}
            className="flex-1 bg-gray-50 border-0 rounded-xl px-5 py-3.5 pr-14 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all disabled:opacity-50"
            data-testid="input-chat"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 w-10 h-10 gradient-primary text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all duration-200 flex items-center justify-center"
            data-testid="button-send"
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content, isTyping, time }: { role: 'user' | 'assistant', content: string, isTyping?: boolean, time?: string | Date }) {
  const isUser = role === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
        isUser ? "gradient-primary" : "bg-white border border-gray-100"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>
      
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isUser 
          ? "gradient-primary text-white rounded-tr-md shadow-lg" 
          : "bg-white border border-gray-100 text-gray-700 rounded-tl-md shadow-sm"
      )}>
        {isTyping ? (
          <div className="flex gap-1.5 h-5 items-center px-2">
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
        {time && !isTyping && (
          <div className={cn(
            "text-[10px] mt-2 text-right",
            isUser ? "text-white/70" : "text-gray-400"
          )}>
            {format(new Date(time), "HH:mm")}
          </div>
        )}
      </div>
    </div>
  );
}
