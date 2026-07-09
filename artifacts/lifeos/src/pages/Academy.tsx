import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useCurriculumDays } from "@/hooks/useCurriculum";

export default function Academy() {
  const navigate = useNavigate();
  const { data: days, isLoading } = useCurriculumDays();

  const grouped = useMemo(() => {
    if (!days) return [];
    const levels = new Map<string, { levelName: string; requiresDisclaimer: boolean; days: typeof days }>();
    for (const day of days) {
      const key = day.levelName ?? `Level ${day.levelId}`;
      if (!levels.has(key)) {
        levels.set(key, {
          levelName: key,
          requiresDisclaimer: day.requiresDisclaimer ?? day.dayNumber >= 61,
          days: [],
        });
      }
      levels.get(key)!.days.push(day);
    }
    return Array.from(levels.values());
  }, [days]);

  const handleDayClick = (day: NonNullable<typeof days>[number]) => {
    if (day.status === "locked") return;
    if (day.progress?.dayCompletedAt) {
      navigate(`/academy/day/${day.dayNumber}`);
      return;
    }
    if (!day.progress?.morningPrayerViewedAt) {
      navigate(`/day/${day.dayNumber}/morning`);
    } else if (!day.progress?.cardsCompletedAt) {
      navigate(`/day/${day.dayNumber}/cards`);
    } else if (!day.progress?.quizCompletedAt) {
      navigate(`/day/${day.dayNumber}/quiz`);
    } else if (!day.progress?.gameCompletedAt) {
      navigate(`/day/${day.dayNumber}/game`);
    } else {
      navigate(`/day/${day.dayNumber}/morning`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <GraduationCap className="h-9 w-9 text-purple-600" />
          Academy
        </h1>
        <p className="text-muted-foreground text-lg">90-day financial curriculum — sequential, one day at a time</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !days?.length ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Curriculum not loaded. Run <code className="text-xs bg-muted px-1 rounded">scripts/seed-curriculum.ts</code> to seed levels and Day 1.
          </CardContent>
        </Card>
      ) : (
        grouped.map((group) => (
          <Card key={group.levelName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {group.levelName}
                {group.requiresDisclaimer && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Education only
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {group.days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    disabled={day.status === "locked"}
                    onClick={() => handleDayClick(day)}
                    className={`rounded-lg border p-2 text-left text-xs transition-colors min-h-[72px] ${
                      day.status === "locked"
                        ? "opacity-40 cursor-not-allowed bg-muted/30"
                        : day.status === "current"
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : day.progress?.dayCompletedAt
                            ? "border-green-200 bg-green-50/50 hover:bg-green-50"
                            : "hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">D{day.dayNumber}</span>
                      {day.status === "locked" ? (
                        <Lock className="h-3 w-3" />
                      ) : day.progress?.dayCompletedAt ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-muted-foreground leading-tight">{day.topicTitle}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
