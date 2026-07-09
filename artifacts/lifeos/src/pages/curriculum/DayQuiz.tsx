import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDayQuiz, useUpdateDayProgress } from "@/hooks/useCurriculum";

export default function DayQuiz() {
  const { dayNumber: dayParam } = useParams();
  const dayNumber = Number(dayParam);
  const navigate = useNavigate();
  const { data, isLoading } = useDayQuiz(dayNumber);
  const updateProgress = useUpdateDayProgress(dayNumber);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  const question = data.questions[index];

  const handleReveal = () => setRevealed(true);

  const handleNext = async () => {
    if (!revealed) return;
    const nextScore = score + 1;
    if (index < data.questions.length - 1) {
      setScore(nextScore);
      setIndex(index + 1);
      setRevealed(false);
    } else {
      setDone(true);
      await updateProgress.mutateAsync({ quizCompleted: true, quizScore: nextScore });
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col justify-center p-6 max-w-lg mx-auto text-center gap-4">
        <h2 className="text-2xl font-bold">Quiz complete</h2>
        <p className="text-muted-foreground">You reviewed all {data.questions.length} questions.</p>
        <Button className="w-full h-14" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      <p className="text-sm text-muted-foreground mb-4">
        Question {index + 1} of {data.questions.length}
      </p>
      <Card className="flex-1 mb-6">
        <CardContent className="p-6 space-y-4">
          <p className="text-lg font-medium">{question.questionText}</p>
          {revealed ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm">
              <p className="font-medium text-green-800 mb-1">Answer</p>
              <p className="text-green-900">{question.answerText}</p>
            </div>
          ) : (
            <Button variant="outline" onClick={handleReveal} className="min-h-[44px]">
              Reveal answer
            </Button>
          )}
        </CardContent>
      </Card>
      <Button className="w-full h-14 min-h-[44px]" onClick={handleNext} disabled={!revealed}>
        {index < data.questions.length - 1 ? "Next question" : "Finish quiz"}
      </Button>
    </div>
  );
}
