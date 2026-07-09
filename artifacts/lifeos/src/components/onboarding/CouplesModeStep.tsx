import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Heart, User } from "lucide-react";

interface CouplesModeStepProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function CouplesModeStep({ value, onChange }: CouplesModeStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Building together?</h1>
        <p className="text-muted-foreground">
          Are you building this journey with a spouse or partner?
        </p>
      </div>

      <div className="grid gap-2">
        {[
          { label: "Yes, with my partner", val: true, icon: Heart },
          { label: "No, just me for now", val: false, icon: User },
        ].map(({ label, val, icon: Icon }) => (
          <Card
            key={label}
            role="button"
            tabIndex={0}
            onClick={() => onChange(val)}
            onKeyDown={(e) => e.key === "Enter" && onChange(val)}
            className={cn(
              "cursor-pointer transition-colors border-2 hover:border-primary/50",
              value === val ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
              {value === val && <Check className="h-5 w-5 text-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {value === true && (
        <p className="text-sm text-muted-foreground text-center">
          You can send a partner invite later from Settings — no setup needed right now.
        </p>
      )}
    </div>
  );
}
