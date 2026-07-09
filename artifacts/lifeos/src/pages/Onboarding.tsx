import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { AccountStep } from "@/components/onboarding/AccountStep";
import { FinancialGoalStep } from "@/components/onboarding/FinancialGoalStep";
import { NotificationPermissionStep } from "@/components/onboarding/NotificationPermissionStep";
import { CouplesModeStep } from "@/components/onboarding/CouplesModeStep";
import { ReadyStep } from "@/components/onboarding/ReadyStep";
import {
  useCurriculumOnboarding,
  useUpdateCurriculumOnboarding,
  useCurriculumDay,
} from "@/hooks/useCurriculum";
import { useCompleteOnboardingStep } from "@/hooks/useOnboarding";

type Step = 2 | 3 | 4 | 5 | 6;

export default function Onboarding() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { data: onboarding, isLoading } = useCurriculumOnboarding();
  const updateOnboarding = useUpdateCurriculumOnboarding();
  const updateProfile = useCompleteOnboardingStep();
  const { data: dayOne } = useCurriculumDay(1);

  const [step, setStep] = useState<Step>(2);
  const [goal, setGoal] = useState<string | null>(null);
  const [couplesOptIn, setCouplesOptIn] = useState<boolean | null>(null);
  const [notificationsHandled, setNotificationsHandled] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/welcome", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (onboarding?.completedAt) {
      navigate("/dashboard", { replace: true });
    }
  }, [onboarding, navigate]);

  useEffect(() => {
    if (!onboarding) return;
    if (onboarding.goalSelected) setGoal(onboarding.goalSelected);
    if (onboarding.couplesModeOptedIn !== undefined) setCouplesOptIn(onboarding.couplesModeOptedIn);
    const resume = Math.max(2, Math.min(6, (onboarding.stepCompleted || 1) + 1)) as Step;
    if (onboarding.stepCompleted >= 1) setStep(resume);
  }, [onboarding]);

  const canProceed =
    step === 2 ||
    (step === 3 && goal !== null) ||
    (step === 4 && notificationsHandled) ||
    (step === 5 && couplesOptIn !== null) ||
    step === 6;

  if (!isLoaded || !isSignedIn || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleBack = () => {
    if (step > 2) setStep((step - 1) as Step);
  };

  const handleNext = async () => {
    if (!canProceed) return;

    if (step === 2) {
      await updateOnboarding.mutateAsync({ stepCompleted: 2 });
      setStep(3);
      return;
    }

    if (step === 3 && goal) {
      await updateOnboarding.mutateAsync({ stepCompleted: 3, goalSelected: goal });
      updateProfile.mutate({ data: { financialGoal: goal } });
      setStep(4);
      return;
    }

    if (step === 4) {
      await updateOnboarding.mutateAsync({ stepCompleted: 4 });
      setStep(5);
      return;
    }

    if (step === 5 && couplesOptIn !== null) {
      await updateOnboarding.mutateAsync({ stepCompleted: 5, couplesModeOptedIn: couplesOptIn });
      setStep(6);
      return;
    }

    if (step === 6) {
      await updateOnboarding.mutateAsync({ stepCompleted: 6, completed: true });
      updateProfile.mutate({
        data: {
          financialGoal: goal ?? undefined,
          remindersEnabled: notificationsHandled,
          onboardingCompletedAt: new Date().toISOString(),
        },
      });
      navigate("/day/1/morning", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen px-6">
        <div className="pt-6 pb-2 flex items-center gap-3">
          {step > 2 ? (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="h-10 w-10" />
          )}
          <div className="flex-1">
            <OnboardingProgress step={step - 1} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center py-6">
          {step === 2 && <AccountStep />}
          {step === 3 && <FinancialGoalStep value={goal} onChange={setGoal} />}
          {step === 4 && (
            <NotificationPermissionStep
              onComplete={(enabled) => {
                setNotificationsHandled(true);
                updateProfile.mutate({ data: { remindersEnabled: enabled } });
                updateOnboarding.mutate({ stepCompleted: 4 }, { onSuccess: () => setStep(5) });
              }}
            />
          )}
          {step === 5 && <CouplesModeStep value={couplesOptIn} onChange={setCouplesOptIn} />}
          {step === 6 && <ReadyStep dayOneTitle={dayOne?.topicTitle ?? "Manual Entry Discipline"} />}
        </div>

        {step !== 4 && (
          <div className="sticky bottom-0 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
            <Button
              className="w-full h-14 text-base"
              size="lg"
              disabled={!canProceed || updateOnboarding.isPending || updateProfile.isPending}
              onClick={handleNext}
            >
              {updateOnboarding.isPending || updateProfile.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : step === 6 ? (
                "Begin Day 1"
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
