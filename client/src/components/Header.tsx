import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Header({ title = "365智慧问诊", showProfile = true, className, children }: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-transparent transition-all",
      className
    )}>
      {children ? children : (
        <>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-primary to-blue-400 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center transform hover:scale-105 transition-transform">
              <span className="text-white text-sm font-bold font-display">365</span>
            </div>
            <span className="font-bold text-lg text-gray-800 tracking-tight">{title}</span>
          </div>
          {showProfile && (
            <button className="w-9 h-9 bg-blue-50 hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
              <User className="w-5 h-5 text-primary" />
            </button>
          )}
        </>
      )}
    </header>
  );
}
