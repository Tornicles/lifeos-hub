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
import NotFound from "./pages/NotFound";

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
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ultra" element={<UltraHub />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/hubs/:hubCode" element={<div className="p-6"><h1 className="text-2xl">Hub Detail - Coming Soon</h1></div>} />
            <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl">Reports - Coming Soon</h1></div>} />
            <Route path="/automation" element={<div className="p-6"><h1 className="text-2xl">Automation - Coming Soon</h1></div>} />
            <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl">Settings - Coming Soon</h1></div>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
