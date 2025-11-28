import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { useDailyInsight } from "@/hooks/useDailyInsight";
import { StateBadge } from "@/components/automation/StateBadge";
import { PriorityHubCard } from "@/components/automation/PriorityHubCard";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Sparkles,
  Activity,
  Calendar,
  BarChart3,
  Flame,
  Shield
} from "lucide-react";

export default function Dashboard() {
  const { data: automation, isLoading: automationLoading } = useAutomationEngine();
  const { data: insight, isLoading: insightLoading } = useDailyInsight();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold gradient-ultra bg-clip-text text-transparent">
            Command Center
          </h1>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Badge>
        </div>

        {/* Daily Insight Banner */}
        {insightLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : insight ? (
          <Alert className="border-primary/20 gradient-primary bg-clip-padding bg-opacity-5">
            <Sparkles className="h-5 w-5 text-primary" />
            <AlertTitle className="text-xl font-bold">Daily Insight</AlertTitle>
            <AlertDescription className="text-base mt-2">
              {insight.summary}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* System Overview - Top Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Ultra Score */}
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                Ultra Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {automationLoading ? (
                <Skeleton className="h-16 w-32" />
              ) : (
                <>
                  <div className="text-5xl font-bold gradient-ultra bg-clip-text text-transparent">
                    {automation?.ultra_score.toFixed(1) || '--'}
                  </div>
                  {insight && insight.score_delta !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${insight.score_delta > 0 ? 'text-success' : 'text-ultra-danger'}`}>
                      {insight.score_delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-medium">
                        {insight.score_delta > 0 ? '+' : ''}{insight.score_delta.toFixed(1)} today
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* System State */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-accent" />
                System State
              </CardTitle>
            </CardHeader>
            <CardContent>
              {automationLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : automation ? (
                <StateBadge automation={automation} size="md" showReasons={false} />
              ) : null}
            </CardContent>
          </Card>

          {/* Habit Consistency */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-5 w-5 text-warning" />
                Habit Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              {automationLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : automation ? (
                <>
                  <div className="text-4xl font-bold text-warning">
                    {automation.habit_consistency.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">avg days</p>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Activity Trend */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-accent" />
                7-Day Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {automationLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : automation ? (
                <>
                  <div className={`text-4xl font-bold ${automation.score_trend > 0 ? 'text-success' : automation.score_trend < 0 ? 'text-ultra-danger' : 'text-muted-foreground'}`}>
                    {automation.score_trend > 0 ? '+' : ''}{automation.score_trend.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">score change</p>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Priority Hub + State Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Priority Hub */}
          {automationLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : automation ? (
            <PriorityHubCard automation={automation} />
          ) : null}

          {/* State Analysis */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                System Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {automationLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : automation ? (
                <div className="space-y-4">
                  <StateBadge automation={automation} size="lg" showReasons={true} />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Hubs in Danger</p>
                      <p className={`text-2xl font-bold ${automation.hubs_in_danger > 0 ? 'text-ultra-danger' : 'text-success'}`}>
                        {automation.hubs_in_danger}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Domain Balance</p>
                      <p className={`text-2xl font-bold ${automation.hub_imbalance > 30 ? 'text-warning' : 'text-success'}`}>
                        {automation.hub_imbalance.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Calendar Load</p>
                      <p className={`text-2xl font-bold ${automation.calendar_load > 8 ? 'text-warning' : 'text-primary'}`}>
                        {automation.calendar_load}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recent Activity</p>
                      <p className={`text-2xl font-bold ${automation.recent_activity < 3 ? 'text-warning' : 'text-success'}`}>
                        {automation.recent_activity}
                      </p>
                    </div>
                  </div>

                  {automation.focus_recommendations.risk_factors.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-ultra-danger">
                        <AlertTriangle className="h-4 w-4" />
                        Risk Factors
                      </h4>
                      <ul className="space-y-1">
                        {automation.focus_recommendations.risk_factors.map((risk, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-ultra-danger mt-0.5">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {automation.focus_recommendations.opportunities.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-success">
                        <Sparkles className="h-4 w-4" />
                        Opportunities
                      </h4>
                      <ul className="space-y-1">
                        {automation.focus_recommendations.opportunities.map((opp, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-success mt-0.5">•</span>
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        {automation?.focus_recommendations && (
          <Card className="border-2 border-accent/30 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-accent" />
                AI Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Primary Focus</h3>
                  <Badge variant="default" className="text-xl px-6 py-3">
                    {automation.focus_recommendations.primary_domain}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Secondary Focus</h3>
                  <Badge variant="secondary" className="text-xl px-6 py-3">
                    {automation.focus_recommendations.secondary_domain}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Today's Action Items</h3>
                <ul className="space-y-3">
                  {automation.focus_recommendations.suggested_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-2xl font-bold text-primary mt-0.5">{idx + 1}.</span>
                      <span className="text-base flex-1">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Triggered Automation Rules */}
        {automation && automation.triggered_actions.length > 0 && (
          <Card className="border-2 border-warning/30">
            <CardHeader className="bg-warning/5">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Active Automation Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {automation.triggered_actions.map((action, idx) => (
                  <Alert key={idx} variant="default" className="border-warning/30">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertTitle className="text-base font-semibold">{action.rule}</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">Target: <span className="font-medium">{action.target}</span> → <span className="font-medium">{action.value}</span></p>
                        <p className="text-xs text-muted-foreground">{action.reason}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
