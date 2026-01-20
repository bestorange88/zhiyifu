import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";

export default function InvitePage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const code = params.get("code");
    
    if (code) {
      localStorage.setItem("pending_invite_code", code);
    }
    
    setLocation("/mine?register=true");
  }, [searchString, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg">正在跳转...</p>
      </div>
    </div>
  );
}
