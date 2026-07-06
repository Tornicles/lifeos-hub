import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, AlertTriangle, AlertOctagon } from "lucide-react";

interface WeakestCardProps {
  hubName: string;
  score: number;
  hubCode?: string;
}

export function WeakestCard({ hubName, score, hubCode }: WeakestCardProps) {
  const getScoreColor = () => {
    if (score < 20) return 'text-red-600';
    if (score < 30) return 'text-orange-600';
    if (score < 40) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  const getAlertLevel = () => {
    if (score < 20) {
      return {
        badge: 'CRITICAL HUB',
        icon: AlertOctagon,
        variant: 'destructive' as const
      };
    }
    if (score < 30) {
      return {
        badge: 'EMERGENCY HUB',
        icon: AlertTriangle,
        variant: 'destructive' as const
      };
    }
    if (score < 40) {
      return {
        badge: 'NEEDS ATTENTION',
        icon: AlertTriangle,
        variant: 'secondary' as const
      };
    }
    return null;
  };

  const alertLevel = getAlertLevel();
  const AlertIcon = alertLevel?.icon;

  return (
    <Card className="border-2 border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" />
          Weakest Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-bold">{hubName}</p>
          {hubCode && (
            <p className="text-xs text-muted-foreground uppercase mt-1">{hubCode}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Score</span>
            <span className={`text-2xl font-bold ${getScoreColor()}`}>
              {score.toFixed(1)}
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {alertLevel && AlertIcon && (
          <Badge variant={alertLevel.variant} className="gap-1">
            <AlertIcon className="w-3 h-3" />
            {alertLevel.badge}
          </Badge>
        )}

        <div className="pt-3 border-t text-xs text-muted-foreground">
          <p>This area requires immediate attention and should be your primary focus today.</p>
        </div>
      </CardContent>
    </Card>
  );
}
