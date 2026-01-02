import { useState } from 'react'
import './App.css'
import { Home, Wrench, MessageCircle, Headphones, User, Volume2, ChevronRight, Gift, CreditCard, Stethoscope, Pill, FlaskConical, Scale, Baby, FileText, Sparkles, Heart, Brain, Eye, Bone } from 'lucide-react'

type TabType = 'home' | 'tools' | 'chat' | 'service' | 'mine'

interface Tool {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: string
  color: string
}

interface Article {
  id: string
  title: string
  summary: string
  author: string
  views: number
  image?: string
}

const tools: Tool[] = [
  { id: '1', title: '急诊科门诊', description: '请描述您的健康问题，AI医生将为您做出专业的健康分析和建议！', icon: <Stethoscope className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-blue-500' },
  { id: '2', title: '智能健康体检报告', description: '365智慧问诊给你评估一份专业医疗大模型的《AI 智能健康体检报告》', icon: <FileText className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-green-500' },
  { id: '3', title: '医疗保险', description: '医疗报销 / 医保咨询', icon: <CreditCard className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-cyan-500' },
  { id: '4', title: '健康保健', description: '专业AI健康保健建议与提议', icon: <Heart className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-pink-500' },
  { id: '5', title: '西药咨询', description: '针对药物使用与副作用等咨询', icon: <Pill className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-yellow-500' },
  { id: '6', title: '中药疗理', description: 'AI中药保健疗理分析与提议', icon: <FlaskConical className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-emerald-500' },
  { id: '7', title: '算命/运势', description: '八字命理分析您的性格特点、婚姻运势、财运事业、健康状况', icon: <Sparkles className="w-6 h-6" />, category: '起名/算命', color: 'bg-purple-500' },
  { id: '8', title: '星座查询', description: '分析性格特点、运势趋势、恋爱匹配和健康提醒', icon: <Sparkles className="w-6 h-6" />, category: '起名/算命', color: 'bg-indigo-500' },
  { id: '9', title: '发朋友圈文案', description: '适合朋友圈发布的文案', icon: <FileText className="w-6 h-6" />, category: '教育（论文）', color: 'bg-orange-500' },
  { id: '10', title: '法律咨询', description: '用法律专业知识分析责任、风险、维权方式或起草相关文书', icon: <Scale className="w-6 h-6" />, category: '法律', color: 'bg-slate-500' },
  { id: '11', title: '内科问诊', description: '包括呼吸内科、消化内科、心血管内科、神经内科、内分泌科、血液科、肿瘤科等医疗问诊', icon: <Brain className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-red-500' },
  { id: '12', title: '智能写作', description: '如新闻/小说/报告/文案', icon: <FileText className="w-6 h-6" />, category: '教育（论文）', color: 'bg-teal-500' },
  { id: '13', title: '妇科问诊', description: '专注女性健康与保养！AI隐私问诊', icon: <Heart className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-rose-500' },
  { id: '14', title: '新生儿童起名', description: '吉利且朗朗上口的名字建议', icon: <Baby className="w-6 h-6" />, category: '起名/算命', color: 'bg-amber-500' },
  { id: '15', title: '周工作报告', description: '输入您本周工作进度生产高效工作报表', icon: <FileText className="w-6 h-6" />, category: '教育（论文）', color: 'bg-blue-600' },
  { id: '16', title: '外科问诊', description: '外科: 包括普通外科、骨科、神经外科、泌尿外科等。', icon: <Bone className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-gray-500' },
  { id: '17', title: '合同/协议起草', description: '合同/协议起草', icon: <FileText className="w-6 h-6" />, category: '法律', color: 'bg-stone-500' },
  { id: '18', title: '起诉状/答辩状', description: '起诉状/答辩状', icon: <Scale className="w-6 h-6" />, category: '法律', color: 'bg-zinc-500' },
  { id: '19', title: '科研众筹', description: '科研辅助，药物靶点预测、分子模拟、科研资讯、技术分析', icon: <FlaskConical className="w-6 h-6" />, category: 'AI 问诊', color: 'bg-violet-500' },
  { id: '20', title: '论文选题建议', description: '论文选题建议，研究方法及可行的创新点', icon: <FileText className="w-6 h-6" />, category: '教育（论文）', color: 'bg-fuchsia-500' },
  { id: '21', title: '法律风险评估', description: '评估您的行为与法律风险', icon: <Eye className="w-6 h-6" />, category: '法律', color: 'bg-neutral-500' },
]

const articles: Article[] = [
  { id: '1', title: '急诊决策 "人机对决"！新研究揭示，生成式 AI 准确性碾压？但过度推荐住院暴露关键局限', summary: '本研究揭示了急诊护士与生成式人工智能模型在临床决策上的关键差异，凸显了AI驱动决策支持在护理实践中的优势与局限。', author: '客服-晨晨', views: 15953 },
  { id: '2', title: '人工智能 (AI) 和医疗保健行业', summary: '人工智能 (AI) 正在改变医疗保健行业，彻底改变了提供护理服务、进行研究和处理管理任务的方式。AI 能够处理海量数据、自动执行任务和提供数据洞见，有望为医疗保健行业带来显著好处。', author: '客服-晨晨', views: 2364 },
  { id: '3', title: 'AI辅助术后营养指导的指南依从性评估，以胃袖状切除术为例的人工智能生成饮食方案对比', summary: '这项研究评估三种AI模型生成的术后饮食方案与ASMBS及AACE/TOS指南的依从性，指出AI辅助方案的潜力与局限。', author: '晨曦', views: 4562 },
  { id: '4', title: '社交辅助机器人对痴呆症患者非正式照顾者的心理社会影响', summary: '社交辅助机器人对痴呆症患者的非正式照顾者没有显著的心理社会影响。质性研究结果显示了参与者的积极态度，但也强调了"Coach Pepper"的可用性需改进。', author: '晨曦', views: 1256 },
  { id: '5', title: '25 年队列研究显示，hs-cTnI 轻微升高显著预测痴呆风险，水平翻倍风险增 11%', summary: '高敏肌钙蛋白，这一心脏损伤的"哨兵"，意外地成为了窥探大脑未来健康的"窗口"。', author: '晨曦', views: 887 },
  { id: '6', title: '【协和医学杂志】全球不同地区成人头颈部肿瘤流行现状及时间趋势研究', summary: '本研究基于GLOBOCAN 2022数据库和全球疾病负担2021数据库，分析了不同性别、年龄、地区和人类发展指数等因素下的成人头颈部肿瘤发病和死亡情况，并对其发病趋势进行预测。', author: '客服-晨晨', views: 2662 },
]

const categories = ['全部', 'AI 问诊', '法律', '起名/算命', '教育（论文）']

function HomePage() {
  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">365</span>
          </div>
          <span className="font-semibold text-gray-800">365智慧问诊</span>
        </div>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="mx-4 mt-3 bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
        <Volume2 className="w-4 h-4 text-blue-500" />
        <div className="flex-1 overflow-hidden">
          <p className="text-sm text-gray-600 whitespace-nowrap animate-marquee">
            24小时AI智能问诊上线！门诊不排队。身体不舒服？不用慌！AI 问诊帮你随时查症状、给建议！
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {/* Main Feature Card */}
        <div className="col-span-1 row-span-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 text-white">
          <h3 className="font-bold text-lg">全民新医保</h3>
          <p className="text-sm opacity-90 mt-1">五年看病无忧</p>
          <div className="mt-4 flex justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8" />
            </div>
          </div>
          <button className="mt-4 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-4 py-2 text-sm w-full">
            立即体验
          </button>
        </div>

        {/* AI Drawing Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">AI绘图</h3>
              <p className="text-xs text-gray-500 mt-1">专家级绘画,一键生成,想你所想...</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* AI Checkup & Work Report */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-3 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <Stethoscope className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm">AI体检</h4>
            <p className="text-xs opacity-90">智能体检报告</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl p-3 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-sm">工作周报</h4>
            <p className="text-xs opacity-90">快捷高效</p>
          </div>
        </div>
      </div>

      {/* Hot Templates */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-gray-800 mb-3">热门模板</h2>
        <div className="grid grid-cols-2 gap-3">
          {tools.slice(0, 6).map((tool) => (
            <div key={tool.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${tool.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                {tool.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm">{tool.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Medical News */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">医学资讯（科研杂志）</h2>
          <button className="text-sm text-blue-500 flex items-center gap-1">
            更多 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-800 text-sm line-clamp-2">{article.title}</h4>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{article.summary}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-blue-500" />
                  </div>
                  <span>{article.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{article.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const filteredTools = selectedCategory === '全部' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory)

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-10">
        <h1 className="font-semibold text-gray-800 text-center">365智慧问诊</h1>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-1 py-1 text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'text-blue-500 font-semibold border-b-2 border-blue-500'
                  : 'text-gray-500'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filteredTools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${tool.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                {tool.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm">{tool.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tool.description}</p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatPage() {
  const [message, setMessage] = useState('')

  return (
    <div className="pb-20 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-10">
        <h1 className="font-semibold text-gray-800 text-center">对话</h1>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">365智慧问诊AI助手</h2>
          <p className="text-sm text-gray-400 mb-4">https://www.365zhmz.love/h5/</p>
          <p className="text-gray-500">您还没有对话，快去开启新的对话吧~</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="问365智慧问诊AI助手"
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
          <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ServicePage() {
  const faqItems = [
    { icon: <User className="w-5 h-5" />, title: '账户问题', description: '账户登录、注册相关问题' },
    { icon: <CreditCard className="w-5 h-5" />, title: '充值问题', description: '充值不到账、金额错误' },
    { icon: <FlaskConical className="w-5 h-5" />, title: '研发资助', description: '药物研发资助、收益计算' },
    { icon: <FileText className="w-5 h-5" />, title: '操作指南', description: '平台使用教程' },
  ]

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-10 flex items-center">
        <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
        <h1 className="font-semibold text-gray-800 text-center flex-1">客服中心</h1>
      </div>

      {/* Welcome Card */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">您好, 亲爱的用户</h3>
            <p className="text-sm opacity-90">欢迎来到客服中心</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm">客服在线</span>
        </div>
      </div>

      {/* Service Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Headphones className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-gray-800">客服服务</h2>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">福利社区</h4>
              <p className="text-xs text-gray-500">专业客服团队</p>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <span className="px-2 py-1 bg-blue-50 text-blue-500 text-xs rounded">快速响应</span>
            <span className="px-2 py-1 bg-blue-50 text-blue-500 text-xs rounded">专业解答</span>
          </div>
          <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl py-3 flex items-center justify-center gap-2">
            <span>立即联系</span>
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">24小时在线客服</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-800">常见问题</h2>
        </div>
        
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                {item.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MinePage() {
  const benefits = [
    { title: '转盘奖励', description: '资助贡献值', action: '去抽奖' },
    { title: '分佣奖励', description: '申请代理', action: '去开通' },
    { title: '邀请好友', description: '无限福利', action: '去邀请' },
    { title: '月卡季卡', description: 'AI会员套餐', action: '立即开通' },
  ]

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-400 to-blue-500 px-4 pt-4 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-white">我的</h1>
          <button className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
            邀请链接
          </button>
        </div>
        
        <div className="mt-4 flex items-center gap-3">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="text-white">
            <h3 className="font-bold text-lg">未登录</h3>
          </div>
        </div>
      </div>

      {/* VIP Card */}
      <div className="mx-4 -mt-12 bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-amber-600 font-semibold">VIP医疗守护金</span>
            <p className="text-xs text-amber-500 mt-1">新年首购0元享，下拉查看详情</p>
          </div>
          <button className="px-3 py-1 bg-white rounded-full text-amber-600 text-sm border border-amber-200">
            申请报销
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500">我的积分 &gt;</p>
            </div>
            <button className="px-3 py-1 bg-red-500 text-white text-xs rounded-full">
              兑换积分
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">0 ¥</p>
              <p className="text-xs text-gray-500">现金收益提现</p>
            </div>
            <button className="px-3 py-1 bg-red-500 text-white text-xs rounded-full">
              充值
            </button>
          </div>
        </div>
      </div>

      {/* Sign In */}
      <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">连续签到送现金</span>
          </div>
          <button className="text-sm text-blue-500">查看全部奖励 &gt;</button>
        </div>
        <button className="mt-3 w-full py-2 bg-gray-100 rounded-lg text-gray-500 text-sm">
          查看全部签到
        </button>
      </div>

      {/* Benefits */}
      <div className="px-4 mt-4">
        <h3 className="font-semibold text-gray-800 mb-3">待领取福利</h3>
        <div className="grid grid-cols-4 gap-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <h4 className="font-semibold text-gray-800 text-xs">{benefit.title}</h4>
              <p className="text-xs text-gray-400 mt-1">{benefit.description}</p>
              <button className="mt-2 px-2 py-1 border border-blue-500 text-blue-500 text-xs rounded-full">
                {benefit.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="px-4 mt-4">
        <h3 className="font-semibold text-gray-800 mb-3">做任务，赚奖励</h3>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-center text-gray-400 text-sm">暂无任务</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home')

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />
      case 'tools':
        return <ToolsPage />
      case 'chat':
        return <ChatPage />
      case 'service':
        return <ServicePage />
      case 'mine':
        return <MinePage />
      default:
        return <HomePage />
    }
  }

  const tabs = [
    { id: 'home' as TabType, label: '首页', icon: Home },
    { id: 'tools' as TabType, label: '工具', icon: Wrench },
    { id: 'chat' as TabType, label: '会话', icon: MessageCircle },
    { id: 'service' as TabType, label: '客服', icon: Headphones },
    { id: 'mine' as TabType, label: '我的', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* Page Content */}
      <div className="max-w-md mx-auto bg-gradient-to-b from-blue-50/50 to-white min-h-screen">
        {renderPage()}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 z-50">
          <div className="max-w-md mx-auto flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                    isActive ? 'text-blue-500' : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
