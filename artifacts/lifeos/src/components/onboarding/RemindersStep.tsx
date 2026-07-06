import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

interface RemindersStepProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function RemindersStep({ value, onChange }: RemindersStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Enable daily reminders?</h1>
        <p className="text-muted-foreground">We'll remind you once a day to keep your streak going</p>
      </div>
      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <Label htmlFor="reminders-toggle" className="font-medium text-base">
              Daily reminders
            </Label>
          </div>
          <Switch
            id="reminders-toggle"
            checked={value ?? false}
            onCheckedChange={onChange}
          />
        </CardContent>
      </Card>
      {value === null && (
        <p className="text-sm text-muted-foreground text-center">
          Choose on or off to continue
        </p>
      )}
    </div>
  );
}
