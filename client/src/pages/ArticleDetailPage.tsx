import { useLocation, useParams } from "wouter";
import { ArrowLeft, User, Eye, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockArticles = [
  {
    id: "1",
    title: "最新研究：人工智能在医学影像诊断中的突破性进展",
    summary: "近期，多项研究表明AI技术在医学影像诊断领域取得了重大突破，准确率已接近甚至超过资深医生水平。",
    content: `人工智能技术在医学影像诊断领域的应用正在快速发展，为医疗行业带来革命性的变化。

近期发表在《自然医学》杂志上的一项研究显示，基于深度学习的AI系统在检测肺癌、乳腺癌等多种癌症方面的准确率已经达到了95%以上，在某些特定类型的癌症检测中甚至超过了经验丰富的放射科医生。

这项技术的核心是利用卷积神经网络（CNN）对大量医学影像数据进行训练，使AI系统能够识别出人眼难以察觉的微小病变。研究人员表示，AI辅助诊断不仅可以提高诊断准确率，还能大大缩短诊断时间，让患者更快获得治疗。

然而，专家也指出，AI技术目前仍然是辅助工具，最终的诊断决策仍需要由专业医生做出。未来，人机协作将成为医学影像诊断的主流模式。

该研究的主要作者表示："我们的目标不是取代医生，而是为他们提供更强大的工具，帮助他们做出更准确的诊断，最终让更多患者受益。"`,
    author: "医学前沿",
    views: 12580,
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    title: "健康饮食指南：如何科学搭配每日营养",
    summary: "营养专家为您详解科学饮食的黄金法则，帮助您建立健康的饮食习惯。",
    content: `科学的饮食搭配是维持身体健康的基础。本文将为您详细介绍如何科学搭配每日营养。

一、均衡摄入三大营养素
碳水化合物、蛋白质和脂肪是人体必需的三大营养素。建议每日摄入比例为：碳水化合物50-60%，蛋白质15-20%，脂肪20-30%。

二、多吃蔬菜水果
每天应摄入至少500克蔬菜和200-350克水果。蔬菜水果富含维生素、矿物质和膳食纤维，对维持身体健康至关重要。

三、适量摄入优质蛋白
优质蛋白来源包括：鱼类、禽肉、蛋类、豆制品等。建议每天摄入蛋白质约1克/公斤体重。

四、控制盐和糖的摄入
每日盐摄入量应控制在6克以下，糖摄入量应控制在25克以下。过多的盐和糖会增加高血压、糖尿病等慢性病的风险。

五、保持规律的进餐时间
建议每天三餐定时定量，避免暴饮暴食。早餐要吃好，午餐要吃饱，晚餐要吃少。`,
    author: "营养健康",
    views: 8920,
    createdAt: "2024-01-14"
  },
  {
    id: "3",
    title: "春季养生：中医专家教你如何调理身体",
    summary: "春季是养生的好时节，中医专家分享春季养生的要点和注意事项。",
    content: `春季是万物复苏的季节，也是调理身体的最佳时机。中医认为，春季养生应顺应自然规律，注重养肝护肝。

一、早睡早起，顺应春气
春季应早睡早起，保证充足的睡眠。建议晚上11点前入睡，早上6-7点起床，让身体与自然节律同步。

二、饮食清淡，养肝护肝
春季饮食应以清淡为主，多吃绿色蔬菜如菠菜、芹菜、韭菜等，有助于养肝。同时应减少油腻、辛辣食物的摄入。

三、适度运动，舒展筋骨
春季适合进行户外运动，如散步、慢跑、太极拳等。运动可以促进气血循环，增强体质。

四、调节情志，保持心情舒畅
中医认为"怒伤肝"，春季应保持心情舒畅，避免过度焦虑和愤怒。可以通过听音乐、读书、与朋友交流等方式调节情绪。

五、注意保暖，预防感冒
春季气温变化大，应注意适时增减衣物，预防感冒。特别是早晚温差大时，要注意保暖。`,
    author: "中医养生",
    views: 6750,
    createdAt: "2024-01-13"
  }
];

export default function ArticleDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const articleId = params.id;

  const article = mockArticles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">文章不存在</p>
          <Button onClick={() => setLocation("/home")} data-testid="button-back-home">返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-4 pt-4 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-10" />
        
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setLocation("/home")}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">医学资讯</h1>
        </div>
      </div>

      <div className="px-4 -mt-2 relative z-20 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4 leading-relaxed">
            {article.title}
          </h2>
          
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">{article.author}</span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{article.createdAt}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{article.views.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-gray-500 text-sm mb-4 italic bg-gray-50 p-3 rounded-lg">
              {article.summary}
            </p>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            免责声明
          </h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>1. 本文仅供参考，不构成医疗建议</li>
            <li>2. 如有健康问题，请咨询专业医生</li>
            <li>3. 文章内容来源于网络，版权归原作者所有</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
