import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { AccountTypeStep, type AccountType } from "@/components/onboarding/AccountTypeStep";
import { FinancialGoalStep } from "@/components/onboarding/FinancialGoalStep";
import { KnowledgeLevelStep } from "@/components/onboarding/KnowledgeLevelStep";
import { LearningTimeStep } from "@/components/onboarding/LearningTimeStep";
import { RemindersStep } from "@/components/onboarding/RemindersStep";
import {
  useOnboardingProfile,
  useCompleteOnboardingStep,
  getResumeStep,
  markWelcomeSeen,
  type OnboardingStep,
} from "@/hooks/useOnboarding";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const { data: profile, isLoading } = useOnboardingProfile();
  const updateMutation = useCompleteOnboardingStep();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [financialGoal, setFinancialGoal] = useState<string | null>(null);
  const [knowledgeLevel, setKnowledgeLevel] = useState<string | null>(null);
  const [dailyLearningMinutes, setDailyLearningMinutes] = useState<number | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean | null>(null);

  // Already-finished users should never see onboarding again — bounce them
  // straight to the dashboard if they land on this route directly.
  useEffect(() => {
    if (profile?.onboardingCompletedAt) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile, navigate]);

  // Resume at the first incomplete step and hydrate local state from
  // whatever the profile already has, so going back and forward within a
  // session (or a fresh reload) never loses previously-made selections.
  useEffect(() => {
    if (!profile || !user?.id || step !== null) return;
    setAccountType((profile.accountType as AccountType) ?? null);
    setFinancialGoal(profile.financialGoal ?? null);
    setKnowledgeLevel(profile.knowledgeLevel ?? null);
    setDailyLearningMinutes(profile.dailyLearningMinutes ?? null);
    setStep(getResumeStep(user.id, profile));
  }, [profile, user?.id, step]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return true;
      case 2: return accountType !== null;
      case 3: return financialGoal !== null;
      case 4: return knowledgeLevel !== null;
      case 5: return dailyLearningMinutes !== null;
      case 6: return remindersEnabled !== null;
      default: return false;
    }
  }, [step, accountType, financialGoal, knowledgeLevel, dailyLearningMinutes, remindersEnabled]);

  if (!isLoaded || !isSignedIn || isLoading || step === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as OnboardingStep);
  };

  const handleNext = () => {
    if (!canProceed) return;

    if (step === 1) {
      if (user?.id) markWelcomeSeen(user.id);
      setStep(2);
      return;
    }

    if (step === 2) {
      updateMutation.mutate({ data: { accountType: accountType! } });
      setStep(3);
      return;
    }

    if (step === 3) {
      updateMutation.mutate({ data: { financialGoal: financialGoal! } });
      setStep(4);
      return;
    }

    if (step === 4) {
      updateMutation.mutate({ data: { knowledgeLevel: knowledgeLevel! } });
      setStep(5);
      return;
    }

    if (step === 5) {
      updateMutation.mutate({ data: { dailyLearningMinutes: dailyLearningMinutes! } });
      setStep(6);
      return;
    }

    if (step === 6) {
      updateMutation.mutate(
        {
          data: {
            accountType: accountType!,
            financialGoal: financialGoal!,
            knowledgeLevel: knowledgeLevel!,
            dailyLearningMinutes: dailyLearningMinutes!,
            remindersEnabled: remindersEnabled!,
            onboardingCompletedAt: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => navigate("/dashboard", { replace: true }),
        },
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen px-6">
        <div className="pt-6 pb-2 flex items-center gap-3">
          {step > 1 ? (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="h-10 w-10" />
          )}
          <div className="flex-1">
            <OnboardingProgress step={step} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center py-6">
          {step === 1 && <WelcomeStep />}
          {step === 2 && <AccountTypeStep value={accountType} onChange={setAccountType} />}
          {step === 3 && <FinancialGoalStep value={financialGoal} onChange={setFinancialGoal} />}
          {step === 4 && <KnowledgeLevelStep value={knowledgeLevel} onChange={setKnowledgeLevel} />}
          {step === 5 && <LearningTimeStep value={dailyLearningMinutes} onChange={setDailyLearningMinutes} />}
          {step === 6 && <RemindersStep value={remindersEnabled} onChange={setRemindersEnabled} />}
        </div>

        <div className="sticky bottom-0 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            className="w-full h-14 text-base"
            size="lg"
            disabled={!canProceed || updateMutation.isPending}
            onClick={handleNext}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : step === 1 ? (
              "Get Started"
            ) : step === 6 ? (
              "Finish"
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
