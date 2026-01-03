import { User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "transparent";
}

export function Header({ 
  title = "365智慧问诊", 
  showProfile = true, 
  className, 
  children,
  variant = "default"
}: HeaderProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  return (
    <header className={cn(
      "glass-header",
      variant === "transparent" && "bg-transparent backdrop-blur-none",
      className
    )}>
      {children ? children : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 gradient-primary rounded-xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
                <span className="text-white text-sm font-bold font-display">365</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-800 tracking-tight block leading-tight">{title}</span>
              <span className="text-[10px] text-gray-400 font-medium">智能医疗助手</span>
            </div>
          </div>
          {showProfile && (
            <div className="flex items-center gap-2">
              <button 
                className="relative w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button 
                onClick={() => setLocation('/mine')}
                className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105"
                data-testid="button-profile"
              >
                {user ? (
                  <span className="text-white text-xs font-bold">
                    {user.phone.slice(-2)}
                  </span>
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          )}
        </>
      )}
    </header>
  );
}
