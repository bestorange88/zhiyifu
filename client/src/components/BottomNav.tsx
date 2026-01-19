import { Link, useLocation } from "wouter";
import { Home, Grid3X3, MessageCircle, Headphones, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: 'home', label: '首页', icon: Home, path: '/home' },
  { id: 'tools', label: '工具', icon: Grid3X3, path: '/tools' },
  { id: 'chat', label: '会话', icon: MessageCircle, path: '/chat' },
  { id: 'service', label: '客服', icon: Headphones, path: '/service' },
  { id: 'mine', label: '我的', icon: User, path: '/mine' },
];

export function BottomNav() {
  const [location] = useLocation();

  // Hide bottom nav on tool chat pages, VIP page, and referral page
  if (location.startsWith("/tools/") || location === "/vip" || location === "/referral") {
    return null;
  }

  return (
    <div className="bottom-nav-container">
      <div className="max-w-md mx-auto px-4 flex justify-between items-center gap-2 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;
          
          return (
            <Link 
              key={tab.id} 
              href={tab.path} 
              className="nav-item"
              data-testid={`nav-${tab.id}`}
            >
              <div className={cn(
                "nav-icon-wrapper",
                isActive && "active"
              )}>
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-gray-400"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors duration-200",
                isActive ? "text-primary" : "text-gray-400"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
