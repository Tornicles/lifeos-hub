import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface Execution {
  id: number;
  rule_id: number | null;
  execution_date: string;
  trigger_type: string;
  conditions_met: any;
  actions_executed: any;
  execution_result: string;
}

interface RuleExecutionTimelineProps {
  executions: Execution[];
}

export function RuleExecutionTimeline({ executions }: RuleExecutionTimelineProps) {
  return (
    <div className="space-y-3">
      {executions.map((execution, idx) => (
        <Card key={execution.id} className="relative">
          {idx !== executions.length - 1 && (
            <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-border" />
          )}
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {execution.execution_result === 'success' ? (
                  <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                ) : execution.execution_result === 'failed' ? (
                  <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-warning/20 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">
                    {execution.trigger_type.replace(/_/g, ' ')}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {execution.execution_result}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(execution.execution_date).toLocaleString()}
                </p>

                {execution.conditions_met && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                    <p className="font-medium mb-1">Conditions Met:</p>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(execution.conditions_met, null, 2)}
                    </pre>
                  </div>
                )}

                {execution.actions_executed && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.isArray(execution.actions_executed) && 
                      execution.actions_executed.map((action: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          {action.type || action.action}
                        </Badge>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}