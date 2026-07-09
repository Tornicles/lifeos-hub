import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { useQuiz, useSubmitQuizAttempt } from "@/hooks/useAcademy";

interface QuestionOption {
  id: string;
  text: string;
}

export default function QuizTake() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const id = quizId ? Number(quizId) : null;
  const { data: quiz, isLoading } = useQuiz(id);
  const submitAttempt = useSubmitQuizAttempt();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [submittedResult, setSubmittedResult] = useState<{ score: number; total: number } | null>(null);

  const questions = quiz?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const currentOptions = (currentQuestion?.options as QuestionOption[]) ?? [];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasSelection = currentQuestion ? selections[currentQuestion.id] !== undefined : false;

  const answersDetail = useMemo(
    () =>
      questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: selections[q.id] ?? null,
        correct: selections[q.id] === q.correctAnswer,
      })),
    [questions, selections],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/quiz")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Quiz
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">This quiz could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submittedResult) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Results
              </CardTitle>
              <Badge variant={submittedResult.score === submittedResult.total ? "default" : "secondary"}>
                {submittedResult.score}/{submittedResult.total} correct
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {questions.map((q, i) => {
                const detail = answersDetail[i];
                const options = (q.options as QuestionOption[]) ?? [];
                const selectedText = options.find((o) => o.id === detail.selectedOptionId)?.text;
                const correctText = options.find((o) => o.id === q.correctAnswer)?.text;
                return (
                  <div key={q.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      {detail.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <p className="font-medium">
                          {i + 1}. {q.questionText}
                        </p>
                        <p className="text-sm text-muted-foreground">Your answer: {selectedText ?? "—"}</p>
                        {!detail.correct && (
                          <p className="text-sm text-muted-foreground">Correct answer: {correctText}</p>
                        )}
                        {q.explanation && <p className="text-sm text-purple-700">{q.explanation}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate("/quiz")}>
              Back to Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelect = (optionId: string) => {
    if (!currentQuestion) return;
    setSelections((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleNext = () => {
    if (!hasSelection) return;
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    const score = answersDetail.filter((a) => a.correct).length;
    submitAttempt.mutate(
      {
        quizId: quiz.id,
        score,
        totalQuestions: questions.length,
        answers: answersDetail,
      },
      {
        onSuccess: () => {
          setSubmittedResult({ score, total: questions.length });
        },
        onAlreadyAttemptedToday: () => {
          navigate("/quiz");
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full ${i <= currentIndex ? "bg-purple-600" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion?.questionText}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentOptions.map((option) => {
            const selected = currentQuestion && selections[currentQuestion.id] === option.id;
            return (
              <Button
                key={option.id}
                variant={selected ? "default" : "outline"}
                size="lg"
                className="w-full min-h-11 h-auto justify-start whitespace-normal text-left py-3"
                onClick={() => handleSelect(option.id)}
              >
                {option.text}
              </Button>
            );
          })}

          <Button
            size="lg"
            className="w-full mt-2"
            disabled={!hasSelection || submitAttempt.isPending}
            onClick={handleNext}
          >
            {isLastQuestion ? (submitAttempt.isPending ? "Submitting..." : "Submit") : "Next"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
