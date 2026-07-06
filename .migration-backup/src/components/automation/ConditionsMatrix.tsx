import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Activity,
  Target,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Condition {
  type: string;
  metric: string;
  operator: string;
  value: number;
  status: 'met' | 'not-met';
}

interface ConditionsMatrixProps {
  conditions: Condition[];
}

export function ConditionsMatrix({ conditions }: ConditionsMatrixProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'ULTRA_SCORE_THRESHOLD':
      case 'ULTRA_BELOW':
      case 'ULTRA_ABOVE':
        return Target;
      case 'TREND_DROP':
        return TrendingDown;
      case 'TREND_RISE':
        return TrendingUp;
      case 'CALENDAR_OVERLOAD':
        return Calendar;
      case 'CONSISTENCY_LOW':
        return Activity;
      default:
        return AlertTriangle;
    }
  };

  const getOperatorSymbol = (operator: string) => {
    switch (operator) {
      case 'LESS_THAN': return '<';
      case 'LESS_EQUAL': return '≤';
      case 'GREATER_THAN': return '>';
      case 'GREATER_EQUAL': return '≥';
      case 'EQUALS': return '=';
      case 'NOT_EQUALS': return '≠';
      default: return operator;
    }
  };

  const metConditions = conditions.filter(c => c.status === 'met');
  const notMetConditions = conditions.filter(c => c.status === 'not-met');

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Conditions Matrix</span>
          <div className="flex gap-2">
            <Badge variant="default" className="bg-success">
              {metConditions.length} Met
            </Badge>
            <Badge variant="outline">
              {notMetConditions.length} Not Met
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {metConditions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Conditions Met
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {metConditions.map((condition, idx) => {
                  const Icon = getIcon(condition.type);
                  return (
                    <div key={idx} className="p-3 border border-success/30 rounded-lg bg-success/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">{condition.type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {condition.metric} {getOperatorSymbol(condition.operator)} {condition.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {notMetConditions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Conditions Not Met
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {notMetConditions.map((condition, idx) => {
                  const Icon = getIcon(condition.type);
                  return (
                    <div key={idx} className="p-3 border rounded-lg opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{condition.type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {condition.metric} {getOperatorSymbol(condition.operator)} {condition.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}