import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminInfo {
  id: number;
  username: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminInfo | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("adminToken"));
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
      setInitialized(true);
    }
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin({ id: data.adminId, username: "admin", role: data.role });
      } else {
        localStorage.removeItem("adminToken");
        setToken(null);
        setAdmin(null);
      }
    } catch {
      localStorage.removeItem("adminToken");
      setToken(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "登录失败");
    }

    const data = await res.json();
    setToken(data.token);
    setAdmin(data.admin);
    localStorage.setItem("adminToken", data.token);
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem("adminToken");
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ admin, token, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
