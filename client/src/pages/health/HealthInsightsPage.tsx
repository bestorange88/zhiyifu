import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const insights = [
  { 
    title: "运动量趋势", 
    trend: "up", 
    change: "+15%", 
    description: "本周运动量较上周增加，继续保持！",
    color: "text-green-500"
  },
  { 
    title: "睡眠质量", 
    trend: "down", 
    change: "-8%", 
    description: "睡眠质量有所下降，建议调整作息时间",
    color: "text-red-500"
  },
  { 
    title: "饮食均衡度", 
    trend: "stable", 
    change: "0%", 
    description: "饮食结构稳定，建议增加蔬果摄入",
    color: "text-gray-500"
  },
  { 
    title: "心理健康", 
    trend: "up", 
    change: "+5%", 
    description: "情绪状态良好，压力水平正常",
    color: "text-green-500"
  },
];

const recommendations = [
  "每天保持30分钟中等强度运动",
  "晚上10点前入睡，保证7-8小时睡眠",
  "每餐增加一份蔬菜或水果",
  "每周进行2-3次放松活动",
];

export default function HealthInsightsPage() {
  const [, setLocation] = useLocation();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4" />;
      case "down": return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => setLocation("/home")} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg">健康数据分析</h1>
          <div className="w-9" />
        </div>
      </div>

      <main className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">个性化健康建议</h2>
          <p className="text-sm text-gray-500">基于您的数据生成专属报告</p>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">健康趋势分析</h3>
          {insights.map((insight, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{insight.title}</span>
                      <span className={`flex items-center gap-1 text-sm ${insight.color}`}>
                        {getTrendIcon(insight.trend)}
                        {insight.change}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-800">AI个性化建议</h3>
            </div>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={() => setLocation("/tools/2")}
        >
          生成完整健康报告
        </Button>
      </main>
    </div>
  );
}
