import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal } from "lucide-react";
import { useBadges, useUserBadges } from "@/hooks/useGamification";

export function BadgesTab() {
  const { data: badges, isLoading } = useBadges();
  const { data: userBadges } = useUserBadges();

  const earnedIds = new Set(userBadges?.map((ub) => ub.badgeId));

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : badges && badges.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {badges.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <Card key={badge.id} className={earned ? "border-amber-300 bg-amber-50/50" : "opacity-60"}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Medal className={`h-10 w-10 ${earned ? "text-amber-500" : "text-muted-foreground"}`} />
                  <div className="font-semibold">{badge.name}</div>
                  {badge.description && <p className="text-xs text-muted-foreground">{badge.description}</p>}
                  {!earned && <span className="text-xs text-muted-foreground italic">Not yet earned</span>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Medal className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No badges available yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
