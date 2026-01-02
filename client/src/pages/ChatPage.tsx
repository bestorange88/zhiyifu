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

  // Initialize: select first conversation or create one
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <p className="text-gray-400 font-medium animate-pulse">Initializing AI Doctor...</p>
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

  // Auto-scroll to bottom
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
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      <Header className="shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-blue-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">AI 智能医生</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500 font-medium">Online 24/7</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { /* Implement new chat */ }}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </Header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <MessageCircle className="w-16 h-16 text-gray-300" />
            <p className="text-sm text-gray-500">
              Hello! I'm your AI health assistant.<br/>
              Ask me anything about your symptoms or health.
            </p>
          </div>
        ) : (
          messages?.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role as 'user' | 'assistant'} content={msg.content} time={msg.createdAt} />
          ))
        )}

        {/* Streaming Message Bubble */}
        {isStreaming && (
          <MessageBubble 
            role="assistant" 
            content={streamingContent} 
            isTyping={!streamingContent} 
            time={new Date()}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 pb-24 lg:pb-4">
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your symptoms..."
            disabled={isStreaming}
            className="flex-1 bg-gray-100 border-0 rounded-full px-6 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 p-2 bg-primary text-white rounded-full shadow-lg shadow-blue-500/25 hover:bg-blue-600 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all duration-200"
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1",
        isUser ? "bg-gray-800" : "bg-white border border-gray-100"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>
      
      <div className={cn(
        "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed",
        isUser 
          ? "bg-primary text-white rounded-tr-none" 
          : "bg-white border border-gray-100 text-gray-700 rounded-tl-none"
      )}>
        {isTyping ? (
          <div className="flex gap-1 h-5 items-center">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
        {time && (
          <div className={cn(
            "text-[10px] mt-1 text-right opacity-70",
            isUser ? "text-blue-100" : "text-gray-400"
          )}>
            {format(new Date(time), "HH:mm")}
          </div>
        )}
      </div>
    </div>
  );
}
