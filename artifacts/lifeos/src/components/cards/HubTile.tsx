import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubTileProps {
  name: string;
  icon: LucideIcon;
  score?: number;
  onClick?: () => void;
  className?: string;
}

export function HubTile({ name, icon: Icon, score, onClick, className }: HubTileProps) {
  const getScoreColor = (value?: number) => {
    if (!value) return "text-muted-foreground";
    if (value >= 80) return "text-green-600";
    if (value >= 65) return "text-emerald-600";
    if (value >= 50) return "text-yellow-600";
    if (value >= 30) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (value?: number) => {
    if (!value) return "bg-muted/20";
    if (value >= 80) return "bg-green-50 dark:bg-green-950/20";
    if (value >= 65) return "bg-emerald-50 dark:bg-emerald-950/20";
    if (value >= 50) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (value >= 30) return "bg-orange-50 dark:bg-orange-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-md cursor-pointer",
        getScoreBg(score),
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className={cn("p-3 rounded-full bg-white/80 dark:bg-black/20", getScoreColor(score))}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-medium text-sm">{name}</h3>
        {score !== undefined ? (
          <p className={cn("text-2xl font-bold", getScoreColor(score))}>{score}</p>
        ) : (
          <p className="text-xs text-muted-foreground">No data</p>
        )}
      </div>
    </Card>
  );
}
