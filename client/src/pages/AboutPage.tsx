import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/help")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">关于我们</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600 leading-relaxed space-y-4">
            <p>
              欢迎来到我们的AI数字人克隆平台。我们致力于为用户提供最前沿的人工智能技术，让每个人都能轻松创建属于自己的数字分身。
            </p>
            <p>
              我们的团队由来自全球的顶尖AI工程师和产品专家组成，拥有深厚的技术积累和丰富的行业经验。我们坚信，技术应该服务于人，让生活更美好。
            </p>
            <p>
              在这里，您可以体验到：
              <br/>• 极速克隆：只需少量数据，即可生成逼真的数字人。
              <br/>• 智能交互：具备高度智能的对话能力。
              <br/>• 多样化应用：适用于直播、客服、教育等多种场景。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
