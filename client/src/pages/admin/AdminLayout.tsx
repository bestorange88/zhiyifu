import { useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { LayoutDashboard, Users, CreditCard, UserCheck, LogOut, Menu, X, ShoppingBag, BarChart3, MessageSquare, Wallet, Gift, Share2, Coins, Crown, Settings, FileText, Headphones, IdCard, ChevronDown, ChevronRight, Shield, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/adminAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  subItems?: MenuItem[];
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    if (!admin) {
      setLocation("/admin");
    }
  }, [admin, setLocation]);

  // 根据当前路径自动展开对应的父级菜单
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(sub => sub.path === location);
        if (hasActiveSubItem && !openMenus.includes(item.id)) {
          setOpenMenus(prev => [...prev, item.id]);
        }
      }
    });
  }, [location]);

  if (!admin) {
    return null;
  }

  const menuItems: MenuItem[] = [
    { 
      id: "dashboard", 
      label: "仪表盘", 
      icon: LayoutDashboard, 
      path: "/admin/dashboard" 
    },
    { 
      id: "users_management", 
      label: "用户管理", 
      icon: Users,
      subItems: [
        { id: "users", label: "用户列表", icon: Users, path: "/admin/users" },
        { id: "identity", label: "实名认证", icon: IdCard, path: "/admin/identity" },
        { id: "agents", label: "代理审核", icon: UserCheck, path: "/admin/agents" },
      ]
    },
    {
      id: "vip_management",
      label: "VIP管理",
      icon: Crown,
      subItems: [
        { id: "vipranks", label: "VIP等级", icon: Crown, path: "/admin/vipranks" },
        { id: "rank-requests", label: "VIP升级审核", icon: UserCheck, path: "/admin/rank-requests" },
      ]
    },
    {
      id: "finance_management",
      label: "财务管理",
      icon: Wallet,
      subItems: [
        { id: "finance", label: "充提管理", icon: Wallet, path: "/admin/finance" },
        { id: "orders", label: "订单管理", icon: ShoppingBag, path: "/admin/orders" },
        { id: "commission", label: "佣金管理", icon: Coins, path: "/admin/commission" },
        { id: "points", label: "积分明细", icon: BadgeDollarSign, path: "/admin/points" },
      ]
    },
    {
      id: "marketing_management",
      label: "营销管理",
      icon: Gift,
      subItems: [
        { id: "lottery", label: "抽奖管理", icon: Gift, path: "/admin/lottery" },
        { id: "distribution", label: "分销管理", icon: Share2, path: "/admin/distribution" },
      ]
    },
    {
      id: "system_management",
      label: "系统管理",
      icon: Settings,
      subItems: [
        { id: "content", label: "内容管理", icon: FileText, path: "/admin/content" },
        { id: "groups", label: "群组管理", icon: MessageSquare, path: "/admin/groups" },
        { id: "service", label: "客服中心", icon: Headphones, path: "/admin/service" },
        { id: "settings", label: "系统设置", icon: Settings, path: "/admin/settings" },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    setLocation("/admin");
  };

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.subItems) {
      const isOpen = openMenus.includes(item.id);
      return (
        <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleMenu(item.id)} className="space-y-1">
          <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left text-slate-300 hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.subItems.map(subItem => (
              <button
                key={subItem.id}
                onClick={() => {
                  if (subItem.path) setLocation(subItem.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-left text-sm transition-colors ${
                  location === subItem.path
                    ? "bg-purple-600/20 text-purple-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <subItem.icon className="w-4 h-4" />
                {subItem.label}
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => {
          if (item.path) setLocation(item.path);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
          location === item.path
            ? "bg-purple-600 text-white"
            : "text-slate-300 hover:bg-slate-800"
        }`}
        data-testid={`menu-${item.id}`}
      >
        <item.icon className="w-5 h-5" />
        {item.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform lg:translate-x-0 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">云智医服</h1>
          <p className="text-xs text-slate-400">管理后台</p>
        </div>
        
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map(renderMenuItem)}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-slate-700">
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
