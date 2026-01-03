import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth";
import { AdminAuthProvider } from "@/lib/adminAuth";

// User Pages
import HomePage from "@/pages/HomePage";
import ToolsPage from "@/pages/ToolsPage";
import ChatPage from "@/pages/ChatPage";
import ServicePage from "@/pages/ServicePage";
import MinePage from "@/pages/MinePage";
import ToolChatPage from "@/pages/ToolChatPage";
import VipPage from "@/pages/VipPage";
import ReferralPage from "@/pages/ReferralPage";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminWithdrawsPage from "@/pages/admin/AdminWithdrawsPage";
import AdminAgentsPage from "@/pages/admin/AdminAgentsPage";

function UserRouter() {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/tools" component={ToolsPage} />
        <Route path="/tools/:id" component={ToolChatPage} />
        <Route path="/vip" component={VipPage} />
        <Route path="/referral" component={ReferralPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/service" component={ServicePage} />
        <Route path="/mine" component={MinePage} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function AdminRouter() {
  return (
    <AdminAuthProvider>
      <Switch>
        <Route path="/admin" component={AdminLoginPage} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/withdraws" component={AdminWithdrawsPage} />
        <Route path="/admin/agents" component={AdminAgentsPage} />
      </Switch>
    </AdminAuthProvider>
  );
}

function App() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <>
          <AdminRouter />
          <Toaster />
        </>
      ) : (
        <AuthProvider>
          <div className="min-h-screen bg-gray-100 flex justify-center">
            <div className="w-full max-w-md">
              <UserRouter />
              <Toaster />
            </div>
          </div>
        </AuthProvider>
      )}
    </QueryClientProvider>
  );
}

export default App;
