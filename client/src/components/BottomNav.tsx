import { Link, useLocation } from "wouter";
import { Home, Wrench, MessageCircle, Headphones, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: 'home', label: '首页', icon: Home, path: '/' },
  { id: 'tools', label: '工具', icon: Wrench, path: '/tools' },
  { id: 'chat', label: '会话', icon: MessageCircle, path: '/chat' },
  { id: 'service', label: '客服', icon: Headphones, path: '/service' },
  { id: 'mine', label: '我的', icon: User, path: '/mine' },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-safe pt-2 z-50">
      <div className="max-w-md mx-auto px-6 flex justify-between items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;
          
          return (
            <Link key={tab.id} href={tab.path} className="flex-1 flex flex-col items-center gap-1 group">
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all duration-300",
                isActive ? "text-primary -translate-y-1" : "text-gray-400 group-hover:text-primary/70"
              )}>
                {isActive && (
                  <span className="absolute inset-0 bg-primary/10 rounded-xl blur-sm -z-10" />
                )}
                <Icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
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
