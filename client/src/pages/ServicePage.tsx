import { Header } from "@/components/Header";
import { User, CreditCard, FlaskConical, FileText, ChevronRight, Headphones, Gift, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqItems = [
  { icon: <User className="w-5 h-5" />, title: '账户问题', description: '账户登录、注册相关问题' },
  { icon: <CreditCard className="w-5 h-5" />, title: '充值问题', description: '充值不到账、金额错误' },
  { icon: <FlaskConical className="w-5 h-5" />, title: '研发资助', description: '药物研发资助、收益计算' },
  { icon: <FileText className="w-5 h-5" />, title: '操作指南', description: '平台使用教程' },
];

export default function ServicePage() {
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
          
          <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3.5 font-semibold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
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
            <button 
              key={index} 
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-blue-100 transition-all group text-left"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      {React.cloneElement(icon as React.ReactElement, { className: cn("w-5 h-5", (icon as React.ReactElement).props.className) })}
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
  );
}
