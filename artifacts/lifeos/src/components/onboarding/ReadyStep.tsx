import { Sparkles } from "lucide-react";

interface ReadyStepProps {
  dayOneTitle: string;
}

export function ReadyStep({ dayOneTitle }: ReadyStepProps) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold">Your 90-day journey starts now</h1>
      <p className="text-lg text-muted-foreground">
        Day 1: <span className="font-medium text-foreground">{dayOneTitle}</span>
      </p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Each day begins with morning prayer, then 12 lesson cards, a quiz, and a game. Let's begin.
      </p>
    </div>
  );
}
