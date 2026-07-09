import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCurriculumDay, useUpdateDayProgress } from "@/hooks/useCurriculum";

/** Stack the Jar — first curriculum game (stub with completion CTA; full mechanics in follow-up) */
function StackJarGame({ modeLabel, onComplete }: { modeLabel: string; onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
      <div className="text-6xl">🫙</div>
      <h2 className="text-xl font-bold">Stack the Jar</h2>
      <p className="text-muted-foreground max-w-sm">{modeLabel}</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Flick coins into Needs, Wants, Savings, and Giving jars before they hit the bottom. Full interactive version coming soon.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {["Needs", "Wants", "Savings", "Giving"].map((jar) => (
          <div key={jar} className="rounded-xl border-2 border-dashed border-primary/40 p-4 text-sm font-medium">
            {jar}
          </div>
        ))}
      </div>
      <Button className="w-full max-w-xs h-14 min-h-[44px]" onClick={onComplete}>
        Complete game
      </Button>
    </div>
  );
}

export default function DayGame() {
  const { dayNumber: dayParam } = useParams();
  const dayNumber = Number(dayParam);
  const navigate = useNavigate();
  const { data: day, isLoading } = useCurriculumDay(dayNumber);
  const updateProgress = useUpdateDayProgress(dayNumber);

  const handleComplete = async () => {
    await updateProgress.mutateAsync({ gameCompleted: true });
    navigate("/dashboard");
  };

  if (isLoading || !day) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4 text-center border-b">
        <p className="text-sm text-muted-foreground">Day {dayNumber} · Game</p>
        <h1 className="font-bold">{day.topicTitle}</h1>
      </div>
      {day.gameType === "stack_jar" ? (
        <StackJarGame modeLabel={day.gameModeLabel} onComplete={handleComplete} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-muted-foreground">Game type "{day.gameType}" — interactive build coming soon.</p>
          <Button className="h-14 min-h-[44px]" onClick={handleComplete}>
            Mark game complete
          </Button>
        </div>
      )}
    </div>
  );
}
