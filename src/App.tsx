import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
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
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          {/* Placeholder routes for future pages */}
          <Route
            path="/ultra"
            element={
              <AppLayout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold mb-4">Ultra Hub</h1>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AppLayout>
            }
          />
          <Route
            path="/hubs"
            element={
              <AppLayout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold mb-4">Hubs</h1>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AppLayout>
            }
          />
          <Route
            path="/projects"
            element={
              <AppLayout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold mb-4">Projects</h1>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AppLayout>
            }
          />
          <Route
            path="/habits"
            element={
              <AppLayout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold mb-4">Habits</h1>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AppLayout>
            }
          />
          <Route
            path="/calendar"
            element={
              <AppLayout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold mb-4">Calendar</h1>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AppLayout>
            }
          />
          <Route
            path="/logs"
            element={
              <AppLayout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold mb-4">Logs & Data</h1>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold mb-4">Settings</h1>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </AppLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
