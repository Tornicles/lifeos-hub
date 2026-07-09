import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { Activity } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useCurriculumOnboarding } from "@/hooks/useCurriculum";

const AppLayout = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { data: onboarding, isLoading: onboardingLoading } = useCurriculumOnboarding();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Onboarding gate: any signed-in user who hasn't finished onboarding is
  // forced to /onboarding regardless of the route they requested. This never
  // fires again once onboardingCompletedAt is set.
  useEffect(() => {
    if (isLoaded && isSignedIn && onboarding && !onboarding.completedAt) {
      navigate("/onboarding", { replace: true });
    }
  }, [isLoaded, isSignedIn, onboarding, navigate]);

  if (!isLoaded || !isSignedIn || onboardingLoading || (onboarding && !onboarding.completedAt)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Tech-Tate...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full">
          <TopNav />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
