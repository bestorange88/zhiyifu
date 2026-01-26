import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ChevronLeft, 
  Bell, 
  User, 
  Share2, 
  Activity, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Info 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- Types ---
interface RecoItem {
  id: string;
  title: string;
  content: string;
  reason: string;
  status: 'pending' | 'done' | 'later' | 'dismissed';
  feedback?: 'helpful' | 'not_helpful';
}

interface GrowthStats {
  streakDays: number;
  dataCompleteness: number; // 0-100
  stabilityIndex: number; // 0-100
  weeklyGoalRate: number; // 0-100
  weeklyTrend: number[]; // 7 days data
}

// --- Mock Data ---
const MOCK_RECO: RecoItem = {
  id: 'reco_001',
  title: '今日建议：增加 20 分钟中等强度运动',
  content: '根据您最近的睡眠质量分析，适当的运动有助于提高深度睡眠比例。建议进行快走或慢跑。',
  reason: '最近7天平均深睡时长偏低 (12%)',
  status: 'pending'
};

const MOCK_STATS: GrowthStats = {
  streakDays: 12,
  dataCompleteness: 85,
  stabilityIndex: 92,
  weeklyGoalRate: 75,
  weeklyTrend: [60, 70, 65, 80, 85, 90, 88]
};

const SAMPLE_REPORTS = [
  {
    id: 'rpt_01',
    title: '睡眠改善分析报告',
    user: '用户 138****1234',
    before: '入睡困难，深睡少',
    after: '入睡时间缩短 30%',
    action: '调整作息 + 冥想引导',
    period: '2周'
  },
  {
    id: 'rpt_02',
    title: '压力管理评估',
    user: '用户 139****5678',
    before: '高压力指数，易焦虑',
    after: '压力指数下降 15 分',
    action: 'AI 心理疏导 + 运动',
    period: '1个月'
  }
];

const FAQS = [
  { q: 'AI 会不会给出诊断？', a: '不会。本系统仅提供健康管理建议和辅助信息，所有医疗诊断请务必咨询专业医生。' },
  { q: '数据是否安全？', a: '您的数据经过严格加密存储，且支持权限分级管理（RLS），仅您授权后可见。' },
  { q: '我没有设备也能用吗？', a: '可以。您可以手动记录关键健康数据，系统依然能为您提供趋势分析。' },
  { q: '建议不准怎么办？', a: '您可以通过“反馈”功能告诉我们，系统会根据您的反馈不断学习和调整建议模型。' },
  { q: '是否需要付费？', a: '基础评估和建议免费，高级会员可享受更深入的分析报告和专属服务权益。' },
  { q: '与医生有什么关系？', a: '我们是医生的助手，帮助您整理健康档案，让医生能更快速准确地了解您的状况。' }
];

// --- Components ---

const TopicHeader = ({ title = "智能健康管理体系" }: { title?: string }) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between safe-area-top">
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/home")} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-1">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
};

const HeroSystemBanner = () => {
  const [, setLocation] = useLocation();
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-b-[2rem] shadow-xl pb-8 pt-6 px-6 mb-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-2 tracking-tight">智能健康管理体系</h2>
        <p className="text-emerald-100 text-lg mb-6 font-medium">AI分析 · 行为管理 · 专业协作</p>
        
        <div className="space-y-3 mb-8">
          {[
            "趋势分析与风险提示（不做诊断）",
            "长期行为管理与成长记录",
            "专业服务连接与健康档案沉淀"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 flex-shrink-0" />
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => setLocation("/health/assessment")}
            className="flex-1 bg-white text-emerald-600 hover:bg-emerald-50 font-bold rounded-full shadow-lg border-none h-11"
          >
            开始我的健康评估
          </Button>
          <Button 
            variant="outline" 
            className="px-6 border-white/30 text-white hover:bg-white/10 rounded-full h-11 bg-transparent"
            onClick={() => {
              const el = document.getElementById('system-intro');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            查看介绍
          </Button>
        </div>
      </div>
    </div>
  );
};

const SystemSteps = () => {
  const steps = [
    { icon: FileText, title: "建档", desc: "完善健康信息" },
    { icon: Calendar, title: "记录", desc: "每日健康打卡" },
    { icon: Activity, title: "分析", desc: "AI趋势分析" },
    { icon: Target, title: "跟进", desc: "目标与协作" },
  ];

  return (
    <div id="system-intro" className="px-4 mb-8">
      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
        <Info className="w-5 h-5 text-emerald-500" />
        它如何工作
      </h3>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-10 transform scale-x-90"></div>
          
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center bg-white z-10">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2 shadow-sm border border-emerald-100">
                <step.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-sm text-gray-800">{step.title}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 scale-90 whitespace-nowrap">{step.desc}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <Button className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none shadow-none font-semibold rounded-xl h-10 text-sm">
            立即开始建档 <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const CapabilityGrid = () => {
  const [, setLocation] = useLocation();
  
  const caps = [
    { title: "AI健康监测", desc: "实时数据追踪", route: "/health/monitor", icon: Activity, badge: "实时" },
    { title: "智能健康评估", desc: "趋势评分与风险", route: "/health/assessment", icon: ShieldCheck, badge: "推荐" },
    { title: "健康数据分析", desc: "个性化建议报告", route: "/health/insights", icon: BarChart3, badge: "深度" },
    { title: "AI健康咨询", desc: "7×24健康问答", route: "/health/assistant", icon: MessageSquare, badge: "热门" },
  ];

  return (
    <div className="px-4 mb-8">
      <h3 className="font-bold text-lg text-gray-800 mb-4">核心体系能力</h3>
      <div className="grid grid-cols-2 gap-3">
        {caps.map((cap, i) => (
          <button
            key={i}
            onClick={() => setLocation(cap.route)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold">
              {cap.badge}
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-50 transition-colors">
              <cap.icon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">{cap.title}</h4>
            <p className="text-xs text-gray-400">{cap.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const TodayRecommendationCard = () => {
  const [reco, setReco] = useState(MOCK_RECO);

  const handleAction = (status: RecoItem['status']) => {
    setReco(prev => ({ ...prev, status }));
  };

  const handleFeedback = (feedback: RecoItem['feedback']) => {
    setReco(prev => ({ ...prev, feedback }));
  };

  if (reco.status === 'dismissed') return null;

  return (
    <div className="px-4 mb-8">
      <h3 className="font-bold text-lg text-gray-800 mb-4">今日建议</h3>
      <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all ${reco.status === 'done' ? 'opacity-70 grayscale' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md">
            AI 推荐
          </div>
          {reco.status === 'done' && (
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> 已完成
            </span>
          )}
        </div>
        
        <h4 className="font-bold text-gray-800 mb-2">{reco.title}</h4>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{reco.content}</p>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span className="font-medium">依据：</span>
            {reco.reason}
          </p>
        </div>
        
        {reco.status === 'pending' && (
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => handleAction('done')}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-9 rounded-full text-xs"
            >
              标记完成
            </Button>
            <Button 
              onClick={() => handleAction('later')}
              variant="outline" 
              className="flex-1 h-9 rounded-full text-xs"
            >
              稍后提醒
            </Button>
            <Button 
              onClick={() => handleAction('dismissed')}
              variant="ghost" 
              className="px-3 h-9 rounded-full text-xs text-gray-400"
            >
              不适用
            </Button>
          </div>
        )}
        
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">建议是否有帮助？</span>
          <div className="flex gap-3">
            <button 
              onClick={() => handleFeedback('helpful')}
              className={`p-1 rounded transition-colors ${reco.feedback === 'helpful' ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleFeedback('not_helpful')}
              className={`p-1 rounded transition-colors ${reco.feedback === 'not_helpful' ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GrowthDashboard = () => {
  return (
    <div className="px-4 mb-8">
      <h3 className="font-bold text-lg text-gray-800 mb-4">健康成长曲线</h3>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <p className="text-2xl font-bold text-orange-500 mb-1">{MOCK_STATS.streakDays}</p>
            <p className="text-xs text-gray-500">连续参与(天)</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-500 mb-1">{MOCK_STATS.dataCompleteness}%</p>
            <p className="text-xs text-gray-500">数据完整度</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-500 mb-1">{MOCK_STATS.stabilityIndex}</p>
            <p className="text-xs text-gray-500">行为稳定指数</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-500 mb-1">{MOCK_STATS.weeklyGoalRate}%</p>
            <p className="text-xs text-gray-500">本周达标率</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-600">7日健康趋势</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="h-16 flex items-end justify-between gap-1">
            {MOCK_STATS.weeklyTrend.map((val, i) => (
              <div key={i} className="w-full bg-emerald-100 rounded-t-sm relative group">
                <div 
                  className="bg-emerald-400 w-full rounded-t-sm absolute bottom-0 transition-all duration-500"
                  style={{ height: `${val}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 text-[10px] text-gray-500 space-y-1">
          <p>• 真正的健康管理来自长期、持续、可信的行为积累</p>
          <p>• 系统鼓励真实与稳定参与，不鼓励短期行为</p>
          <p>• 所有建议仅为健康管理参考，不替代医生诊断</p>
        </div>
      </div>
    </div>
  );
};

const SampleReports = () => {
  return (
    <div className="px-4 mb-8">
      <h3 className="font-bold text-lg text-gray-800 mb-4">真实改善案例</h3>
      <div className="space-y-3">
        {SAMPLE_REPORTS.map((report, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
              <span className="text-xs font-bold text-gray-500">{report.user}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                周期: {report.period}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-[10px] text-gray-400 mb-1">改善前</p>
                <p className="text-xs font-medium text-gray-700">{report.before}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1">改善后</p>
                <p className="text-xs font-bold text-emerald-600">{report.after}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg flex justify-between items-center">
              <p className="text-[10px] text-gray-500">
                <span className="font-medium text-gray-700">关键行动:</span> {report.action}
              </p>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FAQAccordion = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="px-4 mb-24">
      <h3 className="font-bold text-lg text-gray-800 mb-4">常见问题 FAQ</h3>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button 
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <span className="text-sm font-medium text-gray-800">{faq.q}</span>
              <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${openIdx === i ? '-rotate-90' : ''}`} />
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed bg-gray-50/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const StickyCTABar = ({ onOpenDisclaimer }: { onOpenDisclaimer: () => void }) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-area-bottom z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto flex gap-3">
        <Button 
          variant="outline"
          className="flex-1 rounded-full font-bold border-gray-200 text-gray-700 h-11"
          onClick={() => setLocation("/health/assessment")}
        >
          30秒开始评估
        </Button>
        <Button 
          className="flex-1 rounded-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-11 shadow-lg shadow-emerald-500/30"
          onClick={() => setLocation(user ? "/health/assessment" : "/onboarding/health-profile")}
        >
          {user ? '继续我的档案' : '建立健康档案'}
        </Button>
      </div>
      <div className="text-center mt-2">
        <button 
          onClick={onOpenDisclaimer}
          className="text-[10px] text-gray-400 underline decoration-gray-300"
        >
          服务免责声明
        </button>
      </div>
    </div>
  );
};

const DisclaimerModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] rounded-2xl">
        <DialogHeader>
          <DialogTitle>免责声明</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-600 space-y-3 max-h-[60vh] overflow-y-auto">
          <p>1. 本平台提供的所有健康管理建议、分析报告及资讯内容仅供参考。</p>
          <p>2. 系统基于AI模型和大数据分析，不构成任何医疗诊断或治疗建议，也不能替代专业医生的当面诊断。</p>
          <p>3. 若您出现身体不适、疼痛加剧或其他急重症状，请立即停止使用本服务并前往正规医疗机构就医。</p>
          <p>4. 请勿仅依据本平台的建议调整药物用量或治疗方案。</p>
          <p>5. 我们致力于保护您的数据隐私，您的健康数据仅在您授权的范围内使用。</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full mt-2">我已知晓</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page Component ---

export default function TopicHealthSystem() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const location = useLocation();
  
  // Analytics mock
  useEffect(() => {
    console.log("Page View: /topic/health-system", { src: new URLSearchParams(window.location.search).get('src') });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white pb-20">
      <TopicHeader />
      <HeroSystemBanner />
      <SystemSteps />
      <CapabilityGrid />
      <TodayRecommendationCard />
      <GrowthDashboard />
      <SampleReports />
      <FAQAccordion />
      <StickyCTABar onOpenDisclaimer={() => setShowDisclaimer(true)} />
      
      <DisclaimerModal open={showDisclaimer} onOpenChange={setShowDisclaimer} />
    </div>
  );
}
