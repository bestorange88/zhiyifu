import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth";
import { AdminAuthProvider } from "@/lib/adminAuth";
import { Suspense, lazy } from "react";
import { Loading } from "@/components/Loading";

// User Pages
const RouteSelectionPage = lazy(() => import("@/pages/RouteSelectionPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ToolsPage = lazy(() => import("@/pages/ToolsPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const ServicePage = lazy(() => import("@/pages/ServicePage"));
const MinePage = lazy(() => import("@/pages/MinePage"));
const FundHistoryPage = lazy(() => import("@/pages/FundHistoryPage"));
const ToolChatPage = lazy(() => import("@/pages/ToolChatPage"));
const VipPage = lazy(() => import("@/pages/VipPage"));
const ReferralPage = lazy(() => import("@/pages/ReferralPage"));
const InsurancePage = lazy(() => import("@/pages/InsurancePage"));
const CheckInPage = lazy(() => import("@/pages/CheckInPage"));
const DepositPage = lazy(() => import("@/pages/DepositPage"));
const ArticleDetailPage = lazy(() => import("@/pages/ArticleDetailPage"));
const DownloadPage = lazy(() => import("@/pages/DownloadPage"));
const InvitePage = lazy(() => import("@/pages/InvitePage"));
const TeamPage = lazy(() => import("@/pages/TeamPage"));
const CommissionRewardsPage = lazy(() => import("@/pages/CommissionRewardsPage"));
const PointsHistoryPage = lazy(() => import("@/pages/PointsHistoryPage"));
const PointsRulesPage = lazy(() => import("@/pages/PointsRulesPage"));
const HelpCenterPage = lazy(() => import("@/pages/HelpCenterPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const RightsPage = lazy(() => import("@/pages/RightsPage"));
const TopicHealthSystem = lazy(() => import("@/pages/topic/TopicHealthSystem"));
const HealthMonitorPage = lazy(() => import("@/pages/health/HealthMonitorPage"));
const HealthAssessmentPage = lazy(() => import("@/pages/health/HealthAssessmentPage"));
const HealthInsightsPage = lazy(() => import("@/pages/health/HealthInsightsPage"));
const HealthAssistantPage = lazy(() => import("@/pages/health/HealthAssistantPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Admin Pages
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminWithdrawsPage = lazy(() => import("@/pages/admin/AdminWithdrawsPage"));
const AdminAgentsPage = lazy(() => import("@/pages/admin/AdminAgentsPage"));
const AdminGroupsPage = lazy(() => import("@/pages/admin/AdminGroupsPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminStatsPage = lazy(() => import("@/pages/admin/AdminStatsPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminFinancePage = lazy(() => import("@/pages/admin/AdminFinancePage"));
const AdminLotteryPage = lazy(() => import("@/pages/admin/AdminLotteryPage"));
const AdminDistributionPage = lazy(() => import("@/pages/admin/AdminDistributionPage"));
const AdminCommissionPage = lazy(() => import("@/pages/admin/AdminCommissionPage"));
const AdminPointsPage = lazy(() => import("@/pages/admin/AdminPointsPage"));
const AdminMembershipPage = lazy(() => import("@/pages/admin/AdminMembershipPage"));
const AdminVipRanksPage = lazy(() => import("@/pages/admin/AdminVipRanksPage"));
const AdminRankRequestsPage = lazy(() => import("@/pages/admin/AdminRankRequestsPage"));
const AdminContentPage = lazy(() => import("@/pages/admin/AdminContentPage"));
const AdminServicePage = lazy(() => import("@/pages/admin/AdminServicePage"));
const AdminIdentityPage = lazy(() => import("@/pages/admin/AdminIdentityPage"));
const AdminActivityPage = lazy(() => import("@/pages/admin/AdminActivityPage"));

function UserRouter() {
  const [location] = useLocation();
  const isRouteSelection = location === "/";

  if (isRouteSelection) {
    return (
      <Suspense fallback={<Loading />}>
        <RouteSelectionPage />
      </Suspense>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
      <Suspense fallback={<Loading />}>
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
          <Route path="/team" component={TeamPage} />
          <Route path="/commission-rewards" component={CommissionRewardsPage} />
          <Route path="/transactions" component={FundHistoryPage} />
          <Route path="/points-history" component={PointsHistoryPage} />
          <Route path="/points-rules" component={PointsRulesPage} />
          <Route path="/help" component={HelpCenterPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/rights" component={RightsPage} />
          <Route path="/topic/health-system" component={TopicHealthSystem} />
          <Route path="/health/monitor" component={HealthMonitorPage} />
          <Route path="/health/assessment" component={HealthAssessmentPage} />
          <Route path="/health/insights" component={HealthInsightsPage} />
          <Route path="/health/assistant" component={HealthAssistantPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <BottomNav />
    </div>
  );
}

function AdminRouter() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path="/admin" component={AdminLoginPage} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/admin/orders" component={AdminOrdersPage} />
          <Route path="/admin/finance" component={AdminFinancePage} />
          <Route path="/admin/lottery" component={AdminLotteryPage} />
          <Route path="/admin/distribution" component={AdminDistributionPage} />
          <Route path="/admin/commission" component={AdminCommissionPage} />
          <Route path="/admin/points" component={AdminPointsPage} />
          <Route path="/admin/membership" component={AdminMembershipPage} />
          <Route path="/admin/vipranks" component={AdminVipRanksPage} />
          <Route path="/admin/rank-requests" component={AdminRankRequestsPage} />
          <Route path="/admin/content" component={AdminContentPage} />
          <Route path="/admin/service" component={AdminServicePage} />
          <Route path="/admin/groups" component={AdminGroupsPage} />
          <Route path="/admin/agents" component={AdminAgentsPage} />
          <Route path="/admin/identity" component={AdminIdentityPage} />
          <Route path="/admin/stats" component={AdminStatsPage} />
          <Route path="/admin/settings" component={AdminSettingsPage} />
          <Route path="/admin/activity" component={AdminActivityPage} />
          <Route path="/admin/withdraws" component={AdminWithdrawsPage} />
        </Switch>
      </Suspense>
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
