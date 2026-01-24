import { ArrowLeft, ChevronRight, HelpCircle, FileText, Shield, Info } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HelpCenterPage() {
  const [, setLocation] = useLocation();

  const menuItems = [
    {
      icon: <Info className="h-5 w-5 text-blue-500" />,
      title: "关于我们",
      desc: "了解我们的平台愿景与故事",
      path: "/about"
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "权利及奖励说明",
      desc: "VIP权益、佣金奖励详细规则",
      path: "/rights"
    },
    {
      icon: <FileText className="h-5 w-5 text-orange-500" />,
      title: "常见问题",
      desc: "解答您在使用过程中遇到的问题",
      path: "/faq" // Can be a static page or just placeholder for now
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/mine")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">帮助中心</h1>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Card 
              key={index} 
              className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => item.path && setLocation(item.path)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-full">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>当前版本 v1.0.0</p>
          <p className="mt-1">© 2024 AI Clone. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
