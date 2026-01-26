import { User, Bell, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import logoImage from "@assets/logo.jpg";

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "transparent";
}

export function Header({ 
  title = "云智医服", 
  showProfile = true, 
  className, 
  children,
  variant = "default"
}: HeaderProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toggleTheme } = useTheme();
  
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
              <img 
                src={logoImage} 
                alt="智医服" 
                className="w-10 h-10 rounded-xl shadow-lg object-cover transform hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-800 tracking-tight block leading-tight">{title}</span>
              <span className="text-[10px] text-gray-400 font-medium">云端智能医疗服务</span>
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
                onClick={toggleTheme}
                className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                title="切换主题"
              >
                <Palette className="w-4 h-4 text-primary" />
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
