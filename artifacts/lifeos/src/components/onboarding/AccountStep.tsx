import { Card, CardContent } from "@/components/ui/card";
import { Check, User } from "lucide-react";
import { useUser } from "@clerk/react";

export function AccountStep() {
  const { user } = useUser();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Account created</h1>
        <p className="text-muted-foreground">You're signed in and ready to continue</p>
      </div>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.fullName ?? user?.primaryEmailAddress?.emailAddress}</p>
            <p className="text-sm text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <Check className="h-5 w-5 text-green-600 shrink-0" />
        </CardContent>
      </Card>
    </div>
  );
}
