import { useLocation } from "wouter";
import { ArrowLeft, Activity, Heart, Thermometer, Droplets, Moon, Footprints } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const healthMetrics = [
  { icon: Heart, label: "心率", value: "72", unit: "bpm", status: "正常", color: "text-red-500" },
  { icon: Droplets, label: "血氧", value: "98", unit: "%", status: "正常", color: "text-blue-500" },
  { icon: Thermometer, label: "体温", value: "36.5", unit: "°C", status: "正常", color: "text-orange-500" },
  { icon: Activity, label: "血压", value: "120/80", unit: "mmHg", status: "正常", color: "text-purple-500" },
  { icon: Moon, label: "睡眠", value: "7.5", unit: "小时", status: "良好", color: "text-indigo-500" },
  { icon: Footprints, label: "步数", value: "8,234", unit: "步", status: "达标", color: "text-green-500" },
];

export default function HealthMonitorPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => setLocation("/home")} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg">AI健康监测</h1>
          <div className="w-9" />
        </div>
      </div>

      <main className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">实时健康数据追踪</h2>
          <p className="text-sm text-gray-500">AI智能分析您的身体状态</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {healthMetrics.map((metric, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  <span className="text-sm text-gray-600">{metric.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-800">{metric.value}</span>
                  <span className="text-xs text-gray-400">{metric.unit}</span>
                </div>
                <div className="mt-1">
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                    {metric.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">AI健康建议</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. 您的心率和血压都在正常范围内，继续保持良好的生活习惯。</p>
              <p>2. 建议每天保持7-8小时的睡眠时间，有助于身体恢复。</p>
              <p>3. 今日步数已达标，适当运动有益健康。</p>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
          onClick={() => setLocation("/tools/1")}
        >
          开始AI健康咨询
        </Button>
      </main>
    </div>
  );
}
