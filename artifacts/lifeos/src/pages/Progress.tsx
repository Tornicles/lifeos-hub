import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Award, TrendingUp } from "lucide-react";
import { useCurriculumProgress } from "@/hooks/useCurriculum";

const LEVEL_BADGES = ["Seed", "Root", "Sprout", "Growth", "Harvest", "Legacy"];

export default function Progress() {
  const { data, isLoading } = useCurriculumProgress();

  return (
    <div className="space-y-6 animate-fade-in">
      {data?.stewardUnlocked && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-amber-600 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-amber-900">Steward</h2>
            <p className="text-amber-800">Season 1 complete — 90 days of faithful learning</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="h-9 w-9 text-indigo-600" />
          Progress
        </h1>
        <p className="text-muted-foreground text-lg">Streaks, badges, and quiz history</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{data?.streak.currentStreak ?? 0}</p>
            <p className="text-sm text-muted-foreground">Current streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{data?.streak.longestStreak ?? 0}</p>
            <p className="text-sm text-muted-foreground">Longest streak</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall completion</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="flex justify-between text-sm mb-2">
                <span>{data?.completionPercent ?? 0}% complete</span>
                <span className="text-muted-foreground">
                  {data?.lessonProgress.filter((l) => l.dayCompletedAt).length ?? 0} / 90 days
                </span>
              </div>
              <ProgressBar value={data?.completionPercent ?? 0} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Level badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {LEVEL_BADGES.map((name, i) => {
              const unlocked = data?.levelProgress.some((l) => l.levelId === i + 1 && l.badgeUnlocked);
              return (
                <Badge
                  key={name}
                  variant={unlocked ? "default" : "outline"}
                  className={`px-3 py-2 text-sm ${!unlocked ? "opacity-40" : ""}`}
                >
                  {unlocked ? "🏆" : "🔒"} {name}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quiz history</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !data?.lessonProgress.filter((l) => l.quizScore !== null).length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No quizzes completed yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.lessonProgress
                .filter((l) => l.quizScore !== null)
                .map((l) => (
                  <div key={l.dayNumber} className="flex justify-between text-sm border-b pb-2">
                    <span>Day {l.dayNumber}: {l.topicTitle}</span>
                    <span className="font-medium">{l.quizScore}/3</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
