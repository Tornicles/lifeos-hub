import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { useEvaluateAutomation } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Brain,
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  AlertCircle,
  Calendar
} from "lucide-react";

export default function StatesEngine() {
  const { data: automation, isLoading, refetch } = useAutomationEngine();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const evaluateAutomationMutation = useEvaluateAutomation();

  const runEngineNow = async () => {
    setIsRunning(true);
    try {
      await evaluateAutomationMutation.mutateAsync();
      await refetch();
      
      toast({
        title: "Engine Executed",
        description: "States and automation rules have been re-evaluated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to run automation engine.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStateInfo = () => {
    if (!automation) return { label: 'Unknown', color: 'gray', description: '' };
    
    const score = automation.ultraScore;
    
    if (score >= 80) {
      return {
        label: 'EXCELLENT',
        color: 'green',
        description: 'Peak performance - focus on growth and advancement',
        priority: 'Growth & Expansion',
        dangerLevel: 'None',
        icon: CheckCircle2,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-600',
        borderColor: 'border-green-500/30'
      };
    } else if (score >= 60) {
      return {
        label: 'STABLE',
        color: 'blue',
        description: 'Solid foundation - rebalance and improve consistency',
        priority: automation.weakestHub?.name || 'Weakest Hub',
        dangerLevel: 'Low',
        icon: Activity,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-500/30'
      };
    } else if (score >= 40) {
      return {
        label: 'WARNING',
        color: 'yellow',
        description: 'Attention needed - fix immediate problems',
        priority: automation.weakestHub?.name || 'Weakest Hub',
        dangerLevel: 'Medium',
        icon: AlertCircle,
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-600',
        borderColor: 'border-yellow-500/30'
      };
    } else if (score >= 25) {
      return {
        label: 'DANGER',
        color: 'orange',
        description: 'Take corrective actions today',
        priority: automation.weakestHub?.name || 'Emergency Hub',
        dangerLevel: 'High',
        icon: AlertTriangle,
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-600',
        borderColor: 'border-orange-500/30'
      };
    } else {
      return {
        label: 'CRITICAL',
        color: 'red',
        description: 'Stop everything and fix this immediately',
        priority: automation.weakestHub?.name || 'Critical Hub',
        dangerLevel: 'Emergency',
        icon: AlertOctagon,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-600',
        borderColor: 'border-red-500/30'
      };
    }
  };

  const stateInfo = getStateInfo();
  const StateIcon = stateInfo.icon || Activity;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">States Engine</h1>
          <p className="text-muted-foreground">Real-time system analysis and automation</p>
        </div>
        <Button onClick={runEngineNow} disabled={isRunning || isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Run Engine Now'}
        </Button>
      </div>

      {/* Ultra Score Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-6 h-6 text-primary" />
            ULTRA Score
          </CardTitle>
          <CardDescription>Overall Life Performance Metric</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : automation ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-7xl font-bold text-primary mb-2">
                  {automation.ultraScore.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  {automation.scoreTrend > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">+{automation.scoreTrend.toFixed(1)} (7-day trend)</span>
                    </>
                  ) : automation.scoreTrend < 0 ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-red-600">{automation.scoreTrend.toFixed(1)} (7-day trend)</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No change (7-day trend)</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Overall State Card */}
      <Card className={`border-2 ${stateInfo.borderColor} ${stateInfo.bgColor}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StateIcon className={`w-6 h-6 ${stateInfo.textColor}`} />
            Overall State
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={`text-lg px-4 py-2 ${stateInfo.bgColor} ${stateInfo.textColor} border-2 ${stateInfo.borderColor}`}>
                  {stateInfo.label}
                </Badge>
                <p className="text-sm text-muted-foreground flex-1">{stateInfo.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Danger Level</p>
                  <Badge variant={stateInfo.dangerLevel === 'Emergency' ? 'destructive' : 'secondary'}>
                    {stateInfo.dangerLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Priority</p>
                  <p className="font-semibold">{stateInfo.priority}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weakest Hub & Domain Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Weakest Hub */}
        <Card className="border-2 border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Weakest Hub
            </CardTitle>
            <CardDescription>Area requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : automation?.weakestHub ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold">{automation.weakestHub.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Score:</span>
                  <span className={`text-xl font-bold ${automation.weakestScore < 30 ? 'text-red-600' : 'text-orange-600'}`}>
                    {automation.weakestScore.toFixed(1)}
                  </span>
                </div>
                {automation.weakestScore < 20 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertOctagon className="w-3 h-3" />
                    CRITICAL HUB
                  </Badge>
                )}
                {automation.weakestScore >= 20 && automation.weakestScore < 30 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    EMERGENCY HUB
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Priority Hub */}
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Priority Hub
            </CardTitle>
            <CardDescription>Calculated priority for today</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : automation?.priorityHub ? (
              <div className="space-y-3">
                <div className="text-2xl font-bold">{automation.priorityHub.name}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Priority Score</span>
                    <span className="font-semibold">{automation.priorityScore.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Zone</span>
                    <span className="font-semibold">{automation.priorityZone}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No priority calculated</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions */}
      <Card className="border-2 border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Recommended Priority Actions
          </CardTitle>
          <CardDescription>AI-generated action plan based on current state</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : automation?.focusRecommendations?.suggestedActions.length ? (
            <ul className="space-y-3">
              {automation.focusRecommendations.suggestedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="font-bold text-primary text-xl">{idx + 1}.</span>
                  <span className="flex-1">{action}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No actions generated yet</p>
          )}
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : automation ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Hubs in Danger</p>
                <p className={`text-2xl font-bold ${automation.hubsInDanger > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {automation.hubsInDanger}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Hub Imbalance</p>
                <p className="text-2xl font-bold">{automation.hubImbalance.toFixed(0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Habit Consistency</p>
                <p className="text-2xl font-bold">{automation.habitConsistency.toFixed(1)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Calendar Load</p>
                <p className="text-2xl font-bold">{automation.calendarLoad}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-bold">{automation.recentActivity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Score Trend</p>
                <p className={`text-2xl font-bold ${automation.scoreTrend > 0 ? 'text-green-600' : automation.scoreTrend < 0 ? 'text-red-600' : ''}`}>
                  {automation.scoreTrend > 0 ? '+' : ''}{automation.scoreTrend.toFixed(1)}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Opportunities & Risks */}
      {!isLoading && automation && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Opportunities */}
          {automation.focusRecommendations?.opportunities?.length > 0 && (
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {automation.focusRecommendations.opportunities.map((opp, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risk Factors */}
          {automation.focusRecommendations?.riskFactors?.length > 0 && (
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {automation.focusRecommendations.riskFactors.map((risk, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">⚠</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
