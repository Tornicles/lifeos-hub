import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import UltraHub from "./pages/UltraHub";
import Projects from "./pages/Projects";
import Habits from "./pages/Habits";
import Calendar from "./pages/Calendar";
import Logs from "./pages/Logs";
import Automation from "./pages/Automation";
import StatesEngine from "./pages/StatesEngine";
import AutomationRules from "./pages/AutomationRules";
import AutomationDiagnostics from "./pages/AutomationDiagnostics";
import AutomationSettings from "./pages/AutomationSettings";
import HubDetail from "./pages/HubDetail";
import ProjectDetail from "./pages/ProjectDetail";
import HabitDetail from "./pages/HabitDetail";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import PasswordReset from "./pages/PasswordReset";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ultra" element={<UltraHub />} />
            <Route path="/hubs/:hubCode" element={<HubDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/habits/:habitId" element={<HabitDetail />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/automation-rules" element={<AutomationRules />} />
            <Route path="/automation-diagnostics" element={<AutomationDiagnostics />} />
            <Route path="/automation-settings" element={<AutomationSettings />} />
            <Route path="/states-engine" element={<StatesEngine />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/security" element={<Security />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/notification-settings" element={<NotificationSettings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl">Reports - Coming Soon</h1></div>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
