import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurriculumDay, useUpdateDayProgress } from "@/hooks/useCurriculum";

export default function MorningPrayer() {
  const { dayNumber: dayParam } = useParams();
  const dayNumber = Number(dayParam);
  const navigate = useNavigate();
  const { data: day, isLoading } = useCurriculumDay(dayNumber);
  const updateProgress = useUpdateDayProgress(dayNumber);

  if (isLoading || !day) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-amber-50/80 to-background">
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  const handleBegin = async () => {
    await updateProgress.mutateAsync({ morningPrayerViewed: true });
    navigate(`/day/${dayNumber}/cards`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/80 via-background to-background">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-lg mx-auto w-full">
        <p className="text-sm text-muted-foreground mb-2">Day {dayNumber}</p>
        <p className="text-sm font-medium text-primary mb-6">{day.morningVerseReference}</p>
        <blockquote className="text-base italic text-muted-foreground mb-8 border-l-2 border-primary/30 pl-4">
          "{day.morningVerse}"
        </blockquote>
        <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">{day.morningPrayer}</p>
      </div>
      <div className="p-6 pb-10 max-w-lg mx-auto w-full">
        <Button className="w-full h-14 text-base" size="lg" onClick={handleBegin} disabled={updateProgress.isPending}>
          Amen, let's begin
        </Button>
      </div>
    </div>
  );
}
