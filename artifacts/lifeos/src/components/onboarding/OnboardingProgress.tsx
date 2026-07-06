import { Progress } from "@/components/ui/progress";

export function OnboardingProgress({ step, totalSteps = 6 }: { step: number; totalSteps?: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Step {step} of {totalSteps}
      </p>
      <Progress value={(step / totalSteps) * 100} className="h-2" />
    </div>
  );
}
