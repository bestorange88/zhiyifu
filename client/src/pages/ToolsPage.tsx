import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FeatureCard } from "@/components/FeatureCard";
import { cn } from "@/lib/utils";
import { 
  Stethoscope, FileText, CreditCard, Heart, Pill, FlaskConical, Sparkles, 
  Scale, Brain, Baby, Bone, Eye, Search
} from "lucide-react";

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

export const tools: Tool[] = [
  { id: '1', title: '急诊科门诊', description: '请描述您的健康问题，AI医生将为您做出专业的健康分析和建议！', icon: <Stethoscope className="w-6 h-6" />, category: 'AI 问诊', color: 'gradient-primary' },
  { id: '2', title: '智能健康体检', description: '评估专业医疗大模型的《AI 智能健康体检报告》', icon: <FileText className="w-6 h-6" />, category: 'AI 问诊', color: 'gradient-success' },
  { id: '3', title: '医疗保险', description: '医疗报销 / 医保咨询', icon: <CreditCard className="w-6 h-6" />, category: 'AI 问诊', color: 'gradient-accent' },
  { id: '4', title: '健康保健', description: '专业AI健康保健建议与提议', icon: <Heart className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { id: '5', title: '西药咨询', description: '针对药物使用与副作用等咨询', icon: <Pill className="w-6 h-6" />, category: 'AI 问诊', color: 'gradient-warm' },
  { id: '6', title: '中药疗理', description: 'AI中药保健疗理分析与提议', icon: <FlaskConical className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
  { id: '7', title: '算命/运势', description: '八字命理分析您的性格特点、婚姻运势、财运事业', icon: <Sparkles className="w-6 h-6" />, category: '起名/算命', color: 'gradient-purple' },
  { id: '8', title: '星座查询', description: '分析性格特点、运势趋势、恋爱匹配', icon: <Sparkles className="w-6 h-6" />, category: '起名/算命', color: 'bg-gradient-to-br from-indigo-500 to-violet-500' },
  { id: '10', title: '法律咨询', description: '用法律专业知识分析责任、风险、维权方式', icon: <Scale className="w-6 h-6" />, category: '法律', color: 'bg-gradient-to-br from-slate-600 to-slate-700' },
  { id: '11', title: '内科问诊', description: '包括呼吸内科、消化内科、心血管内科等医疗问诊', icon: <Brain className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gradient-to-br from-red-500 to-rose-600' },
  { id: '12', title: '智能写作', description: '如新闻/小说/报告/文案', icon: <FileText className="w-6 h-6" />, category: '教育（论文）', color: 'bg-gradient-to-br from-teal-500 to-cyan-500' },
  { id: '13', title: '妇科问诊', description: '专注女性健康与保养！AI隐私问诊', icon: <Heart className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gradient-to-br from-rose-400 to-pink-500' },
  { id: '14', title: '新生儿童起名', description: '吉利且朗朗上口的名字建议', icon: <Baby className="w-6 h-6" />, category: '起名/算命', color: 'bg-gradient-to-br from-amber-500 to-orange-500' },
  { id: '16', title: '外科问诊', description: '外科: 包括普通外科、骨科、神经外科等', icon: <Bone className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gradient-to-br from-gray-600 to-gray-700' },
  { id: '19', title: '科研众筹', description: '科研辅助，药物靶点预测、分子模拟', icon: <FlaskConical className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gradient-to-br from-violet-500 to-purple-600' },
  { id: '21', title: '法律风险评估', description: '评估您的行为与法律风险', icon: <Eye className="w-6 h-6" />, category: '法律', color: 'bg-gradient-to-br from-neutral-600 to-neutral-700' },
];

const categories = ['全部', 'AI 问诊', '法律', '起名/算命', '教育（论文）'];

export default function ToolsPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === '全部' || tool.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToolClick = (toolId: string) => {
    setLocation(`/tools/${toolId}`);
  };

  return (
    <div className="page-container">
      <Header title="AI 工具箱" showProfile={false} />

      <div className="px-4 mt-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工具..."
            className="input-modern pl-10"
            data-testid="input-search-tools"
          />
        </div>
      </div>

      <div className="sticky top-[60px] z-30 px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                selectedCategory === category
                  ? "gradient-primary text-white shadow-lg"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
              )}
              data-testid={`button-category-${category}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredTools.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">未找到相关工具</p>
          </div>
        ) : (
          filteredTools.map((tool) => (
            <FeatureCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              color={tool.color}
              variant="compact"
              onClick={() => handleToolClick(tool.id)}
            />
          ))
        )}
      </main>
    </div>
  );
}
