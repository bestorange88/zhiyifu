import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth";
import { AdminAuthProvider } from "@/lib/adminAuth";

// User Pages
import RouteSelectionPage from "@/pages/RouteSelectionPage";
import HomePage from "@/pages/HomePage";
import ToolsPage from "@/pages/ToolsPage";
import ChatPage from "@/pages/ChatPage";
import ServicePage from "@/pages/ServicePage";
import MinePage from "@/pages/MinePage";
import ToolChatPage from "@/pages/ToolChatPage";
import VipPage from "@/pages/VipPage";
import ReferralPage from "@/pages/ReferralPage";
import InsurancePage from "@/pages/InsurancePage";
import CheckInPage from "@/pages/CheckInPage";
import DepositPage from "@/pages/DepositPage";
import ArticleDetailPage from "@/pages/ArticleDetailPage";
import DownloadPage from "@/pages/DownloadPage";
import InvitePage from "@/pages/InvitePage";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminWithdrawsPage from "@/pages/admin/AdminWithdrawsPage";
import AdminAgentsPage from "@/pages/admin/AdminAgentsPage";
import AdminGroupsPage from "@/pages/admin/AdminGroupsPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminStatsPage from "@/pages/admin/AdminStatsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminFinancePage from "@/pages/admin/AdminFinancePage";
import AdminLotteryPage from "@/pages/admin/AdminLotteryPage";
import AdminDistributionPage from "@/pages/admin/AdminDistributionPage";
import AdminCommissionPage from "@/pages/admin/AdminCommissionPage";
import AdminMembershipPage from "@/pages/admin/AdminMembershipPage";
import AdminContentPage from "@/pages/admin/AdminContentPage";
import AdminServicePage from "@/pages/admin/AdminServicePage";
import AdminVipRanksPage from "@/pages/admin/AdminVipRanksPage";
import AdminIdentityPage from "@/pages/admin/AdminIdentityPage";

function UserRouter() {
  const [location] = useLocation();
  const isRouteSelection = location === "/";

  if (isRouteSelection) {
    return <RouteSelectionPage />;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
      <Switch>
        <Route path="/home" component={HomePage} />
        <Route path="/tools" component={ToolsPage} />
        <Route path="/tools/:id" component={ToolChatPage} />
        <Route path="/vip" component={VipPage} />
        <Route path="/insurance" component={InsurancePage} />
        <Route path="/checkin" component={CheckInPage} />
        <Route path="/referral" component={ReferralPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/service" component={ServicePage} />
        <Route path="/deposit" component={DepositPage} />
        <Route path="/article/:id" component={ArticleDetailPage} />
        <Route path="/download" component={DownloadPage} />
        <Route path="/invite" component={InvitePage} />
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
        <Route path="/admin/orders" component={AdminOrdersPage} />
        <Route path="/admin/finance" component={AdminFinancePage} />
        <Route path="/admin/lottery" component={AdminLotteryPage} />
        <Route path="/admin/distribution" component={AdminDistributionPage} />
        <Route path="/admin/commission" component={AdminCommissionPage} />
        <Route path="/admin/membership" component={AdminMembershipPage} />
        <Route path="/admin/vipranks" component={AdminVipRanksPage} />
        <Route path="/admin/content" component={AdminContentPage} />
        <Route path="/admin/service" component={AdminServicePage} />
        <Route path="/admin/groups" component={AdminGroupsPage} />
                <Route path="/admin/agents" component={AdminAgentsPage} />
                <Route path="/admin/identity" component={AdminIdentityPage} />
                <Route path="/admin/stats" component={AdminStatsPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/admin/withdraws" component={AdminWithdrawsPage} />
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
