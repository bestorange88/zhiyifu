import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  variant?: "default" | "compact" | "mini";
}

export function FeatureCard({ title, description, icon, color, onClick, variant = "default" }: FeatureCardProps) {
  if (variant === "mini") {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "rounded-2xl p-3 text-white flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          color
        )}
        data-testid={`card-mini-${title}`}
      >
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
          {icon}
        </div>
        <h4 className="font-bold text-xs">{title}</h4>
      </button>
    );
  }
  
  if (variant === "compact") {
    return (
      <button 
        onClick={onClick}
        className="w-full card-elevated p-4 hover:shadow-md transition-all duration-200 group text-left"
        data-testid={`card-compact-${title}`}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200",
            color
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 text-sm group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">{description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "feature-card-gradient",
        color
      )} 
      onClick={onClick}
      data-testid={`card-default-${title}`}
    >
      <div className="relative z-10">
        <h3 className="font-bold text-lg text-shadow-sm">{title}</h3>
        <p className="text-sm opacity-90 mt-1 font-medium">{description}</p>
        
        <div className="mt-4 flex justify-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float">
            {icon}
          </div>
        </div>
        
        <button className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors rounded-xl px-4 py-2.5 text-sm font-semibold w-full">
          立即体验
        </button>
      </div>
    </div>
  );
}
