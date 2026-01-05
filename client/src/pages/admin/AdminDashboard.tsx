import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, Users, CreditCard, UserCheck, LogOut, 
  Menu, X, TrendingUp, Clock, AlertCircle, ChevronRight, ShoppingBag, BarChart3, Crown, Wallet
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalUsers: number;
  vipUsers: number;
  pendingWithdraws: number;
  pendingAgentApps: number;
  totalOrders: number;
  totalRevenue: number;
  todayUsers: number;
  todayOrders: number;
  todayRevenue: number;
  todayWithdraws: number;
  vip1Count: number;
  vip2Count: number;
  vip3Count: number;
  recentUsers: any[];
  recentWithdraws: any[];
}

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { admin, logout, token } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (!admin) {
      setLocation("/admin");
    }
  }, [admin, setLocation]);

  if (!admin) {
    return null;
  }

  const menuItems = [
    { id: "dashboard", label: "仪表盘", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: "users", label: "用户管理", icon: Users, path: "/admin/users" },
    { id: "orders", label: "订单管理", icon: ShoppingBag, path: "/admin/orders" },
    { id: "withdraws", label: "提现管理", icon: CreditCard, path: "/admin/withdraws" },
    { id: "agents", label: "代理审核", icon: UserCheck, path: "/admin/agents" },
  ];

  const handleLogout = () => {
    logout();
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">云智医服</h1>
          <p className="text-xs text-slate-400">管理后台</p>
        </div>
        
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setLocation(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                location === item.path
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{admin.username[0].toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-medium">{admin.username}</p>
              <p className="text-xs text-slate-400">{admin.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </div>

      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h2 className="font-semibold text-gray-800">仪表盘</h2>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("zh-CN")}
          </div>
        </header>

        <main className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">总用户数</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">VIP会员</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats?.vipUsers || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">总订单数</span>
                    <ShoppingBag className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats?.totalOrders || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">总收入</span>
                    <Wallet className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">¥{stats?.totalRevenue || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">待处理提现</span>
                    <CreditCard className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats?.pendingWithdraws || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">待审核代理</span>
                    <UserCheck className="w-4 h-4 text-pink-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats?.pendingAgentApps || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    今日数据
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">今日新增用户</span>
                      <span className="font-bold text-blue-600">{stats?.todayUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">今日新增订单</span>
                      <span className="font-bold text-green-600">{stats?.todayOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">今日收入</span>
                      <span className="font-bold text-purple-600">¥{stats?.todayRevenue || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">今日提现申请</span>
                      <span className="font-bold text-orange-600">{stats?.todayWithdraws || 0}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    VIP分布
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">VIP1 会员</span>
                      <span className="font-bold">{stats?.vip1Count || 0} 人</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">VIP2 会员</span>
                      <span className="font-bold">{stats?.vip2Count || 0} 人</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">VIP3 会员</span>
                      <span className="font-bold">{stats?.vip3Count || 0} 人</span>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">最近注册用户</h3>
                    <button 
                      onClick={() => setLocation("/admin/users")}
                      className="text-sm text-purple-600 flex items-center gap-1"
                    >
                      查看全部 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y">
                    {stats?.recentUsers?.map((user: any) => (
                      <div key={user.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.phone}</p>
                            <p className="text-xs text-gray-400">邀请码: {user.inviteCode}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString("zh-CN")}
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
                      className="text-sm text-purple-600 flex items-center gap-1"
                    >
                      查看全部 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y">
                    {stats?.recentWithdraws?.map((w: any) => (
                      <div key={w.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            w.status === "applied" ? "bg-orange-100" : 
                            w.status === "approved" ? "bg-green-100" : "bg-red-100"
                          }`}>
                            {w.status === "applied" ? (
                              <Clock className="w-5 h-5 text-orange-500" />
                            ) : w.status === "approved" ? (
                              <CreditCard className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">¥{w.amount}</p>
                            <p className="text-xs text-gray-400">{w.method}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          w.status === "applied" ? "bg-orange-100 text-orange-600" :
                          w.status === "approved" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                          {w.status === "applied" ? "待审核" : w.status === "approved" ? "已通过" : "已拒绝"}
                        </span>
                      </div>
                    ))}
                    {(!stats?.recentWithdraws || stats.recentWithdraws.length === 0) && (
                      <div className="p-8 text-center text-gray-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无提现申请</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
