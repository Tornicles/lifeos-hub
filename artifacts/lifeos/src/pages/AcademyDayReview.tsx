import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useCurriculumDay, useLessonCards } from "@/hooks/useCurriculum";

export default function AcademyDayReview() {
  const { dayNumber: dayParam } = useParams();
  const dayNumber = Number(dayParam);
  const navigate = useNavigate();
  const { data: day, isLoading } = useCurriculumDay(dayNumber);
  const { data: cards, isLoading: cardsLoading } = useLessonCards(dayNumber);

  if (isLoading || cardsLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!day) {
    return <p className="text-muted-foreground">Day not found.</p>;
  }

  const showDisclaimer = day.level?.requiresDisclaimer ?? dayNumber >= 61;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" className="gap-2" onClick={() => navigate("/academy")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Academy
      </Button>

      <div>
        <p className="text-sm text-muted-foreground">Day {dayNumber}</p>
        <h1 className="text-3xl font-bold">{day.topicTitle}</h1>
        {day.level && <Badge variant="secondary" className="mt-2">{day.level.name}</Badge>}
      </div>

      {showDisclaimer && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          This content is for financial education purposes only and is not personalized financial, investment, tax, or legal advice.
        </div>
      )}

      {day.articleBody ? (
        <article className="prose prose-sm max-w-none whitespace-pre-line leading-relaxed">
          {day.articleBody}
        </article>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Lesson cards (read-only review)</p>
          {cards?.map((card) => (
            <div key={card.id} className="rounded-lg border p-4">
              <Badge variant="outline" className="mb-2 capitalize">{card.cardType}</Badge>
              <p className="text-sm leading-relaxed">{card.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
