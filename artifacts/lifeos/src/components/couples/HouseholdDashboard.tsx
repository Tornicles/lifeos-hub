import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Target, Gamepad2 } from "lucide-react";
import { useHouseholdDashboard } from "@/hooks/useCouplesGames";

export function HouseholdDashboard({ coupleId }: { coupleId: string }) {
  const { data, isLoading, isError } = useHouseholdDashboard(coupleId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Household dashboard isn't available until both partners are linked.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Household Dashboard
        </CardTitle>
        <CardDescription>Your combined progress as a team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3 text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">
              {data.streaks.reduce((sum, s) => sum + s.streak, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Combined streak days</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{data.teamXp}</div>
            <div className="text-xs text-muted-foreground">Team XP</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
            <div className="text-2xl font-bold">{data.recentGames.length}</div>
            <div className="text-xs text-muted-foreground">Recent games</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" /> Shared Goals
          </div>
          {data.sharedGoals.length > 0 ? (
            <div className="space-y-2">
              {data.sharedGoals.map((goal) => {
                const pct = Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{goal.name}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No shared savings goals yet.</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Recent game activity</div>
          {data.recentGames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.recentGames.map((s) => (
                <Badge key={s.id} variant={s.status === "completed" ? "default" : "outline"}>
                  {s.status}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No games played yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
