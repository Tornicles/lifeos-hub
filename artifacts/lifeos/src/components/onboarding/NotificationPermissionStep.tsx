import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Sun, Moon } from "lucide-react";

interface NotificationPermissionStepProps {
  onComplete: (enabled: boolean) => void;
}

export function NotificationPermissionStep({ onComplete }: NotificationPermissionStepProps) {
  const [requested, setRequested] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      onComplete(false);
      return;
    }
    setRequested(true);
    const result = await Notification.requestPermission();
    setPermission(result);
    onComplete(result === "granted");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Daily touchpoints</h1>
        <p className="text-muted-foreground">
          Tech-Tate sends two gentle reminders each day to keep your journey on track.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Sun className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Morning prayer & verse</p>
              <p className="text-sm text-muted-foreground">Start each day with Scripture and reflection</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Moon className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Night prayer at 8:00 PM</p>
              <p className="text-sm text-muted-foreground">Close your day with gratitude and wisdom</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {permission === "unsupported" ? (
        <p className="text-sm text-center text-muted-foreground">
          Push notifications aren't supported in this browser. You can still use in-app reminders.
        </p>
      ) : permission === "granted" ? (
        <p className="text-sm text-center text-green-600">Notifications enabled</p>
      ) : (
        <Button className="w-full gap-2" onClick={requestPermission} disabled={requested && permission === "denied"}>
          <Bell className="h-4 w-4" />
          Enable notifications
        </Button>
      )}

      <Button variant="ghost" className="w-full" onClick={() => onComplete(permission === "granted")}>
        {permission === "granted" ? "Continue" : "Continue without notifications"}
      </Button>
    </div>
  );
}
