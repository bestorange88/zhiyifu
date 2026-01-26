import { useLocation } from "wouter";
import { Volume2, CreditCard, Stethoscope, FileText, Sparkles, ChevronRight, Zap, Heart, Brain, Activity, ShieldCheck } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";
import { ArticleCard } from "@/components/ArticleCard";
import { Header } from "@/components/Header";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { PosterPopup } from "@/components/PosterPopup";

const articles = [
  { id: '1', title: '急诊决策 "人机对决"！新研究揭示，生成式 AI 准确性碾压？', summary: '本研究提示了急诊护士与生成式人工智能模型在临床决策上的关键差异。', author: '客服-晨晨', views: 15953 },
  { id: '2', title: '人工智能 (AI) 和医疗保健行业', summary: '人工智能 (AI) 正在改变医疗保健行业，彻底改变了提供护理服务的方式。', author: '客服-晨晨', views: 2364 },
  { id: '3', title: 'AI辅助术后营养指导的指南依从性评估', summary: '这项研究评估三种AI模型生成的术后饮食方案与ASMBS指南的依从性。', author: '晨曦', views: 4562 },
];

const quickActions = [
  { 
    id: '2', 
    title: 'AI体检', 
    subtitle: '智能健康评估', 
    image: 'https://img.picui.cn/free/2025/01/26/67960cfd8fa3c.jpg' 
  },
  { 
    id: '5', 
    title: '心理咨询', 
    subtitle: '心理健康咨询', 
    image: 'https://img.picui.cn/free/2025/01/26/67960cfd79974.jpg' 
  },
  { 
    id: '12', 
    title: '智能写作', 
    subtitle: '医疗文稿助手', 
    image: 'https://img.picui.cn/free/2025/01/26/67960cfdae7ec.jpg' 
  },
  { 
    id: '7', 
    title: '算命/运势', 
    subtitle: '每日运势预测', 
    image: 'https://img.picui.cn/free/2025/01/26/67960cfdd0c4e.jpg' 
  },
];

const medicalServices = [
  { id: '1', title: '急诊科门诊', subtitle: '请描述您的...', icon: <Stethoscope className="w-5 h-5" />, color: 'gradient-primary' },
  { id: '2', title: '智能健康体检', subtitle: '评估专业医...', icon: <Activity className="w-5 h-5" />, color: 'gradient-success' },
  { id: '3', title: '医疗保险', subtitle: '医疗报销 / ...', icon: <CreditCard className="w-5 h-5" />, color: 'gradient-accent' },
  { id: '4', title: '健康保健', subtitle: '专业AI健康...', icon: <Heart className="w-5 h-5" />, color: 'bg-gradient-to-br from-pink-500 to-rose-500' },
];

export default function HomePage() {
  const [, setLocation] = useLocation();

  const handleToolClick = (toolId: string) => {
    setLocation(`/tools/${toolId}`);
  };

    return (
      <div className="page-container">
        <PosterPopup />
        <AppDownloadBanner />
        <Header />

      <main className="px-4 space-y-5 pb-20">
        <div className="mt-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-4 py-2.5 flex items-center gap-3 shadow-lg shadow-orange-500/20" data-testid="banner-announcement">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
            <Volume2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 overflow-hidden relative h-5">
            <div className="animate-marquee absolute top-0 w-full">
              <p className="text-xs text-white font-medium whitespace-nowrap">
                24小时AI智能问诊上线！门诊不排队。身体不舒服？不用慌！智医服为您提供最专业的医疗咨询服务。
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/80 flex-shrink-0" />
        </div>

        {/* Hero Card - Smart Health System Banner */}
        <div 
          onClick={() => setLocation('/topic/health-system?src=home_banner')}
          className="relative mx-auto w-full group cursor-pointer transform hover:scale-[1.01] transition-transform duration-300"
        >
          <img 
            src={ASSETS.banner} 
            alt="智能健康管理体系" 
            className="w-full h-auto object-cover rounded-2xl shadow-lg shadow-emerald-500/10"
          />
        </div>

        {/* Core Features Section (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setLocation('/health/monitor')}
            className="bg-[#E8F5E9] rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all border border-emerald-100/50"
          >
            <div className="w-16 h-16 mb-2">
              <img src={ASSETS.features.monitor} alt="AI健康监测" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">AI健康监测</h3>
            <p className="text-[10px] text-gray-500">实时身体数据追踪</p>
          </button>

          <button 
            onClick={() => setLocation('/health/assessment')}
            className="bg-[#E8F5E9] rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all border border-emerald-100/50"
          >
            <div className="w-16 h-16 mb-2">
              <img src={ASSETS.features.assessment} alt="智能健康评估" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">智能健康评估</h3>
            <p className="text-[10px] text-gray-500">AI健康风险预测</p>
          </button>

          <button 
            onClick={() => setLocation('/health/insights')}
            className="bg-[#E8F5E9] rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all border border-emerald-100/50"
          >
            <div className="w-16 h-16 mb-2">
              <img src={ASSETS.features.analysis} alt="健康数据分析" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">健康数据分析</h3>
            <p className="text-[10px] text-gray-500">个性化健康建议</p>
          </button>

          <button 
            onClick={() => setLocation('/health/assistant')}
            className="bg-[#E8F5E9] rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all border border-emerald-100/50"
          >
            <div className="w-16 h-16 mb-2">
              <img src={ASSETS.features.consult} alt="AI健康咨询" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">AI健康咨询</h3>
            <p className="text-[10px] text-gray-500">7x24健康问答</p>
          </button>
        </div>

        {/* Medical News Section (Vertical Layout) */}
        <section>
          <div className="flex items-center justify-between mb-3 pl-1 border-l-4 border-blue-500 h-4">
            <h2 className="font-bold text-base text-gray-800 leading-none">医疗健康资讯</h2>
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
