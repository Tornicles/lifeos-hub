import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen px-6 justify-center">
        <WelcomeStep />
        <div className="mt-10 pb-8">
          <Button className="w-full h-14 text-base" size="lg" onClick={() => navigate("/sign-up")}>
            Get Started
          </Button>
          <Button variant="ghost" className="w-full mt-2" onClick={() => navigate("/sign-in")}>
            I already have an account
          </Button>
        </div>
      </div>
    </div>
  );
}
