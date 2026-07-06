import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { useAutofillCalendar, useEvaluateAutomation } from "@workspace/api-client-react";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import {
  Zap,
  Settings,
  Calendar,
  RefreshCw,
  Clock,
  Activity
} from "lucide-react";
import { toast } from "sonner";

// NOTE: this page previously also surfaced "Auto-Generated Actions" and
// "System Warnings" sections (backed by `useListAutoActions`/
// `useListStateWarnings`/`useDismissStateWarning`/`useValidateSystem`), plus
// a rich system-status summary (ultra score, priority zone, hubs in danger,
// 7-day trend, triggered rule details). The Tech-Tate schema migration
// dropped `auto_actions_table` and `ultra_metrics_table`, and no
// `/automation/state-warnings` or `/automation/validate` backend routes
// exist. Those sections were removed rather than left rendering broken/
// undefined data. `/automation/evaluate` still works, but only reports
// `{ rulesEvaluated, actionsQueued }` — see useAutomationEngine.ts.
export default function Automation() {
  const queryClient = useQueryClient();
  const { data: automation, isLoading: automationLoading } = useAutomationEngine();
  const [isRebalancing, setIsRebalancing] = useState(false);

  // Rebalance (evaluate active rules)
  const evaluateAutomationMutation = useEvaluateAutomation();

  const runRebalance = async () => {
    setIsRebalancing(true);
    try {
      const data = await evaluateAutomationMutation.mutateAsync();
      toast.success(`Evaluated ${data.rulesEvaluated} rules and queued ${data.actionsQueued} actions`);
      queryClient.invalidateQueries({ queryKey: ['evaluateAutomation'] });
    } catch (error) {
      toast.error('Rebalancing failed');
      console.error(error);
    } finally {
      setIsRebalancing(false);
    }
  };

  // Generate calendar
  const autofillCalendarMutation = useAutofillCalendar();

  const generateCalendar = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await autofillCalendarMutation.mutateAsync({
        data: { weekStart: today }
      });
      toast.success(`Generated ${data.created.length} time blocks for today`);
    } catch (error) {
      toast.error('Calendar generation failed');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-ultra bg-clip-text text-transparent">
            Automation Engine
          </h1>
          <p className="text-muted-foreground text-lg">
            Rule evaluation & calendar automation
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </Badge>
      </div>

      {/* System Status */}
      {automationLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : automation ? (
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Current System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Active Rules Evaluated</p>
                <div className="text-3xl font-bold">{automation.rulesEvaluated}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Actions Queued</p>
                <div className="text-3xl font-bold">{automation.actionsQueued}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Control Panel */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Automation Controls
          </CardTitle>
          <CardDescription>
            Re-evaluate automation rules or generate a daily calendar plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={runRebalance}
              disabled={isRebalancing}
              className="h-auto flex-col gap-2 py-4"
            >
              <RefreshCw className="h-6 w-6" />
              <span>Evaluate Rules</span>
              {isRebalancing && <Clock className="h-4 w-4 animate-spin" />}
            </Button>

            <Button
              onClick={generateCalendar}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Calendar className="h-6 w-6" />
              <span>Generate Daily Plan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          Auto-generated action recommendations and system warnings are being redesigned
          around the new Finance/Academy/Bible/Couples data and are not available yet.
        </AlertDescription>
      </Alert>
    </div>
  );
}
