import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { DOC4_FINANCIAL_GOALS } from "./doc4Goals";

interface FinancialGoalStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function FinancialGoalStep({ value, onChange }: FinancialGoalStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">What's your primary goal?</h1>
        <p className="text-muted-foreground">We'll personalize your dashboard copy — everyone gets the full 90-day curriculum</p>
      </div>
      <div className="grid gap-2">
        {DOC4_FINANCIAL_GOALS.map((goal) => (
          <Card
            key={goal}
            role="button"
            tabIndex={0}
            onClick={() => onChange(goal)}
            onKeyDown={(e) => e.key === "Enter" && onChange(goal)}
            className={cn(
              "cursor-pointer transition-colors border-2 hover:border-primary/50",
              value === goal ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium">{goal}</span>
              {value === goal && <Check className="h-5 w-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
