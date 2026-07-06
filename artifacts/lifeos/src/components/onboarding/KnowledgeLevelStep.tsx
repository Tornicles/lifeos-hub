import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const KNOWLEDGE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

interface KnowledgeLevelStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function KnowledgeLevelStep({ value, onChange }: KnowledgeLevelStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">What's your knowledge level?</h1>
        <p className="text-muted-foreground">We'll adjust lesson difficulty for you</p>
      </div>
      <div className="grid gap-2">
        {KNOWLEDGE_LEVELS.map((level) => (
          <Card
            key={level}
            role="button"
            tabIndex={0}
            onClick={() => onChange(level)}
            onKeyDown={(e) => e.key === "Enter" && onChange(level)}
            className={cn(
              "cursor-pointer transition-colors border-2 hover:border-primary/50",
              value === level ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium">{level}</span>
              {value === level && <Check className="h-5 w-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
