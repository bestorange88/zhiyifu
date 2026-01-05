import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useMessages, useChatStream, useCreateConversation, useConversations } from "@/hooks/use-chat";
import { Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tools } from "@/pages/ToolsPage";

// System prompts for different tool categories
const toolSystemPrompts: Record<string, string> = {
  "急诊科门诊": "你是一位专业的急诊科AI医生助手。请根据用户描述的症状，提供初步的健康分析和建议。注意：这只是参考建议，严重情况请立即就医。",
  "智能健康体检": "你是一位专业的健康体检AI助手。请帮助用户分析健康指标，生成智能健康评估报告，并提供改善建议。",
  "医疗保险": "你是一位医疗保险专家AI助手。请帮助用户了解医保政策、报销流程、覆盖范围等问题。",
  "健康保健": "你是一位专业的健康保健AI顾问。请提供科学的养生、保健、预防疾病等方面的建议。",
  "西药咨询": "你是一位专业的药剂师AI助手。请帮助用户了解药物的用法、用量、副作用、药物相互作用等问题。提醒：用药请遵医嘱。",
  "中药疗理": "你是一位中医药学AI助手。请从中医角度分析用户的健康问题，提供中药调理、食疗养生等建议。",
  "算命/运势": "你是一位精通八字命理的AI大师。请根据用户提供的生辰八字，分析其性格特点、事业运势、婚姻感情等方面。",
  "星座查询": "你是一位星座运势分析师AI。请帮助用户分析星座性格、今日/本周运势、星座配对等内容。",
  "心理咨询": "你是一位专业的心理咨询AI助手。请用温和、理解的态度倾听用户的心理困扰，提供情绪疏导和心理健康建议。所有对话严格保密。",
  "法律咨询": "你是一位专业的法律AI顾问。请用专业的法律知识帮助用户分析法律问题、权益保护、法律风险等。注意：这只是参考意见，重要案件请咨询律师。",
  "内科问诊": "你是一位内科AI医生助手，擅长呼吸内科、消化内科、心血管内科、神经内科、内分泌科等领域。请根据用户症状提供专业分析和建议。",
  "智能写作": "你是一位专业的AI写作助手。请帮助用户完成新闻稿、报告、小说、文案等各类写作任务。",
  "妇科问诊": "你是一位专业的妇科AI医生助手。请帮助用户解答女性健康、月经问题、孕期保健等方面的疑问。所有对话严格保密。",
  "新生儿童起名": "你是一位起名学AI专家。请根据用户提供的姓氏、期望等，提供寓意美好、朗朗上口的名字建议，并解释名字的含义。",
  "儿科问诊": "你是一位儿科AI医生助手。请帮助家长了解儿童常见疾病、生长发育、疫苗接种、育儿健康等问题，提供专业的儿童健康指导。",
  "外科问诊": "你是一位外科AI医生助手，擅长普通外科、骨科、神经外科、泌尿外科等领域。请根据用户情况提供专业建议。",
  "皮肤科问诊": "你是一位皮肤科AI医生助手。请帮助用户分析皮肤问题、皮肤护理、常见皮肤病等，提供专业的诊断建议和护理方案。",
  "营养膳食": "你是一位营养学AI专家。请根据用户的身体状况、健康目标，提供个性化的饮食规划、营养搭配和健康食谱建议。",
  "科研众筹": "你是一位科研AI助手。请帮助用户进行药物靶点分析、分子模拟、科研文献查询、技术分析等工作。",
  "AI绘图": "你是一位专业的AI绘图助手。请帮助用户描述想要的画面，我会根据您的需求生成相应的图片。请详细描述画面内容、风格、色调等信息。",
  "法律风险评估": "你是一位法律风险评估AI专家。请帮助用户评估其行为、合同、决策等方面的法律风险，并提供防范建议。",
  "论文辅导": "你是一位学术论文AI导师。请帮助用户进行论文选题、结构规划、文献综述、写作润色、格式规范等学术写作指导。",
};

function getSystemPrompt(toolTitle: string): string {
  return toolSystemPrompts[toolTitle] || `你是云智医服的AI助手，专注于"${toolTitle}"领域。请专业、友善地回答用户的问题。`;
}

export default function ToolChatPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const toolId = params.id;
  
  const tool = tools.find(t => t.id === toolId);
  
  const { data: conversations, isLoading: isLoadingConversations } = useConversations();
  const { mutateAsync: createConversation } = useCreateConversation();
  const [conversationId, setConversationId] = useState<number | null>(null);

  // Create or find conversation for this tool
  useEffect(() => {
    async function initConversation() {
      if (!tool || isLoadingConversations) return;
      
      // Create a new conversation for this tool
      const newConv = await createConversation(tool.title);
      setConversationId(newConv.id);
    }
    
    if (!conversationId && tool) {
      initConversation();
    }
  }, [tool, isLoadingConversations, conversationId, createConversation]);

  if (!tool) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">工具不存在</p>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <p className="text-gray-400 font-medium animate-pulse">正在初始化 {tool.title}...</p>
        </div>
      </div>
    );
  }

  return (
    <ToolChatInterface 
      conversationId={conversationId} 
      tool={tool} 
      systemPrompt={getSystemPrompt(tool.title)}
      onBack={() => setLocation("/tools")} 
    />
  );
}

interface ToolChatInterfaceProps {
  conversationId: number;
  tool: { id: string; title: string; description: string; icon: React.ReactNode; color: string };
  systemPrompt: string;
  onBack: () => void;
}

function ToolChatInterface({ conversationId, tool, systemPrompt, onBack }: ToolChatInterfaceProps) {
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId);
  const { sendMessage, streamingContent, isStreaming } = useChatStream(conversationId, systemPrompt);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Hide welcome when messages exist
  useEffect(() => {
    if (messages && messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    setShowWelcome(false);
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", tool.color)}>
          {tool.icon}
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-gray-800">{tool.title}</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">AI 在线</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {/* Welcome Message */}
        {showWelcome && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0", tool.color)}>
                {tool.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{tool.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
                <p className="text-xs text-blue-600 mt-2">请描述您的问题，我会为您提供专业的分析和建议。</p>
              </div>
            </div>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`向${tool.title}提问...`}
            disabled={isStreaming}
            className="flex-1 bg-gray-100 border-0 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all disabled:opacity-50"
            data-testid="input-message"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-3 bg-primary text-white rounded-full shadow-lg shadow-blue-500/25 hover:bg-blue-600 disabled:opacity-50 disabled:shadow-none transition-all"
            data-testid="button-send"
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
        "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed",
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
        {time && !isTyping && (
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
