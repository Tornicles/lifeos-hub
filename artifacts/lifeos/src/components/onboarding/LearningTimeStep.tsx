import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const LEARNING_MINUTES_OPTIONS = [5, 10, 15, 20] as const;

interface LearningTimeStepProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function LearningTimeStep({ value, onChange }: LearningTimeStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">How much time can you commit daily?</h1>
        <p className="text-muted-foreground">Small, consistent sessions work best</p>
      </div>
      <div className="grid gap-2">
        {LEARNING_MINUTES_OPTIONS.map((minutes) => (
          <Card
            key={minutes}
            role="button"
            tabIndex={0}
            onClick={() => onChange(minutes)}
            onKeyDown={(e) => e.key === "Enter" && onChange(minutes)}
            className={cn(
              "cursor-pointer transition-colors border-2 hover:border-primary/50",
              value === minutes ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium">{minutes} minutes / day</span>
              {value === minutes && <Check className="h-5 w-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
