import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface ScoreCardProps {
  title: string;
  score: number;
  icon?: LucideIcon;
  description?: string;
  showProgress?: boolean;
  onClick?: () => void;
}

export function ScoreCard({ 
  title, 
  score, 
  icon: Icon, 
  description, 
  showProgress = true,
  onClick 
}: ScoreCardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return { bg: 'bg-green-50 border-green-200', text: 'text-green-600', badge: 'default' };
    if (value >= 60) return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-600', badge: 'default' };
    if (value >= 40) return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-600', badge: 'secondary' };
    return { bg: 'bg-red-50 border-red-200', text: 'text-red-600', badge: 'destructive' };
  };

  const getStateLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Needs Focus';
  };

  const colors = getScoreColor(score);

  return (
    <Card 
      className={`${colors.bg} transition-all hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant={colors.badge as any}>
            {getStateLabel(score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Score</span>
          <span className={`text-4xl font-bold ${colors.text}`}>
            {score.toFixed(1)}
          </span>
        </div>
        {showProgress && (
          <Progress value={score} className="h-2" />
        )}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
