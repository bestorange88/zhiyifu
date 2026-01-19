import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, Download, Smartphone } from "lucide-react";

export function AppDownloadBanner() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("app-banner-dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("app-banner-dismissed", "true");
  };

  const handleDownload = () => {
    setLocation("/download");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between gap-3 relative">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">下载云智医服APP</p>
          <p className="text-xs text-white/80 truncate">随时随地享受AI医疗服务</p>
        </div>
      </div>
      
      <button
        onClick={handleDownload}
        className="bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 hover:bg-white/90 transition-colors flex-shrink-0"
        data-testid="button-download-app"
      >
        <Download className="w-4 h-4" />
        下载
      </button>
      
      <button
        onClick={handleDismiss}
        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        data-testid="button-dismiss-banner"
        aria-label="关闭"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
