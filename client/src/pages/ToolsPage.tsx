import { useState } from "react";
import { Header } from "@/components/Header";
import { FeatureCard } from "@/components/FeatureCard";
import { cn } from "@/lib/utils";
import { 
  Stethoscope, FileText, CreditCard, Heart, Pill, FlaskConical, Sparkles, 
  Scale, Brain, Baby, Bone, Eye 
} from "lucide-react";

// Tool Data Definition
export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

export const tools: Tool[] = [
  { id: '1', title: '急诊科门诊', description: '请描述您的健康问题，AI医生将为您做出专业的健康分析和建议！', icon: <Stethoscope className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-blue-500' },
  { id: '2', title: '智能健康体检', description: '评估专业医疗大模型的《AI 智能健康体检报告》', icon: <FileText className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-green-500' },
  { id: '3', title: '医疗保险', description: '医疗报销 / 医保咨询', icon: <CreditCard className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-cyan-500' },
  { id: '4', title: '健康保健', description: '专业AI健康保健建议与提议', icon: <Heart className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-pink-500' },
  { id: '5', title: '西药咨询', description: '针对药物使用与副作用等咨询', icon: <Pill className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-yellow-500' },
  { id: '6', title: '中药疗理', description: 'AI中药保健疗理分析与提议', icon: <FlaskConical className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-emerald-500' },
  { id: '7', title: '算命/运势', description: '八字命理分析您的性格特点、婚姻运势、财运事业', icon: <Sparkles className="w-6 h-6" />, category: '起名/算命', color: 'bg-purple-500' },
  { id: '8', title: '星座查询', description: '分析性格特点、运势趋势、恋爱匹配', icon: <Sparkles className="w-6 h-6" />, category: '起名/算命', color: 'bg-indigo-500' },
  { id: '10', title: '法律咨询', description: '用法律专业知识分析责任、风险、维权方式', icon: <Scale className="w-6 h-6" />, category: '法律', color: 'bg-slate-500' },
  { id: '11', title: '内科问诊', description: '包括呼吸内科、消化内科、心血管内科等医疗问诊', icon: <Brain className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-red-500' },
  { id: '12', title: '智能写作', description: '如新闻/小说/报告/文案', icon: <FileText className="w-6 h-6" />, category: '教育（论文）', color: 'bg-teal-500' },
  { id: '13', title: '妇科问诊', description: '专注女性健康与保养！AI隐私问诊', icon: <Heart className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-rose-500' },
  { id: '14', title: '新生儿童起名', description: '吉利且朗朗上口的名字建议', icon: <Baby className="w-6 h-6" />, category: '起名/算命', color: 'bg-amber-500' },
  { id: '16', title: '外科问诊', description: '外科: 包括普通外科、骨科、神经外科等', icon: <Bone className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gray-500' },
  { id: '19', title: '科研众筹', description: '科研辅助，药物靶点预测、分子模拟', icon: <FlaskConical className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-violet-500' },
  { id: '21', title: '法律风险评估', description: '评估您的行为与法律风险', icon: <Eye className="w-6 h-6" />, category: '法律', color: 'bg-neutral-500' },
];

const categories = ['全部', 'AI 问诊', '法律', '起名/算命', '教育（论文）'];

export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const filteredTools = selectedCategory === '全部' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

  return (
    <div className="pb-24 min-h-screen bg-gray-50/50">
      <Header title="AI 工具箱" showProfile={false} />

      {/* Category Tabs */}
      <div className="sticky top-[60px] z-30 bg-gray-50/95 backdrop-blur-sm px-4 py-3 overflow-x-auto no-scrollbar border-b border-gray-100">
        <div className="flex gap-3 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                selectedCategory === category
                  ? "bg-primary text-white shadow-md shadow-blue-500/25"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-100"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="px-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {filteredTools.map((tool) => (
          <FeatureCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            color={tool.color}
            variant="compact"
          />
        ))}
      </main>
    </div>
  );
}
