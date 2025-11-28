import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Heart
} from "lucide-react";

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
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-blue-50 border-blue-200";
    if (score >= 40) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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

      {/* Ultra Score Hero Card */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">ULTRA Score</CardTitle>
            </div>
            {scoreLoading ? (
              <Skeleton className="h-20 w-32" />
            ) : (
              <div className="text-right">
                <div className={`text-6xl font-bold ${getScoreColor(ultraScore?.value || 0)}`}>
                  {ultraScore?.value.toFixed(1) || '--'}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Overall Performance
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 7 Domain Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Seven Life Domains</h2>
        {domainsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domains?.map((domain) => {
              const Icon = domainIcons[domain.code as keyof typeof domainIcons] || Target;
              const score = domain.score || 0;
              const trend = domain.trend || 0;
              
              return (
                <Card 
                  key={domain.id} 
                  className={`hover:shadow-lg transition-all cursor-pointer ${getScoreBg(score)}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{domain.name}</CardTitle>
                      </div>
                      {trend !== 0 && (
                        <div className={`flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Strongest Domain</CardTitle>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {domains?.reduce((max, d) => d.score > max.score ? d : max, domains[0])?.name || '--'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Needs Focus</CardTitle>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {domains?.reduce((min, d) => d.score < min.score ? d : min, domains[0])?.name || '--'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Score</CardTitle>
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
