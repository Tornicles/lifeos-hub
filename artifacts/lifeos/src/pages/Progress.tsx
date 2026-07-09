import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { TrendingUp, Target, Trophy } from "lucide-react";
import { useSavingsGoals, useSavingsChallenges } from "@/hooks/useFinance";

export default function Progress() {
  const { data: goals, isLoading: goalsLoading } = useSavingsGoals();
  const { data: challenges, isLoading: challengesLoading } = useSavingsChallenges();

  const sortedGoals = useMemo(() => {
    return [...(goals ?? [])].sort(
      (a, b) => Number(b.currentAmount) / Number(b.targetAmount) - Number(a.currentAmount) / Number(a.targetAmount)
    );
  }, [goals]);

  const sortedChallenges = useMemo(() => {
    return [...(challenges ?? [])].sort(
      (a, b) => Number(b.savedAmount) / Number(b.targetAmount) - Number(a.savedAmount) / Number(a.targetAmount)
    );
  }, [challenges]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="h-9 w-9 text-indigo-600" />
          Progress
        </h1>
        <p className="text-muted-foreground text-lg">A read-only look at how your savings are trending</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Savings Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goalsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : sortedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <p className="text-muted-foreground text-sm">No savings goals yet.</p>
              <p className="text-xs text-muted-foreground">Add one on the Finance page to track progress here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedGoals.map((goal) => {
                const current = Number(goal.currentAmount);
                const target = Number(goal.targetAmount);
                const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-muted-foreground">
                        ${current.toLocaleString()} / ${target.toLocaleString()} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <ProgressBar value={percent} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Savings Challenges Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {challengesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : sortedChallenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <p className="text-muted-foreground text-sm">No savings challenges yet.</p>
              <p className="text-xs text-muted-foreground">Start one on the Finance page to track progress here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedChallenges.map((c) => {
                const current = Number(c.savedAmount);
                const target = Number(c.targetAmount);
                const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                return (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">
                        ${current.toLocaleString()} / ${target.toLocaleString()} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <ProgressBar value={percent} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
