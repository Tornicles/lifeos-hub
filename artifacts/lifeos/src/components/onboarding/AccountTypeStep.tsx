import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Users } from "lucide-react";

export type AccountType = "individual" | "couple";

interface AccountTypeStepProps {
  value: AccountType | null;
  onChange: (value: AccountType) => void;
}

const options: { value: AccountType; label: string; description: string; icon: typeof User }[] = [
  { value: "individual", label: "Individual", description: "I'm setting goals for myself", icon: User },
  { value: "couple", label: "Couple", description: "We're growing together", icon: Users },
];

export function AccountTypeStep({ value, onChange }: AccountTypeStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">How will you use LifeOS?</h1>
        <p className="text-muted-foreground">You can change this later</p>
      </div>
      <div className="grid gap-3">
        {options.map(({ value: optionValue, label, description, icon: Icon }) => (
          <Card
            key={optionValue}
            role="button"
            tabIndex={0}
            onClick={() => onChange(optionValue)}
            onKeyDown={(e) => e.key === "Enter" && onChange(optionValue)}
            className={cn(
              "cursor-pointer transition-colors border-2 hover:border-primary/50",
              value === optionValue ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                value === optionValue ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold text-lg">{label}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
