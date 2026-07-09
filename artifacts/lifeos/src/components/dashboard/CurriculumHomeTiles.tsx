import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Brain, Gamepad2, Moon, CheckCircle2, Flame } from "lucide-react";
import { useCurrentDay, useCurriculumProgress } from "@/hooks/useCurriculum";
import { useUser } from "@clerk/react";

function Tile({
  title,
  subtitle,
  locked,
  done,
  icon: Icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  locked: boolean;
  done?: boolean;
  icon: typeof Brain;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${locked ? "opacity-50" : "hover:shadow-md hover:border-primary/40"}`}
      onClick={locked ? undefined : onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0">
          {done ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : locked ? (
            <Lock className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Icon className="h-8 w-8 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CurriculumHomeTiles() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: day, isLoading } = useCurrentDay();
  const { data: progress } = useCurriculumProgress();

  const hour = new Date().getHours();
  const showNightPrayer = hour >= 20;

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!day) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Curriculum not seeded yet. Run the seed script to load Day 1.
        </CardContent>
      </Card>
    );
  }

  const p = day.progress;
  const cardsDone = !!p?.cardsCompletedAt;
  const quizDone = !!p?.quizCompletedAt;
  const gameDone = !!p?.gameCompletedAt;
  const dayDone = !!p?.dayCompletedAt;
  const prayerDone = !!p?.morningPrayerViewedAt;
  const nightDone = !!p?.nightPrayerViewedAt;

  const firstName = user?.firstName ?? "friend";
  const streak = progress?.streak.currentStreak ?? 0;

  let statusLabel = "Start with morning prayer";
  if (prayerDone && !cardsDone) statusLabel = "Continue lesson cards";
  else if (cardsDone && (!quizDone || !gameDone)) statusLabel = "Quiz and game unlocked";
  else if (dayDone) statusLabel = "Day complete — great work!";

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-lg font-medium">Hello, {firstName}</p>
          <div className="flex items-center gap-2 mt-1 text-primary-foreground/80">
            <Flame className="h-4 w-4" />
            <span>{streak} day streak</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Day {day.dayNumber}: {day.topicTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{statusLabel}</p>
          {!prayerDone && (
            <Button className="w-full mb-2" onClick={() => navigate(`/day/${day.dayNumber}/morning`)}>
              Start morning prayer
            </Button>
          )}
          {prayerDone && !cardsDone && (
            <Button className="w-full mb-2" onClick={() => navigate(`/day/${day.dayNumber}/cards`)}>
              Continue cards
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          title="Quiz"
          subtitle={cardsDone ? (quizDone ? "Complete" : "Test what you learned") : "Complete today's lesson cards to unlock"}
          locked={!cardsDone}
          done={quizDone}
          icon={Brain}
          onClick={() => navigate(`/day/${day.dayNumber}/quiz`)}
        />
        <Tile
          title="Game"
          subtitle={cardsDone ? (gameDone ? "Complete" : day.gameModeLabel) : "Complete today's lesson cards to unlock"}
          locked={!cardsDone}
          done={gameDone}
          icon={Gamepad2}
          onClick={() => navigate(`/day/${day.dayNumber}/game`)}
        />
      </div>

      {showNightPrayer && dayDone && !nightDone && (
        <Tile
          title="Night Prayer"
          subtitle="Close your day with Scripture"
          locked={false}
          icon={Moon}
          onClick={() => navigate(`/day/${day.dayNumber}/night`)}
        />
      )}
    </div>
  );
}
