import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { useDailyInsight } from "@/hooks/useDailyInsight";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Church,
  Briefcase,
  Users,
  Brain,
  Share2,
  Dumbbell,
  Heart,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Activity
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const domainIcons = {
  SPIRITUALITY: Church,
  CAREER_MASTER: Briefcase,
  SOCIAL_LIFE: Users,
  EMOTIONAL_INTELLIGENCE: Brain,
  PERSONAL_BRANDING: Share2,
  FITNESS_PERFORMANCE: Dumbbell,
  DATING_ATTRACTION: Heart,
};

export default function UltraHub() {
  const { data: automation, isLoading: automationLoading } = useAutomationEngine();
  const { data: dailyInsight, isLoading: insightLoading } = useDailyInsight();
  
  const { data: ultraScore, isLoading: scoreLoading } = useQuery({
    queryKey: ['ultra-score'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('ultra_metrics')
        .select('value, metric_date')
        .eq('user_id', user.id)
        .eq('name', 'ULTRA_Score')
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ['ultra-domains'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split('T')[0];

      // Get all domain definitions
      const { data: allDomains, error: domainsError } = await supabase
        .from('ultra_domains')
        .select('*')
        .order('id');

      if (domainsError) throw domainsError;

      // Get latest metrics for each domain
      const { data: metrics, error: metricsError } = await supabase
        .from('ultra_metrics')
        .select('domain_id, value, metric_date, name')
        .eq('user_id', user.id)
        .not('domain_id', 'is', null)
        .gte('metric_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (metricsError) throw metricsError;

      // Combine domains with their latest scores
      return allDomains.map(domain => {
        const domainMetrics = metrics?.filter(m => m.domain_id === domain.id) || [];
        const latestMetric = domainMetrics[0];
        const previousMetric = domainMetrics[1];
        
        return {
          ...domain,
          score: latestMetric?.value || 0,
          trend: latestMetric && previousMetric 
            ? latestMetric.value - previousMetric.value 
            : 0,
        };
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/30";
    if (score >= 60) return "bg-ultra-stable/10 border-ultra-stable/30";
    if (score >= 40) return "bg-warning/10 border-warning/30";
    return "bg-ultra-danger/10 border-ultra-danger/30";
  };

  const getStateColor = (state: string) => {
    if (state.includes("ULTRA") || state.includes("AFFLUENCE")) return "bg-ultra-affluent text-ultra-affluent";
    if (state.includes("GROWTH") || state.includes("ASCENSION")) return "bg-ultra-stable text-ultra-stable";
    if (state.includes("NEUTRAL") || state.includes("BALANCED")) return "bg-muted text-muted-foreground";
    if (state.includes("DANGER") || state.includes("STRUGGLING")) return "bg-warning text-warning";
    return "bg-ultra-danger text-ultra-danger";
  };

  const getStateIcon = (state: string) => {
    if (state.includes("ULTRA") || state.includes("AFFLUENCE")) return CheckCircle2;
    if (state.includes("GROWTH") || state.includes("ASCENSION")) return TrendingUp;
    if (state.includes("NEUTRAL") || state.includes("BALANCED")) return Activity;
    if (state.includes("DANGER") || state.includes("STRUGGLING")) return AlertTriangle;
    return Target;
  };

  // Prepare radar chart data
  const radarData = domains?.map(domain => ({
    domain: domain.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
    score: domain.score || 0,
    fullMark: 100
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-ultra bg-clip-text text-transparent">
            Ultra Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            7-Domain Life Mastery System
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </Badge>
      </div>

      {/* Daily Insight Alert */}
      {dailyInsight && !insightLoading && (
        <Alert className="border-primary/30 bg-primary/5">
          <Zap className="h-4 w-4 text-primary" />
          <AlertDescription className="text-base">
            {dailyInsight.summary}
          </AlertDescription>
        </Alert>
      )}

      {/* Ultra Score + State + Radar */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Ultra Score Gauge */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">ULTRA Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {scoreLoading ? (
              <Skeleton className="h-32 w-32 rounded-full" />
            ) : (
              <>
                <ProgressCircle value={ultraScore?.value || 0} size={140} strokeWidth={12} />
                {dailyInsight?.score_delta !== undefined && dailyInsight.score_delta !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${dailyInsight.score_delta > 0 ? 'text-success' : 'text-ultra-danger'}`}>
                    {dailyInsight.score_delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-medium">{Math.abs(dailyInsight.score_delta).toFixed(1)} from yesterday</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* System State */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System State
            </CardTitle>
          </CardHeader>
          <CardContent>
            {automationLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : automation ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const StateIcon = getStateIcon(automation.state);
                    return <StateIcon className="h-8 w-8" style={{ color: automation.state_color }} />;
                  })()}
                  <div>
                    <div className="text-2xl font-bold" style={{ color: automation.state_color }}>
                      {automation.state.replace(/_/g, ' ')}
                    </div>
                    <p className="text-sm text-muted-foreground">Current Life State</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weakest Hub:</span>
                    <span className="font-medium">{automation.weakest_hub?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Score:</span>
                    <span className={`font-medium ${getScoreColor(automation.weakest_score)}`}>
                      {automation.weakest_score?.toFixed(1) || '--'}
                    </span>
                  </div>
                  {automation.hubs_in_danger > 0 && (
                    <Badge variant="destructive" className="w-full justify-center mt-2">
                      {automation.hubs_in_danger} Hub{automation.hubs_in_danger > 1 ? 's' : ''} in Danger
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No state data available</p>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="border-2 shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Domain Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="domain" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3} 
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {automation?.focus_recommendations && (
        <Card className="border-2 border-accent/30 shadow-lg">
          <CardHeader className="bg-accent/5">
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              AI Recommendations - Priority Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Primary Domain</div>
                <div className="text-2xl font-bold text-primary mb-4">
                  {automation.focus_recommendations.primary_domain}
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Secondary Domain</div>
                <div className="text-xl font-semibold text-accent">
                  {automation.focus_recommendations.secondary_domain}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">Suggested Actions</div>
                <ul className="space-y-2">
                  {automation.focus_recommendations.suggested_actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7 Domain Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Seven Life Domains
        </h2>
        {domainsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {domains?.map((domain) => {
              const Icon = domainIcons[domain.code as keyof typeof domainIcons] || Target;
              const score = domain.score || 0;
              const trend = domain.trend || 0;
              
              return (
                <Card 
                  key={domain.id} 
                  className={`hover:shadow-lg transition-all cursor-pointer border-2 ${getScoreBg(score)}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      {trend !== 0 && (
                        <div className={`flex items-center gap-1 ${trend > 0 ? 'text-success' : 'text-ultra-danger'}`}>
                          {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {domain.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <span className="text-sm text-muted-foreground">Score</span>
                        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                          {score.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={score} className="h-2" />
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {domain.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-success/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Strongest Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-success">
                {domains?.reduce((max, d) => d.score > max.score ? d : max, domains[0])?.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') || '--'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-warning/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Needs Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-warning">
                {domains?.reduce((min, d) => d.score < min.score ? d : min, domains[0])?.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') || '--'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className={`text-2xl font-bold ${getScoreColor(domains?.reduce((sum, d) => sum + d.score, 0) / (domains?.length || 1) || 0)}`}>
                {(domains?.reduce((sum, d) => sum + d.score, 0) / (domains?.length || 1) || 0).toFixed(1)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
