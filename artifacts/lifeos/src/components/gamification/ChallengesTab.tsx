import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, Check } from "lucide-react";
import { useChallenges, useChallengeCompletions, useCompleteChallenge } from "@/hooks/useGamification";

export function ChallengesTab() {
  const { data: challenges, isLoading } = useChallenges();
  const { data: completions } = useChallengeCompletions();
  const completeMutation = useCompleteChallenge();

  const isCompletedToday = (challengeId: number) => {
    const today = new Date().toDateString();
    return completions?.some(
      (c) => c.challengeId === challengeId && new Date(c.completedAt).toDateString() === today,
    );
  };

  const active = challenges?.filter((c) => c.isActive) ?? [];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : active.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {active.map((challenge) => {
            const done = isCompletedToday(challenge.id);
            return (
              <Card key={challenge.id} className={done ? "border-green-200 bg-green-50/50" : ""}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{challenge.name}</div>
                    {challenge.description && <p className="text-sm text-muted-foreground">{challenge.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {challenge.category && <Badge variant="outline">{challenge.category}</Badge>}
                      <Badge variant="outline" className="gap-1">
                        <Award className="h-3 w-3" />
                        {challenge.xpReward} XP
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={done ? "secondary" : "default"}
                    disabled={done || completeMutation.isPending}
                    onClick={() => completeMutation.mutate(challenge.id)}
                    className="gap-1 shrink-0"
                  >
                    {done ? <><Check className="h-4 w-4" />Done</> : "Complete"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active challenges right now.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
