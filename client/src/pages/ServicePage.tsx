import { useState } from "react";
import { Header } from "@/components/Header";
import { User, CreditCard, FlaskConical, FileText, ChevronRight, ChevronDown, Headphones, Gift, MessageCircle, X, Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

export default function ServicePage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleSendMessage = () => {
    if (contactMessage.trim()) {
      setMessageSent(true);
      setContactMessage("");
      setTimeout(() => {
        setMessageSent(false);
        setShowContactDialog(false);
      }, 2000);
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50/50">
      <Header title="客服中心" showProfile={false} />

      {/* Welcome Card */}
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg">您好, 亲爱的用户</h3>
              <p className="text-sm opacity-90 font-medium mt-1">欢迎来到客服中心</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
            <span className="text-xs font-semibold">客服在线</span>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8" />
          <div className="absolute bottom-0 right-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Service Action Card */}
      <div className="px-4 mt-6">
        <SectionHeader icon={<Headphones className="text-orange-500" />} title="客服服务" />
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">福利社区</h4>
              <p className="text-xs text-gray-500 mt-1">专业客服团队 • 快速响应</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowContactDialog(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3.5 font-semibold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            data-testid="button-contact-service"
          >
            <MessageCircle className="w-4 h-4" />
            <span>立即联系</span>
          </button>
          <p className="text-center text-xs text-gray-400 mt-3 font-medium">24小时在线客服</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 mt-8">
        <SectionHeader icon={<MessageCircle className="text-primary" />} title="常见问题" />
        
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all"
            >
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                data-testid={`button-faq-${index}`}
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                {expandedFaq === index ? (
                  <ChevronDown className="w-5 h-5 text-primary transition-transform" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-300 transition-transform" />
                )}
              </button>
              
              {/* Expandable Answer */}
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                expandedFaq === index ? "max-h-96" : "max-h-0"
              )}>
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              联系客服
            </DialogTitle>
          </DialogHeader>
          
          {messageSent ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800">消息已发送</h3>
              <p className="text-sm text-gray-500 mt-2">客服将尽快回复您</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  您好！我是365智慧问诊客服助手，请描述您遇到的问题，我们将尽快为您解答。
                </p>
              </div>
              
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="请输入您的问题..."
                className="w-full h-32 bg-gray-100 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                data-testid="input-contact-message"
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!contactMessage.trim()}
                className="w-full bg-primary text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                data-testid="button-send-contact"
              >
                <Send className="w-4 h-4" />
                发送消息
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <div className="w-5 h-5">
        {icon}
      </div>
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
  );
}
