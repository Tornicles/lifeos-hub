import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { StateBadge } from "@/components/automation/StateBadge";
import { 
  Zap, 
  Settings, 
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Shield,
  Clock,
  Activity
} from "lucide-react";
import { toast } from "sonner";

export default function Automation() {
  const queryClient = useQueryClient();
  const { data: automation, isLoading: automationLoading } = useAutomationEngine();
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch auto actions
  const { data: autoActions, isLoading: actionsLoading } = useQuery({
    queryKey: ['auto-actions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('auto_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('action_date', today)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch warnings
  const { data: warnings, isLoading: warningsLoading } = useQuery({
    queryKey: ['state-warnings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('state_warnings')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Update action status
  const updateAction = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase
        .from('auto_actions')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-actions'] });
      toast.success('Action updated');
    },
  });

  // Dismiss warning
  const dismissWarning = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('state_warnings')
        .update({ 
          dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['state-warnings'] });
      toast.success('Warning dismissed');
    },
  });

  // System validation
  const runValidation = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-validate', {
        body: { auto_fix: true }
      });

      if (error) throw error;

      toast.success(`Validation complete: ${data.total_issues} issues found, ${data.fixes_applied} fixed`);
      queryClient.invalidateQueries({ queryKey: ['state-warnings'] });
    } catch (error) {
      toast.error('Validation failed');
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  // Task rebalancing
  const runRebalance = async () => {
    setIsRebalancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-rebalance');

      if (error) throw error;

      toast.success(`Rebalanced ${data.rebalanced_tasks} tasks for ${data.state} mode`);
      queryClient.invalidateQueries({ queryKey: ['auto-actions'] });
    } catch (error) {
      toast.error('Rebalancing failed');
      console.error(error);
    } finally {
      setIsRebalancing(false);
    }
  };

  // Generate calendar
  const generateCalendar = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.functions.invoke('calendar-autofill', {
        body: { date: today }
      });

      if (error) throw error;

      toast.success(`Generated ${data.blocks_generated} time blocks for today`);
    } catch (error) {
      toast.error('Calendar generation failed');
      console.error(error);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'RECOVERY': return AlertTriangle;
      case 'GROWTH': return Activity;
      case 'MAINTENANCE': return Settings;
      case 'EXPANSION': return Zap;
      default: return CheckCircle2;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-ultra-danger';
      case 'high': return 'text-warning';
      case 'medium': return 'text-warning/70';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-ultra bg-clip-text text-transparent">
            Automation Engine 2.0
          </h1>
          <p className="text-muted-foreground text-lg">
            Intelligent System Analysis & Task Management
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
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <StateBadge automation={automation} size="lg" showReasons={true} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Priority Zone</p>
                <Badge variant="default" className="text-base px-3 py-1.5">
                  {automation.priority_zone || automation.priority_hub?.name || 'Balance'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Hubs in Danger</p>
                <div className={`text-3xl font-bold ${automation.hubs_in_danger > 0 ? 'text-ultra-danger' : 'text-success'}`}>
                  {automation.hubs_in_danger}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">7-Day Trend</p>
                <div className={`text-3xl font-bold ${automation.score_trend > 0 ? 'text-success' : automation.score_trend < 0 ? 'text-ultra-danger' : 'text-muted-foreground'}`}>
                  {automation.score_trend > 0 ? '+' : ''}{automation.score_trend.toFixed(1)}
                </div>
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
            Run system diagnostics, rebalance tasks, and generate daily plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              onClick={runValidation}
              disabled={isValidating}
              className="h-auto flex-col gap-2 py-4"
            >
              <Shield className="h-6 w-6" />
              <span>System Validation</span>
              {isValidating && <Clock className="h-4 w-4 animate-spin" />}
            </Button>
            
            <Button 
              onClick={runRebalance}
              disabled={isRebalancing}
              variant="secondary"
              className="h-auto flex-col gap-2 py-4"
            >
              <RefreshCw className="h-6 w-6" />
              <span>Rebalance Tasks</span>
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

      {/* Auto-Generated Actions */}
      <Card className="border-2 border-accent/30 shadow-lg">
        <CardHeader className="bg-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Auto-Generated Actions
          </CardTitle>
          <CardDescription>
            AI-recommended tasks based on your current state
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {actionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : autoActions && autoActions.length > 0 ? (
            <div className="space-y-3">
              {autoActions.map((action) => {
                const ActionIcon = getActionIcon(action.action_type);
                return (
                  <Card key={action.id} className={`${action.status === 'completed' ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <ActionIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-base font-medium">{action.action_text}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {action.action_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Priority {action.priority}
                              </Badge>
                              {action.status === 'completed' && (
                                <Badge variant="default" className="text-xs bg-success">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {action.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateAction.mutate({ id: action.id, status: 'completed' })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateAction.mutate({ id: action.id, status: 'dismissed' })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No auto-generated actions for today. System will create recommendations based on your activity.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Warnings */}
      {warnings && warnings.length > 0 && (
        <Card className="border-2 border-warning/30 shadow-lg">
          <CardHeader className="bg-warning/5">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              System Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {warnings.map((warning) => (
                <Card key={warning.id} className="border-warning/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getSeverityColor(warning.severity)}>
                            {warning.warning_type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {warning.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{warning.warning_text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(warning.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissWarning.mutate(warning.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Automation Rules */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Active Automation Rules
          </CardTitle>
          <CardDescription>
            Rules that trigger automatic actions based on your metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {automation?.triggered_actions && automation.triggered_actions.length > 0 ? (
            <div className="space-y-3">
              {automation.triggered_actions.map((action, idx) => (
                <Card key={idx} className="border-accent/30 bg-accent/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{action.rule}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{action.reason}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {action.target}
                          </Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <Badge variant="default" className="text-xs">
                            {action.value}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No automation rules currently triggered. System is monitoring your metrics.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
