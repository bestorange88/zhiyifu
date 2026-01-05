import { useLocation } from "wouter";
import { Volume2, CreditCard, Stethoscope, FileText, Sparkles, ChevronRight, Zap, Heart, Brain } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";
import { ArticleCard } from "@/components/ArticleCard";
import { Header } from "@/components/Header";
import { tools } from "@/pages/ToolsPage";

const articles = [
  { id: '1', title: '急诊决策 "人机对决"！新研究揭示，生成式 AI 准确性碾压？', summary: '本研究揭示了急诊护士与生成式人工智能模型在临床决策上的关键差异。', author: '客服-晨晨', views: 15953 },
  { id: '2', title: '人工智能 (AI) 和医疗保健行业', summary: '人工智能 (AI) 正在改变医疗保健行业，彻底改变了提供护理服务的方式。', author: '客服-晨晨', views: 2364 },
  { id: '3', title: 'AI辅助术后营养指导的指南依从性评估', summary: '这项研究评估三种AI模型生成的术后饮食方案与ASMBS指南的依从性。', author: '晨曦', views: 4562 },
];

const quickActions = [
  { id: '2', title: 'AI体检', icon: <Stethoscope className="w-4 h-4" />, gradient: 'gradient-warm' },
  { id: '12', title: '智能写作', icon: <FileText className="w-4 h-4" />, gradient: 'gradient-purple' },
  { id: '1', title: '在线问诊', icon: <Heart className="w-4 h-4" />, gradient: 'gradient-success' },
  { id: '5', title: '心理咨询', icon: <Brain className="w-4 h-4" />, gradient: 'gradient-accent' },
];

export default function HomePage() {
  const [, setLocation] = useLocation();

  const handleToolClick = (toolId: string) => {
    setLocation(`/tools/${toolId}`);
  };

  return (
    <div className="page-container">
      <Header />

      <main className="px-4 space-y-5">
        <div className="mt-2 card-elevated rounded-full px-4 py-3 flex items-center gap-3" data-testid="banner-announcement">
          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-gray-600 truncate font-medium">
              24小时AI智能问诊上线！门诊不排队。身体不舒服？不用慌！
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="row-span-2">
            <div className="gradient-primary feature-card-gradient h-full shine">
              <div className="relative z-10">
                <span className="badge-sm bg-white/20 text-white mb-2 inline-block">限时特惠</span>
                <h3 className="font-bold text-lg text-white text-shadow-sm">全民新医保</h3>
                <p className="text-sm text-white/90 mt-1 font-medium">五年看病无忧</p>
                
                <div className="mt-4 flex justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                </div>
                
                <button 
                  onClick={() => setLocation('/insurance')}
                  className="mt-4 bg-white text-primary hover:bg-white/90 transition-colors rounded-xl px-4 py-2.5 text-sm font-bold w-full shadow-lg"
                  data-testid="button-hero-experience"
                >
                  立即体验
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => handleToolClick('20')}
            className="card-elevated p-4 flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer text-left"
            data-testid="button-ai-drawing"
          >
            <div className="relative z-10">
              <h3 className="font-bold text-gray-800">AI绘图</h3>
              <p className="text-xs text-gray-400 mt-1">专家级绘画生成</p>
            </div>
            <div className="absolute right-2 bottom-2 w-12 h-12 gradient-purple rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2 h-32">
            {quickActions.slice(0, 2).map((action) => (
              <button 
                key={action.id}
                onClick={() => handleToolClick(action.id)}
                className={`${action.gradient} rounded-2xl p-3 text-white flex flex-col items-center justify-center text-center shadow-md cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all`}
                data-testid={`button-quick-${action.id}`}
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
                  {action.icon}
                </div>
                <h4 className="font-bold text-xs">{action.title}</h4>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button 
              key={action.id}
              onClick={() => handleToolClick(action.id)}
              className="card-elevated p-3 flex flex-col items-center gap-2 hover:shadow-md transition-all"
              data-testid={`button-action-${action.id}`}
            >
              <div className={`w-10 h-10 ${action.gradient} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                {action.icon}
              </div>
              <span className="text-[11px] font-medium text-gray-600">{action.title}</span>
            </button>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">热门模板</h2>
            <button 
              onClick={() => setLocation('/tools')}
              className="text-xs text-gray-400 flex items-center hover:text-primary transition-colors gap-0.5"
              data-testid="button-more-templates"
            >
              更多 <ChevronRight className="w-3 h-3" />
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
                onClick={() => handleToolClick(tool.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Zap className="w-4 h-4 text-primary" />
              医学资讯
            </h2>
            <button 
              className="text-xs text-gray-400 flex items-center hover:text-primary transition-colors gap-0.5"
              data-testid="button-more-news"
            >
              更多 <ChevronRight className="w-3 h-3" />
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
