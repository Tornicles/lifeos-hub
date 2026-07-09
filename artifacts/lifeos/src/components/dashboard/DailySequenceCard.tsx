import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, Target, Lock, CheckCircle2, Sparkles, Award } from "lucide-react";
import { useTodayLesson, useQuizAttempts, useLessonProgress } from "@/hooks/useAcademy";
import { useChallenges, useChallengeCompletions, useCompleteChallenge } from "@/hooks/useGamification";

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type StepStatus = "done" | "active" | "locked" | "skipped";

function StepRow({
  status,
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  status: StepStatus;
  icon: typeof BookOpen;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${
        status === "locked" ? "opacity-50" : status === "done" ? "border-green-200 bg-green-50/50" : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="shrink-0">
        {status === "done" ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        ) : status === "locked" ? (
          <Lock className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Icon className="h-6 w-6 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function DailySequenceCard() {
  const navigate = useNavigate();
  const { data: todayLesson, isLoading: lessonLoading } = useTodayLesson();
  const { data: attempts, isLoading: attemptsLoading } = useQuizAttempts();
  const { data: challenges, isLoading: challengesLoading } = useChallenges();
  const { data: completions, isLoading: completionsLoading } = useChallengeCompletions();
  const { data: lessonProgress, isLoading: progressLoading } = useLessonProgress();
  const completeMutation = useCompleteChallenge();
  const [responseText, setResponseText] = useState("");
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  const isLoading = lessonLoading || attemptsLoading || challengesLoading || completionsLoading || progressLoading;

  const lessonDone = !!(
    todayLesson && lessonProgress?.some((p) => p.lessonId === todayLesson.id && p.completed)
  );

  const todayQuizId = todayLesson?.quizId ?? null;
  const quizDone = useMemo(() => {
    if (todayQuizId === null || !attempts) return false;
    const now = new Date();
    return attempts.some((a) => a.quizId === todayQuizId && a.attemptedAt && isSameLocalDay(new Date(a.attemptedAt), now));
  }, [attempts, todayQuizId]);

  const challenge = useMemo(
    () => challenges?.find((c) => c.lessonId === todayLesson?.id) ?? null,
    [challenges, todayLesson],
  );
  const challengeDone = useMemo(() => {
    if (!challenge || !completions) return false;
    const now = new Date();
    return completions.some(
      (c) => c.challengeId === challenge.id && isSameLocalDay(new Date(c.completedAt), now),
    );
  }, [completions, challenge]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Today's Sequence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!todayLesson) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Today's Sequence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center gap-1">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <p className="font-medium">You're all caught up!</p>
            <p className="text-sm text-muted-foreground">No lessons left in the library right now.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const quizStatus: StepStatus = todayQuizId === null ? "skipped" : quizDone ? "done" : lessonDone ? "active" : "locked";
  const challengeStatus: StepStatus = !challenge
    ? "skipped"
    : challengeDone
      ? "done"
      : (todayQuizId === null ? lessonDone : quizDone)
        ? "active"
        : "locked";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Today's Sequence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StepRow
          status={lessonDone ? "done" : "active"}
          icon={BookOpen}
          title={todayLesson.title}
          subtitle={lessonDone ? "Lesson complete" : `${todayLesson.topicName} · Lesson`}
          action={
            <Button
              size="sm"
              variant={lessonDone ? "secondary" : "default"}
              onClick={() => navigate(`/academy/lessons/${todayLesson.id}`)}
              className="shrink-0"
            >
              {lessonDone ? "Review" : "Start"}
            </Button>
          }
        />

        {quizStatus !== "skipped" && (
          <StepRow
            status={quizStatus}
            icon={Brain}
            title="Today's Quiz"
            subtitle={quizStatus === "locked" ? "Finish the lesson to unlock" : quizStatus === "done" ? "Quiz complete" : "Test what you learned"}
            action={
              quizStatus !== "locked" ? (
                <Button
                  size="sm"
                  variant={quizStatus === "done" ? "secondary" : "default"}
                  onClick={() => navigate("/quiz")}
                  className="shrink-0"
                >
                  {quizStatus === "done" ? "Review" : "Take Quiz"}
                </Button>
              ) : undefined
            }
          />
        )}

        {challenge && (
          <>
            <StepRow
              status={challengeStatus}
              icon={Target}
              title={challenge.name}
              subtitle={
                challengeStatus === "locked"
                  ? todayQuizId === null
                    ? "Finish the lesson to unlock"
                    : "Finish today's quiz to unlock"
                  : challengeStatus === "done"
                    ? "Challenge complete"
                    : "Put it into practice"
              }
              action={
                challengeStatus === "active" ? (
                  <Button size="sm" onClick={() => setShowChallengeForm((v) => !v)} className="shrink-0">
                    {showChallengeForm ? "Cancel" : "Complete"}
                  </Button>
                ) : challengeStatus === "done" ? (
                  <Badge variant="outline" className="gap-1 shrink-0">
                    <Award className="h-3 w-3" />
                    {challenge.xpReward} XP
                  </Badge>
                ) : undefined
              }
            />
            {challengeStatus === "active" && showChallengeForm && (
              <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
                {challenge.description && <p className="text-sm text-muted-foreground">{challenge.description}</p>}
                <Textarea
                  placeholder="What did you do or notice? (optional)"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={3}
                />
                <Button
                  size="sm"
                  disabled={completeMutation.isPending}
                  onClick={() =>
                    completeMutation.mutate(challenge.id, responseText.trim() || undefined, {
                      onSuccess: () => {
                        setShowChallengeForm(false);
                        setResponseText("");
                      },
                    })
                  }
                >
                  Mark Complete
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
