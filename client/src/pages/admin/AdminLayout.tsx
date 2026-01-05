import { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { LayoutDashboard, Users, CreditCard, UserCheck, LogOut, Menu, X, ShoppingBag, BarChart3, MessageSquare, Wallet, Gift, Share2, Coins, Crown, Settings, FileText, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!admin) {
    setLocation("/admin");
    return null;
  }

  const menuItems = [
    { id: "dashboard", label: "仪表盘", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: "users", label: "用户管理", icon: Users, path: "/admin/users" },
    { id: "orders", label: "订单管理", icon: ShoppingBag, path: "/admin/orders" },
    { id: "finance", label: "充提管理", icon: Wallet, path: "/admin/finance" },
    { id: "lottery", label: "抽奖管理", icon: Gift, path: "/admin/lottery" },
    { id: "distribution", label: "分销管理", icon: Share2, path: "/admin/distribution" },
    { id: "commission", label: "佣金管理", icon: Coins, path: "/admin/commission" },
    { id: "membership", label: "会员中心", icon: Crown, path: "/admin/membership" },
    { id: "content", label: "内容管理", icon: FileText, path: "/admin/content" },
    { id: "service", label: "客服中心", icon: Headphones, path: "/admin/service" },
    { id: "groups", label: "群组管理", icon: MessageSquare, path: "/admin/groups" },
    { id: "agents", label: "代理审核", icon: UserCheck, path: "/admin/agents" },
    { id: "stats", label: "数据统计", icon: BarChart3, path: "/admin/stats" },
    { id: "settings", label: "系统设置", icon: Settings, path: "/admin/settings" },
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
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </div>

      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h2 className="font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("zh-CN")}
          </div>
        </header>

        <main className="p-6">
          {children}
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
