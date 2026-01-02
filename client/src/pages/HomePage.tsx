import { Volume2, CreditCard, Stethoscope, FileText, Sparkles, ChevronRight, User } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";
import { ArticleCard } from "@/components/ArticleCard";
import { Header } from "@/components/Header";
import { tools } from "@/pages/ToolsPage"; // Importing tools data from ToolsPage to avoid duplication

// Static data
const articles = [
  { id: '1', title: '急诊决策 "人机对决"！新研究揭示，生成式 AI 准确性碾压？', summary: '本研究揭示了急诊护士与生成式人工智能模型在临床决策上的关键差异。', author: '客服-晨晨', views: 15953 },
  { id: '2', title: '人工智能 (AI) 和医疗保健行业', summary: '人工智能 (AI) 正在改变医疗保健行业，彻底改变了提供护理服务的方式。', author: '客服-晨晨', views: 2364 },
  { id: '3', title: 'AI辅助术后营养指导的指南依从性评估', summary: '这项研究评估三种AI模型生成的术后饮食方案与ASMBS指南的依从性。', author: '晨曦', views: 4562 },
];

export default function HomePage() {
  return (
    <div className="pb-24 min-h-screen bg-gray-50/50">
      <Header />

      <main className="px-4 space-y-6">
        {/* Announcement */}
        <div className="mt-2 bg-white rounded-full px-4 py-2.5 flex items-center gap-3 shadow-sm border border-blue-50/50">
          <div className="bg-blue-50 p-1.5 rounded-full">
            <Volume2 className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-gray-600 truncate font-medium">
              24小时AI智能问诊上线！门诊不排队。身体不舒服？不用慌！
            </p>
          </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Main Card - Spans 2 rows */}
          <div className="row-span-2">
            <FeatureCard
              title="全民新医保"
              description="五年看病无忧"
              icon={<CreditCard className="w-8 h-8 text-white" />}
              color="from-blue-500 to-blue-600"
            />
          </div>

          {/* Secondary Cards */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
            <div className="relative z-10">
              <h3 className="font-bold text-gray-800">AI绘图</h3>
              <p className="text-xs text-gray-500 mt-1">专家级绘画生成</p>
            </div>
            <div className="absolute right-2 bottom-2 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Small Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-2 h-32">
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-3 text-white flex flex-col items-center justify-center text-center shadow-md cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs">AI体检</h4>
            </div>
            <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-2xl p-3 text-white flex flex-col items-center justify-center text-center shadow-md cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs">工作周报</h4>
            </div>
          </div>
        </div>

        {/* Hot Templates */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              热门模板
            </h2>
            <button className="text-xs text-gray-400 flex items-center hover:text-primary transition-colors">
              更多 <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.slice(0, 4).map((tool) => (
              <FeatureCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                color={tool.color}
                variant="compact"
              />
            ))}
          </div>
        </section>

        {/* Medical News */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
              医学资讯
            </h2>
            <button className="text-xs text-gray-400 flex items-center hover:text-primary transition-colors">
              更多 <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <div className="space-y-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
