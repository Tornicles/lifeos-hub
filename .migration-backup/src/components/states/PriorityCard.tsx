import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Target } from "lucide-react";

interface PriorityCardProps {
  priorityZone: string;
  priorityHub?: string;
  priorityScore?: number;
  dangerLevel?: string;
}

export function PriorityCard({ 
  priorityZone, 
  priorityHub, 
  priorityScore,
  dangerLevel = 'Medium'
}: PriorityCardProps) {
  const getDangerColor = () => {
    switch (dangerLevel) {
      case 'Emergency': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'High': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'Low': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'None': return 'bg-green-500/10 text-green-600 border-green-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Priority Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Today's Priority Zone</p>
          <p className="text-2xl font-bold">{priorityZone}</p>
        </div>

        {priorityHub && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Primary Hub</p>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-semibold">{priorityHub}</span>
            </div>
            {priorityScore !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Priority Score: {priorityScore.toFixed(1)}
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Danger Level</span>
            <Badge className={`text-xs ${getDangerColor()}`}>
              {dangerLevel}
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t text-xs text-muted-foreground">
          <p>Focus your energy on this area to maximize impact and maintain system balance.</p>
        </div>
      </CardContent>
    </Card>
  );
}
