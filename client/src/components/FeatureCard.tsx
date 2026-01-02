import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  variant?: "default" | "compact";
}

export function FeatureCard({ title, description, icon, color, onClick, variant = "default" }: FeatureCardProps) {
  if (variant === "compact") {
    return (
      <button 
        onClick={onClick}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 hover:shadow-md hover:border-blue-100 transition-all duration-300 group text-left"
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300",
            color
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary self-center transition-colors" />
        </div>
      </button>
    );
  }

  return (
    <div className={cn(
      "bg-gradient-to-br rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1",
      color
    )} onClick={onClick}>
      <div className="relative z-10">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm opacity-90 mt-1 font-medium">{description}</p>
        
        <div className="mt-4 flex justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        
        <button className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors rounded-full px-4 py-2 text-sm font-semibold w-full">
          立即体验
        </button>
      </div>
      
      {/* Decorative background circle */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
    </div>
  );
}
