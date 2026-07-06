import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UltraDomainTileProps {
  name: string;
  score: number;
  trend?: number;
  onClick?: () => void;
}

export function UltraDomainTile({ name, score, trend = 0, onClick }: UltraDomainTileProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 65) return "text-emerald-600";
    if (value >= 50) return "text-yellow-600";
    if (value >= 30) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (value: number) => {
    if (value >= 80) return "bg-green-50 dark:bg-green-950/20 border-green-200";
    if (value >= 65) return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200";
    if (value >= 50) return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200";
    if (value >= 30) return "bg-orange-50 dark:bg-orange-950/20 border-orange-200";
    return "bg-red-50 dark:bg-red-950/20 border-red-200";
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-md cursor-pointer border-2",
        getScoreBg(score)
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm leading-tight">{name}</h3>
          {getTrendIcon()}
        </div>
        <p className={cn("text-3xl font-bold", getScoreColor(score))}>{score}</p>
        {trend !== 0 && (
          <p className="text-xs text-muted-foreground">
            {trend > 0 ? "+" : ""}{trend} from last week
          </p>
        )}
      </div>
    </Card>
  );
}
