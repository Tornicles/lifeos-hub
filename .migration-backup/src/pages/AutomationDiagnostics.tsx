import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  Target, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "@/components/ui/score-ring";

export default function AutomationDiagnostics() {
  const { data: diagnostics, isLoading, refetch } = useQuery({
    queryKey: ['automation-diagnostics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('automation-evaluator');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const runDiagnostics = async () => {
    toast.loading('Running diagnostics...');
    await refetch();
    toast.dismiss();
    toast.success('Diagnostics complete');
  };

  const getStateColor = (state: string) => {
    const stateMap: Record<string, string> = {
      'Elite': 'text-ultra-peak',
      'Excellent': 'text-success',
      'Good': 'text-success',
      'Stable': 'text-primary',
      'Weak': 'text-warning',
      'Danger': 'text-ultra-danger',
      'Critical': 'text-ultra-danger',
    };
    return stateMap[state] || 'text-muted-foreground';
  };

  const getPriorityColor = (level: string) => {
    if (level.includes('Emergency')) return 'destructive';
    if (level.includes('High')) return 'default';
    if (level.includes('Medium')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-ultra bg-clip-text text-transparent">
            System Diagnostics
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete automation engine analysis and evaluation
          </p>
        </div>
        <Button onClick={runDiagnostics} size="lg">
          <RefreshCw className="h-5 w-5 mr-2" />
          Run Diagnostics
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : diagnostics ? (
        <>
          {/* Daily Brief */}
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Daily Intelligence Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-lg leading-relaxed whitespace-pre-line">
                {diagnostics.daily_brief}
              </p>
            </CardContent>
          </Card>

          {/* Core Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <ScoreRing score={diagnostics.ultra_score} size="xl" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">ULTRA Score</p>
                  <p className={`text-2xl font-bold ${getStateColor(diagnostics.ultra_state)}`}>
                    {diagnostics.ultra_state}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center">
                    <Target className="h-12 w-12 text-accent" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">System State</p>
                  <p className="text-lg font-bold">
                    {diagnostics.system_state.replace(/_/g, ' ')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-24 w-24 rounded-full bg-warning/20 flex items-center justify-center">
                    <AlertTriangle className="h-12 w-12 text-warning" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Priority Level</p>
                  <Badge variant={getPriorityColor(diagnostics.priority_level)} className="text-base px-3 py-1">
                    {diagnostics.priority_level}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Score: {diagnostics.priority_score}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Rules Triggered</p>
                  <p className="text-4xl font-bold">
                    {diagnostics.triggered_rules?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weakest Areas */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-warning/30 shadow-lg">
              <CardHeader className="bg-warning/5">
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  Weakest Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-2">
                    {diagnostics.weakest_hub?.name || 'N/A'}
                  </h3>
                  <p className="text-5xl font-bold text-warning">
                    {diagnostics.weakest_hub?.score?.toFixed(1) || '0'}
                  </p>
                  <p className={`text-sm mt-2 ${getStateColor(calculateState(diagnostics.weakest_hub?.score || 0))}`}>
                    {calculateState(diagnostics.weakest_hub?.score || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-warning/30 shadow-lg">
              <CardHeader className="bg-warning/5">
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  Weakest Domain
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-2">
                    {diagnostics.weakest_domain?.name || 'N/A'}
                  </h3>
                  <p className="text-5xl font-bold text-warning">
                    {diagnostics.weakest_domain?.score?.toFixed(1) || '0'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recommended Focus Domain
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Triggered Rules */}
          {diagnostics.triggered_rules && diagnostics.triggered_rules.length > 0 && (
            <Card className="border-2 border-accent/30 shadow-lg">
              <CardHeader className="bg-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Triggered Automation Rules
                </CardTitle>
                <CardDescription>
                  Rules that activated during evaluation
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {diagnostics.triggered_rules.map((rule: any, idx: number) => (
                    <Card key={idx} className="border-accent/30 bg-accent/5">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{rule.rule_name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{rule.reason}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {rule.action.action_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">→</span>
                              <Badge variant="default" className="text-xs">
                                {rule.action.target}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          {diagnostics.recommended_actions && diagnostics.recommended_actions.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Recommended Actions
                </CardTitle>
                <CardDescription>
                  AI-generated suggestions based on current state
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {diagnostics.recommended_actions.map((action: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm flex-1">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metrics Snapshot */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                System Metrics Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Habit Consistency</p>
                  <p className="text-3xl font-bold">
                    {diagnostics.metrics_snapshot?.habit_consistency?.toFixed(1) || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">day streak avg</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Calendar Load</p>
                  <p className="text-3xl font-bold">
                    {diagnostics.metrics_snapshot?.calendar_load || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">events (3 days)</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Recent Activity</p>
                  <p className="text-3xl font-bold">
                    {diagnostics.metrics_snapshot?.recent_activity || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">logs (7 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hub Scores */}
          {diagnostics.hub_scores && Object.keys(diagnostics.hub_scores).length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Hub Scores Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(diagnostics.hub_scores).map(([hub, score]: [string, any]) => (
                    <div key={hub} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{hub}</h4>
                        <Badge variant="outline" className={getStateColor(calculateState(score))}>
                          {calculateState(score)}
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold">{score.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Alert>
          <AlertDescription>
            No diagnostics data available. Click "Run Diagnostics" to evaluate your system.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function calculateState(score: number): string {
  if (score >= 91) return 'Elite';
  if (score >= 81) return 'Excellent';
  if (score >= 71) return 'Good';
  if (score >= 56) return 'Stable';
  if (score >= 41) return 'Weak';
  if (score >= 21) return 'Danger';
  return 'Critical';
}