import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Activity,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

interface StateCardProps {
  ultraScore: number;
  stateLevelOverride?: 'EXCELLENT' | 'STABLE' | 'WARNING' | 'DANGER' | 'CRITICAL';
}

export function StateCard({ ultraScore, stateLevelOverride }: StateCardProps) {
  const getStateInfo = () => {
    const score = ultraScore;
    
    if (score >= 80) {
      return {
        label: 'EXCELLENT',
        description: 'Peak performance - focus on growth',
        icon: CheckCircle2,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-600',
        borderColor: 'border-green-500/30'
      };
    } else if (score >= 60) {
      return {
        label: 'STABLE',
        description: 'Solid foundation - rebalance',
        icon: Activity,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-500/30'
      };
    } else if (score >= 40) {
      return {
        label: 'WARNING',
        description: 'Attention needed',
        icon: AlertCircle,
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-600',
        borderColor: 'border-yellow-500/30'
      };
    } else if (score >= 25) {
      return {
        label: 'DANGER',
        description: 'Take corrective actions',
        icon: AlertTriangle,
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-600',
        borderColor: 'border-orange-500/30'
      };
    } else {
      return {
        label: 'CRITICAL',
        description: 'Emergency intervention',
        icon: AlertOctagon,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-600',
        borderColor: 'border-red-500/30'
      };
    }
  };

  const stateInfo = getStateInfo();
  const StateIcon = stateInfo.icon;

  return (
    <Card className={`border-2 ${stateInfo.borderColor} ${stateInfo.bgColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StateIcon className={`w-5 h-5 ${stateInfo.textColor}`} />
          System State
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge className={`text-base px-3 py-1 ${stateInfo.bgColor} ${stateInfo.textColor} border-2 ${stateInfo.borderColor}`}>
            {stateLevelOverride || stateInfo.label}
          </Badge>
          <p className="text-sm text-muted-foreground">{stateInfo.description}</p>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className={`text-3xl font-bold ${stateInfo.textColor}`}>
              {ultraScore.toFixed(1)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
