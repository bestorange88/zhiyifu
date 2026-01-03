import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Lock, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, admin } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (admin) {
    setLocation("/admin/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({ title: "请填写账号和密码", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      toast({ title: "登录成功" });
      setLocation("/admin/dashboard");
    } catch (error: any) {
      toast({ title: "登录失败", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">管理后台</h1>
            <p className="text-white/60 text-sm mt-2">云智医服管理系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="text"
                placeholder="管理员账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                data-testid="input-admin-username"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                data-testid="input-admin-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              data-testid="button-admin-login"
            >
              {isLoading ? (
                "登录中..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-white/40 text-xs mt-6">
            仅限授权管理员使用
          </p>
        </div>
      </div>
    </div>
  );
}
