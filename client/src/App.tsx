import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth";

// Pages
import HomePage from "@/pages/HomePage";
import ToolsPage from "@/pages/ToolsPage";
import ChatPage from "@/pages/ChatPage";
import ServicePage from "@/pages/ServicePage";
import MinePage from "@/pages/MinePage";
import ToolChatPage from "@/pages/ToolChatPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/tools" component={ToolsPage} />
        <Route path="/tools/:id" component={ToolChatPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/service" component={ServicePage} />
        <Route path="/mine" component={MinePage} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 flex justify-center">
          <div className="w-full max-w-md">
            <Router />
            <Toaster />
          </div>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
