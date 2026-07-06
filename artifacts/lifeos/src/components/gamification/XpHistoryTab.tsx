import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { useXpEvents } from "@/hooks/useGamification";
import { format } from "date-fns";

export function XpHistoryTab() {
  const { data: events, isLoading } = useXpEvents();
  const sorted = events ? [...events].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()) : [];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{event.eventType}</div>
                  {event.createdAt && (
                    <div className="text-sm text-muted-foreground">{format(new Date(event.createdAt), "MMM d, yyyy h:mm a")}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-lg font-bold text-purple-600">
                  <Zap className="h-4 w-4" />
                  +{event.xpAmount}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No XP earned yet. Complete lessons and challenges to start earning.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
