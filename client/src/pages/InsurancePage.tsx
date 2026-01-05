import { useLocation } from "wouter";
import { ArrowLeft, Shield, Heart, Clock, Users, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InsurancePage() {
  const [, setLocation] = useLocation();

  const benefits = [
    { icon: Shield, title: "全面保障", desc: "覆盖门诊、住院、手术等多种医疗场景" },
    { icon: Heart, title: "健康管理", desc: "提供AI健康咨询，预防疾病风险" },
    { icon: Clock, title: "快速理赔", desc: "线上提交资料，快速审核处理" },
    { icon: Users, title: "家庭共享", desc: "支持家庭成员共同参保享受保障" },
  ];

  const plans = [
    { 
      name: "基础版", 
      price: "198", 
      period: "年",
      features: ["门诊报销50%", "住院报销70%", "年度限额5万", "AI问诊无限次"],
      popular: false
    },
    { 
      name: "标准版", 
      price: "398", 
      period: "年",
      features: ["门诊报销70%", "住院报销85%", "年度限额15万", "AI问诊+专家咨询", "重疾绿通服务"],
      popular: true
    },
    { 
      name: "尊享版", 
      price: "698", 
      period: "年",
      features: ["门诊报销90%", "住院报销100%", "年度限额50万", "VIP专属服务", "全国三甲医院直付"],
      popular: false
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2 p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">全民新医保</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="relative bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-6 pb-12">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative">
          <h2 className="text-2xl font-bold mb-2">云智医服·全民新医保</h2>
          <p className="text-white/90 text-sm mb-4">五年看病无忧，全家健康守护</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              已服务10万+用户
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              理赔率99.8%
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">产品特色</h3>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((item, index) => (
              <div key={index} className="flex items-start gap-2 p-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">选择保障方案</h3>
        <div className="space-y-3 mb-6">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-4 relative ${plan.popular ? 'border-2 border-teal-500' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-2 right-4 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
                  推荐
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">¥{plan.price}</span>
                    <span className="text-sm text-gray-500">/{plan.period}</span>
                  </div>
                </div>
                <Button 
                  variant={plan.popular ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocation("/tools/1")}
                  data-testid={`button-select-plan-${index}`}
                >
                  立即咨询
                </Button>
              </div>
              <div className="space-y-1">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-3 h-3 text-teal-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">常见问题</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Q: 如何参保？</p>
              <p className="text-gray-500 dark:text-gray-400">A: 选择方案后，可通过AI客服咨询详情，或直接联系人工客服办理。</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Q: 理赔流程是什么？</p>
              <p className="text-gray-500 dark:text-gray-400">A: 就医后上传相关票据，3个工作日内完成审核并打款。</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Q: 可以为家人投保吗？</p>
              <p className="text-gray-500 dark:text-gray-400">A: 可以，支持为配偶、子女、父母投保，享受家庭优惠。</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setLocation("/tools/1")}
            data-testid="button-ai-consult"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            AI咨询
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500"
            onClick={() => setLocation("/service")}
            data-testid="button-contact-service"
          >
            <Phone className="w-4 h-4 mr-2" />
            联系客服
          </Button>
        </div>
      </div>
    </div>
  );
}
