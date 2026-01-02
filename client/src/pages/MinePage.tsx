import { User, Gift, Share2, Crown, ChevronRight, Settings, Wallet } from "lucide-react";
import React from "react";

const benefits = [
  { title: '转盘奖励', description: '资助贡献值', action: '去抽奖' },
  { title: '分佣奖励', description: '申请代理', action: '去开通' },
  { title: '邀请好友', description: '无限福利', action: '去邀请' },
  { title: '月卡季卡', description: 'AI会员套餐', action: '立即开通' },
];

export default function MinePage() {
  return (
    <div className="pb-24 min-h-screen bg-gray-50/50">
      {/* Header Profile Section */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-6 pt-8 pb-20 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex items-center justify-between relative z-10 mb-8">
          <h1 className="font-bold text-xl text-white">我的</h1>
          <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="text-white">
            <h3 className="font-bold text-lg">点击登录/注册</h3>
            <p className="text-sm opacity-80 mt-1">登录体验更多功能</p>
          </div>
        </div>
      </div>

      {/* VIP Card - Overlapping */}
      <div className="mx-4 -mt-12 relative z-20">
        <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-2xl p-4 shadow-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-amber-800 font-bold block">VIP医疗守护金</span>
                <span className="text-[10px] text-amber-600 font-medium bg-amber-200/50 px-1.5 py-0.5 rounded">新年特惠</span>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-full shadow-md transition-colors">
              立即查看
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary mb-2">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">0</p>
            <p className="text-xs text-gray-500 font-medium">我的积分</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-2">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">0.00 <span className="text-sm font-normal text-gray-400">¥</span></p>
            <p className="text-xs text-gray-500 font-medium">账户余额</p>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="px-4 mt-6">
        <h3 className="font-bold text-gray-800 mb-4 px-1">福利中心</h3>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{benefit.title}</h4>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{benefit.description}</p>
                <span className="text-[10px] text-primary font-medium mt-1 inline-block">{benefit.action} &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Section */}
      <div className="px-4 mt-6">
        <h3 className="font-bold text-gray-800 mb-4 px-1">每日任务</h3>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Share2 className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">暂无任务</p>
          <p className="text-xs text-gray-300 mt-1">敬请期待更多精彩活动</p>
        </div>
      </div>
    </div>
  );
}
