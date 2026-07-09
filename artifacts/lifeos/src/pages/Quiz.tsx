import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, CheckCircle2, XCircle, Sparkles, History, Trophy } from "lucide-react";
import { useTodayLesson, useQuiz, useQuizAttempts } from "@/hooks/useAcademy";

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Quiz() {
  const navigate = useNavigate();
  const { data: todayLesson, isLoading: lessonLoading } = useTodayLesson();
  const { data: attempts, isLoading: attemptsLoading } = useQuizAttempts();

  const todayQuizId = todayLesson?.quizId ?? null;
  const { data: todayQuiz, isLoading: quizLoading } = useQuiz(todayQuizId);

  const todaysAttempt = useMemo(() => {
    if (!attempts || todayQuizId === null) return undefined;
    const now = new Date();
    return attempts
      .filter((a) => a.quizId === todayQuizId && a.attemptedAt && isSameLocalDay(new Date(a.attemptedAt), now))
      .sort((a, b) => new Date(b.attemptedAt ?? 0).getTime() - new Date(a.attemptedAt ?? 0).getTime())[0];
  }, [attempts, todayQuizId]);

  const history = useMemo(
    () =>
      [...(attempts ?? [])].sort(
        (a, b) => new Date(b.attemptedAt ?? 0).getTime() - new Date(a.attemptedAt ?? 0).getTime(),
      ),
    [attempts],
  );

  const answersByQuestionId = useMemo(() => {
    const map = new Map<number, string>();
    const raw = todaysAttempt?.answers as Array<{ questionId: number; selectedOptionId: string }> | null | undefined;
    if (Array.isArray(raw)) {
      for (const a of raw) map.set(a.questionId, a.selectedOptionId);
    }
    return map;
  }, [todaysAttempt]);

  const isLoading = lessonLoading || attemptsLoading || (todayQuizId !== null && quizLoading);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Brain className="h-9 w-9 text-purple-600" />
          Quiz
        </h1>
        <p className="text-muted-foreground text-lg">Test what you learned from today's lesson.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : todayQuizId === null ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No quiz for today's lesson yet</h3>
            <p className="text-muted-foreground">Check back once a quiz has been added for this lesson.</p>
          </CardContent>
        </Card>
      ) : todaysAttempt && todayQuiz ? (
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                {todayQuiz.title}
              </CardTitle>
              <Badge variant={todaysAttempt.score === todaysAttempt.totalQuestions ? "default" : "secondary"}>
                {todaysAttempt.score}/{todaysAttempt.totalQuestions} correct
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You've already completed today's quiz. Here's a review of your answers.
            </p>
            <div className="space-y-3">
              {todayQuiz.questions.map((q, i) => {
                const selected = answersByQuestionId.get(q.id);
                const correct = selected === q.correctAnswer;
                const options = (q.options as Array<{ id: string; text: string }>) ?? [];
                const selectedText = options.find((o) => o.id === selected)?.text;
                const correctText = options.find((o) => o.id === q.correctAnswer)?.text;
                return (
                  <div key={q.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      {correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <p className="font-medium">
                          {i + 1}. {q.questionText}
                        </p>
                        <p className="text-sm text-muted-foreground">Your answer: {selectedText ?? "—"}</p>
                        {!correct && <p className="text-sm text-muted-foreground">Correct answer: {correctText}</p>}
                        {q.explanation && <p className="text-sm text-purple-700">{q.explanation}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : todayQuiz ? (
        <Card
          className="cursor-pointer border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:border-purple-400 transition-colors"
          onClick={() => navigate(`/quiz/${todayQuiz.id}/take`)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
              <Sparkles className="h-4 w-4" />
              Today's Quiz
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{todayQuiz.title}</h2>
                <p className="text-base text-muted-foreground mt-1">
                  {todayQuiz.questions.length} question{todayQuiz.questions.length === 1 ? "" : "s"} · one attempt per day
                </p>
              </div>
              <Button
                size="lg"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/quiz/${todayQuiz.id}/take`);
                }}
              >
                Take Today's Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-purple-600" />
          History
        </h3>
        {attemptsLoading ? (
          <Skeleton className="h-16" />
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No quiz attempts yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.quizTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.attemptedAt
                        ? new Date(a.attemptedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <Badge variant={a.score === a.totalQuestions ? "default" : "secondary"} className="shrink-0">
                    {a.score}/{a.totalQuestions}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
