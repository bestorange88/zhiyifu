import { useLocation } from "wouter";
import { ArrowLeft, MessageSquare, Bot, Clock, Star, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickQuestions = [
  "我最近总是感觉疲劳，是什么原因？",
  "如何改善睡眠质量？",
  "健康饮食应该注意什么？",
  "如何缓解工作压力？",
  "运动后肌肉酸痛怎么办？",
  "如何预防感冒？",
];

const features = [
  { icon: Clock, title: "7x24小时", desc: "全天候在线服务" },
  { icon: Bot, title: "AI智能", desc: "专业医学知识库" },
  { icon: Star, title: "个性化", desc: "定制健康方案" },
];

export default function HealthAssistantPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => setLocation("/home")} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg">AI健康咨询</h1>
          <div className="w-9" />
        </div>
      </div>

      <main className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">7x24健康问答</h2>
          <p className="text-sm text-gray-500">随时随地获取专业健康建议</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-3 text-center">
                <feature.icon className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                <p className="text-sm font-medium text-gray-800">{feature.title}</p>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">常见问题</h3>
          {quickQuestions.map((question, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation("/tools/1")}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm text-gray-700">{question}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bot className="w-10 h-10" />
              <div>
                <h4 className="font-semibold">AI健康助手</h4>
                <p className="text-sm opacity-90">有任何健康问题，随时向我咨询</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          onClick={() => setLocation("/tools/1")}
        >
          开始AI健康咨询
        </Button>
      </main>
    </div>
  );
}
