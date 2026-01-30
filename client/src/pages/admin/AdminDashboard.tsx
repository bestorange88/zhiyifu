import AdminLayout from "./AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, CreditCard, ShoppingBag, BarChart3, Crown, Wallet, Clock, ChevronRight, Check, X,
  Activity, Zap, DollarSign, ArrowUpRight, Scale, AlertCircle, Share2, Gift, Dice5, Trophy, Percent, BadgePercent
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime, formatDate } from "@/lib/utils";

interface DashboardStats {
  // 1. Users
  totalUsers: number;
  todayUsers: number;
  
  // 2. Active
  activeToday: number;
  onlineCurrent: number;
  
  // 3. VIP
  vipUsers: number;
  vipToday: number;
  vipCounts: Record<string, number>;
  vipTodayCounts: Record<string, number>;

  // 4. Revenue
  totalRevenue: string;
  todayRevenue: string;
  totalDepositCount: number;
  todayDepositCount: number;
  
  // 5. Withdrawals
  totalWithdraw: string;
  todayWithdraw: string;
  totalWithdrawCount: number;
  todayWithdrawCount: number;
  
  // 6. Net
  netTotal: string;
  netToday: string;
  
  // 7. Pending
  pendingDeposits: number;
  pendingWithdraws: number;
  pendingKyc: number;
  
  // 8. Referral
  totalReferralRewards: string;
  todayReferralRewards: string;
  totalReferralCount: number;
  todayReferralCount: number;
  
  // 9. Lottery Wins
  totalLotteryWins: string;
  todayLotteryWins: string;
  totalSpins: number;
  todaySpins: number;
  
  // 10. Lottery Comm
  totalLotteryCommissions: string;
  todayLotteryCommissions: string;
  totalLotteryCommissionCount: number;
  todayLotteryCommissionCount: number;
  
  recentUsers: any[];
  recentWithdraws: any[];
}

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { admin, token } = useAdminAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    enabled: !!token,
  });

  const StatCard = ({ title, icon: Icon, color, children, onClick }: any) => (
    <div 
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-purple-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {children}
    </div>
  );

  const formatMoney = (amount: string | number) => {
    return `¥${parseFloat(amount?.toString() || "0").toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AdminLayout title="仪表盘">
      <div className="bg-transparent space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <>
            {/* Top Stats Grid - 10 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              
              {/* 1. Total Users */}
              <StatCard 
                title="总用户数" 
                icon={Users} 
                color="bg-blue-500"
                onClick={() => setLocation("/admin/users")}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold text-gray-800">{stats?.totalUsers || 0}</span>
                    <span className="text-xs text-gray-500">总数</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-green-600 font-medium">+{stats?.todayUsers || 0}</span>
                    <span className="text-gray-400">今日新增</span>
                  </div>
                </div>
              </StatCard>

              {/* 2. Active Users */}
              <StatCard title="活跃用户" icon={Activity} color="bg-emerald-500">
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold text-gray-800">{stats?.activeToday || 0}</span>
                    <span className="text-xs text-gray-500">今日活跃</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-600 font-medium">{stats?.onlineCurrent || 0}</span>
                    <span className="text-gray-400">当前在线</span>
                  </div>
                </div>
              </StatCard>

              {/* 3. VIP Members (With Tooltip) */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-full"> {/* Wrap for tooltip trigger */}
                      <StatCard title="VIP会员" icon={Crown} color="bg-amber-500">
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold text-gray-800">{stats?.vipUsers || 0}</span>
                            <span className="text-xs text-gray-500">VIP总数</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-amber-600 font-medium">+{stats?.vipToday || 0}</span>
                            <span className="text-gray-400">今日新增</span>
                          </div>
                        </div>
                      </StatCard>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white p-3 border shadow-lg rounded-lg">
                    <div className="text-xs space-y-2 min-w-[150px]">
                      <p className="font-bold text-gray-700 border-b pb-1 mb-1">VIP详情 (总数 / 今日)</p>
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level} className="flex justify-between">
                          <span className="text-gray-600">VIP{level}:</span>
                          <span className="font-medium">
                            {stats?.vipCounts?.[`v${level}`] || 0} 
                            <span className="text-amber-500 ml-1">
                              (+{stats?.vipTodayCounts?.[`v${level}`] || 0})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* 4. Total Revenue */}
              <StatCard 
                title="总收入" 
                icon={Wallet} 
                color="bg-violet-500"
                onClick={() => setLocation("/admin/finance")} // Assuming finance page exists or deposits
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-800">{formatMoney(stats?.totalRevenue || "0")}</span>
                    <span className="text-xs text-gray-500">{stats?.totalDepositCount || 0}笔</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-violet-600 font-medium">{formatMoney(stats?.todayRevenue || "0")}</span>
                    <span className="text-gray-400">今日({stats?.todayDepositCount || 0}笔)</span>
                  </div>
                </div>
              </StatCard>

              {/* 5. Total Withdrawals */}
              <StatCard 
                title="总提款" 
                icon={CreditCard} 
                color="bg-rose-500"
                onClick={() => setLocation("/admin/withdraws")}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-800">{formatMoney(stats?.totalWithdraw || "0")}</span>
                    <span className="text-xs text-gray-500">{stats?.totalWithdrawCount || 0}笔</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-rose-600 font-medium">{formatMoney(stats?.todayWithdraw || "0")}</span>
                    <span className="text-gray-400">今日({stats?.todayWithdrawCount || 0}笔)</span>
                  </div>
                </div>
              </StatCard>

              {/* 6. Net Difference */}
              <StatCard title="存取差" icon={Scale} color="bg-cyan-500">
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className={`text-lg font-bold ${parseFloat(stats?.netTotal || "0") >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoney(stats?.netTotal || "0")}
                    </span>
                    <span className="text-xs text-gray-500">总存取差</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium ${parseFloat(stats?.netToday || "0") >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoney(stats?.netToday || "0")}
                    </span>
                    <span className="text-gray-400">今日存取差</span>
                  </div>
                </div>
              </StatCard>

              {/* 7. Pending Actions */}
              <StatCard title="待处理事项" icon={AlertCircle} color="bg-orange-500">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center cursor-pointer hover:text-orange-600" onClick={(e) => { e.stopPropagation(); setLocation("/admin/deposits"); }}>
                    <span className="text-gray-600">待处理充值:</span>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{stats?.pendingDeposits || 0}</span>
                  </div>
                  <div className="flex justify-between items-center cursor-pointer hover:text-orange-600" onClick={(e) => { e.stopPropagation(); setLocation("/admin/withdraws"); }}>
                    <span className="text-gray-600">待处理提款:</span>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{stats?.pendingWithdraws || 0}</span>
                  </div>
                  <div className="flex justify-between items-center cursor-pointer hover:text-orange-600" onClick={(e) => { e.stopPropagation(); setLocation("/admin/kyc"); }}> {/* Assuming KYC page */}
                    <span className="text-gray-600">待处理实名:</span>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{stats?.pendingKyc || 0}</span>
                  </div>
                </div>
              </StatCard>

              {/* 8. Referral Rewards */}
              <StatCard title="邀请奖励" icon={Share2} color="bg-indigo-500">
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-800">{formatMoney(stats?.totalReferralRewards || "0")}</span>
                    <span className="text-xs text-gray-500">{stats?.totalReferralCount || 0}笔</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-indigo-600 font-medium">{formatMoney(stats?.todayReferralRewards || "0")}</span>
                    <span className="text-gray-400">今日({stats?.todayReferralCount || 0}笔)</span>
                  </div>
                </div>
              </StatCard>

              {/* 9. Lottery Wins */}
              <StatCard title="转盘中奖" icon={Gift} color="bg-pink-500">
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-800">{formatMoney(stats?.totalLotteryWins || "0")}</span>
                    <span className="text-xs text-gray-500">{stats?.totalSpins || 0}次</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-pink-600 font-medium">{formatMoney(stats?.todayLotteryWins || "0")}</span>
                    <span className="text-gray-400">今日({stats?.todaySpins || 0}次)</span>
                  </div>
                </div>
              </StatCard>

              {/* 10. Lottery Commissions */}
              <StatCard title="转盘返佣" icon={BadgePercent} color="bg-teal-500">
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-800">{formatMoney(stats?.totalLotteryCommissions || "0")}</span>
                    <span className="text-xs text-gray-500">{stats?.totalLotteryCommissionCount || 0}笔</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-teal-600 font-medium">{formatMoney(stats?.todayLotteryCommissions || "0")}</span>
                    <span className="text-gray-400">今日({stats?.todayLotteryCommissionCount || 0}笔)</span>
                  </div>
                </div>
              </StatCard>

            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">最近注册用户</h3>
                  <button 
                    onClick={() => setLocation("/admin/users")}
                    className="text-sm text-purple-600 flex items-center gap-1 hover:underline"
                  >
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y">
                  {stats?.recentUsers?.map((user: any) => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.phone}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">邀请码: {user.inviteCode}</span>
                            {user.vipLevel > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-600 px-1.5 rounded">VIP{user.vipLevel}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(user.createdAt)}
                      </span>
                    </div>
                  ))}
                  {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                    <div className="p-8 text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>暂无用户</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">最近提现申请</h3>
                  <button 
                    onClick={() => setLocation("/admin/withdraws")}
                    className="text-sm text-purple-600 flex items-center gap-1 hover:underline"
                  >
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y">
                  {stats?.recentWithdraws?.map((w: any) => (
                    <div key={w.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          w.status === "applied" ? "bg-orange-100" : 
                          w.status === "approved" ? "bg-green-100" : 
                          w.status === "paid" ? "bg-blue-100" : "bg-red-100"
                        }`}>
                          {w.status === "applied" ? (
                            <Clock className="w-5 h-5 text-orange-500" />
                          ) : w.status === "approved" ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : w.status === "paid" ? (
                            <Wallet className="w-5 h-5 text-blue-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">¥{w.amount}</p>
                          <p className="text-xs text-gray-400">用户ID: {w.userId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          w.status === "applied" ? "text-orange-600" : 
                          w.status === "approved" ? "text-green-600" : 
                          w.status === "paid" ? "text-blue-600" : "text-red-600"
                        }`}>
                          {w.status === "applied" ? "待审核" : 
                           w.status === "approved" ? "已通过" : 
                           w.status === "paid" ? "已打款" : "已拒绝"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(w.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentWithdraws || stats.recentWithdraws.length === 0) && (
                    <div className="p-8 text-center text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>暂无提现</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
