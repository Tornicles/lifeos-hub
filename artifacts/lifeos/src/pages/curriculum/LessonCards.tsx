import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useCurriculumDay, useLessonCards, useUpdateDayProgress } from "@/hooks/useCurriculum";

const DWELL_MS = 4500;

export default function LessonCards() {
  const { dayNumber: dayParam } = useParams();
  const dayNumber = Number(dayParam);
  const navigate = useNavigate();
  const { data: day, isLoading: dayLoading } = useCurriculumDay(dayNumber);
  const { data: cards, isLoading: cardsLoading } = useLessonCards(dayNumber);
  const updateProgress = useUpdateDayProgress(dayNumber);

  const [index, setIndex] = useState(0);
  const [dwellReady, setDwellReady] = useState(false);
  const [finished, setFinished] = useState(false);

  const card = cards?.[index];
  const total = cards?.length ?? 12;

  useEffect(() => {
    setDwellReady(false);
    const timer = setTimeout(() => setDwellReady(true), DWELL_MS);
    return () => clearTimeout(timer);
  }, [index]);

  if (dayLoading || cardsLoading || !day || !cards?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  const showDisclaimer = day.level?.requiresDisclaimer;

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col justify-center p-6 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-2">Cards complete!</h2>
        <p className="text-muted-foreground mb-6">
          {day.articleBody
            ? `Read the full article on ${day.topicTitle}`
            : `Full article coming soon for ${day.topicTitle}`}
        </p>
        <Button
          className="w-full h-14"
          onClick={async () => {
            await updateProgress.mutateAsync({ cardsCompleted: true });
            navigate("/dashboard");
          }}
        >
          Continue to Dashboard
        </Button>
      </div>
    );
  }

  const handleNext = () => {
    if (!dwellReady) return;
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-4 pt-6 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Card {index + 1} of {total}</span>
          <span className="capitalize">{card?.cardType}</span>
        </div>
        <Progress value={((index + 1) / total) * 100} className="h-1" />
      </div>

      {showDisclaimer && (
        <div className="mx-4 mt-4 max-w-lg mx-auto w-full rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          This content is for financial education purposes only and is not personalized financial, investment, tax, or legal advice.
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border bg-card p-8 shadow-sm min-h-[280px] flex flex-col justify-center">
          <Badge variant="outline" className="w-fit mb-4 capitalize">{card?.cardType}</Badge>
          <p className="text-lg leading-relaxed">{card?.content}</p>
        </div>
      </div>

      <div className="p-6 pb-10 max-w-lg mx-auto w-full space-y-3">
        {!dwellReady && (
          <Progress value={undefined} className="h-1 animate-pulse" />
        )}
        <Button className="w-full h-12 gap-2" onClick={handleNext} disabled={!dwellReady}>
          {index < total - 1 ? "Next card" : "Finish cards"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
