import { Sparkles } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-bold">Tech-Tate</h1>
      <p className="text-lg text-muted-foreground">
        Learn. Apply. Build Wealth. Together.
      </p>
    </div>
  );
}
