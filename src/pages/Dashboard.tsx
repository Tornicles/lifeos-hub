import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { useDailyInsight } from "@/hooks/useDailyInsight";
import { Target, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { data: automation, isLoading: automationLoading } = useAutomationEngine();
  const { data: insight, isLoading: insightLoading } = useDailyInsight();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
          <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <Sparkles className="h-5 w-5" />
            <AlertTitle className="text-xl font-bold">Daily Insight</AlertTitle>
            <AlertDescription className="text-base mt-2">
              {insight.summary}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Ultra Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {automationLoading ? (
                <Skeleton className="h-16 w-32" />
              ) : (
                <>
                  <div className="text-5xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                    {automation?.ultra_score.toFixed(1) || '--'}
                  </div>
                  {insight && insight.score_delta !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 ${insight.score_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {insight.score_delta > 0 ? '+' : ''}{insight.score_delta.toFixed(1)} from yesterday
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>System State</CardTitle>
            </CardHeader>
            <CardContent>
              {automationLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : automation ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{automation.state_icon}</span>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: `var(--${automation.state_color})` }}>
                        {automation.state.replace('_', ' ')}
                      </div>
                      <p className="text-sm text-muted-foreground">Current operating mode</p>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Weakest Hub</CardTitle>
            </CardHeader>
            <CardContent>
              {automationLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : automation?.weakest_hub ? (
                <>
                  <div className="text-2xl font-bold">{automation.weakest_hub.name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-3xl font-semibold text-destructive">
                      {automation.weakest_score.toFixed(1)}
                    </div>
                    {automation.hubs_in_danger > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {automation.hubs_in_danger} hubs in danger
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No hub data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Priority Focus Zone */}
        {automation?.focus_recommendations && (
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="h-6 w-6" />
                Priority Focus Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Primary Domain</h3>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {automation.focus_recommendations.primary_domain}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Secondary Domain</h3>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {automation.focus_recommendations.secondary_domain}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Recommended Actions</h3>
                <ul className="space-y-2">
                  {automation.focus_recommendations.suggested_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span className="text-base">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Triggered Automation Rules */}
        {automation && automation.triggered_actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Automation Triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automation.triggered_actions.map((action, idx) => (
                  <Alert key={idx} variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{action.rule}</AlertTitle>
                    <AlertDescription>
                      Target: {action.target} → {action.value}
                      <br />
                      <span className="text-xs text-muted-foreground">{action.reason}</span>
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
