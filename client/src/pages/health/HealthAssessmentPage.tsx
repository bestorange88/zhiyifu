import { useLocation } from "wouter";
import { ArrowLeft, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const riskFactors = [
  { name: "心血管风险", score: 15, level: "低", color: "bg-green-500" },
  { name: "代谢综合征", score: 25, level: "低", color: "bg-green-500" },
  { name: "睡眠障碍", score: 35, level: "中低", color: "bg-yellow-500" },
  { name: "压力指数", score: 45, level: "中", color: "bg-orange-500" },
];

export default function HealthAssessmentPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => setLocation("/home")} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg">智能健康评估</h1>
          <div className="w-9" />
        </div>
      </div>

      <main className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">AI健康风险预测</h2>
          <p className="text-sm text-gray-500">基于大数据的智能健康评估</p>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">综合健康评分</p>
                <p className="text-4xl font-bold">85</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">健康等级</p>
                <p className="text-xl font-semibold">良好</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>较上月提升 3 分</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">风险因素分析</h3>
          {riskFactors.map((factor, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    factor.level === "低" ? "bg-green-100 text-green-600" :
                    factor.level === "中低" ? "bg-yellow-100 text-yellow-600" :
                    "bg-orange-100 text-orange-600"
                  }`}>
                    {factor.level}风险
                  </span>
                </div>
                <Progress value={factor.score} className="h-2" />
                <p className="text-xs text-gray-400 mt-1">{factor.score}%</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-md bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-800">AI评估建议</h4>
                <p className="text-sm text-gray-600 mt-1">
                  您的整体健康状况良好。建议关注睡眠质量和压力管理，适当增加运动量，保持均衡饮食。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          onClick={() => setLocation("/tools/2")}
        >
          获取详细评估报告
        </Button>
      </main>
    </div>
  );
}
