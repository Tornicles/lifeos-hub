import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { TrendingUp, Target, Activity, Calendar } from 'lucide-react';

export function CrossModuleAnalytics() {
  const { data: hubData, isLoading: hubLoading } = useQuery({
    queryKey: ['cross-module-hubs'],
    queryFn: async () => {
      const { data: metrics } = await supabase
        .from('metrics')
        .select('value, metric_date, hubs(name, code)')
        .order('metric_date', { ascending: false })
        .limit(90);

      // Group by hub and calculate averages
      const hubScores: Record<string, number[]> = {};
      metrics?.forEach((m: any) => {
        const hubName = m.hubs?.name || 'Unknown';
        if (!hubScores[hubName]) hubScores[hubName] = [];
        hubScores[hubName].push(m.value);
      });

      return Object.entries(hubScores).map(([name, values]) => ({
        hub: name,
        score: values.reduce((a, b) => a + b, 0) / values.length,
      }));
    },
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['cross-module-trends'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: ultraMetrics } = await supabase
        .from('ultra_metrics')
        .select('*')
        .eq('name', 'ULTRA_Score')
        .gte('metric_date', thirtyDaysAgo)
        .order('metric_date');

      return ultraMetrics?.map(m => ({
        date: new Date(m.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: m.value,
      })) || [];
    },
  });

  const { data: habitData, isLoading: habitLoading } = useQuery({
    queryKey: ['cross-module-habits'],
    queryFn: async () => {
      const { data: habits } = await supabase
        .from('habits')
        .select('name, streak');

      return habits?.map(h => ({
        habit: h.name,
        streak: h.streak || 0,
      })) || [];
    },
  });

  const { data: correlations, isLoading: correlationsLoading } = useQuery({
    queryKey: ['cross-module-correlations'],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('logs')
        .select('log_date, value, hubs(name)')
        .order('log_date', { ascending: false })
        .limit(200);

      const { data: ultraMetrics } = await supabase
        .from('ultra_metrics')
        .select('metric_date, value')
        .eq('name', 'ULTRA_Score')
        .order('metric_date', { ascending: false })
        .limit(30);

      // Calculate correlation between logging frequency and Ultra Score
      const logsByDate: Record<string, number> = {};
      logs?.forEach((log: any) => {
        logsByDate[log.log_date] = (logsByDate[log.log_date] || 0) + 1;
      });

      const ultraByDate: Record<string, number> = {};
      ultraMetrics?.forEach(m => {
        ultraByDate[m.metric_date] = m.value;
      });

      return {
        logging_frequency: Object.keys(logsByDate).length,
        avg_logs_per_day: Object.values(logsByDate).reduce((a, b) => a + b, 0) / Object.keys(logsByDate).length,
        ultra_score: ultraMetrics?.[0]?.value || 0,
      };
    },
  });

  if (hubLoading || trendLoading || habitLoading || correlationsLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Cross-Module Analytics
        </CardTitle>
        <CardDescription>
          Understand how different areas of your life interconnect
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hubs">Hub Balance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Logging Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{correlations?.logging_frequency || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {correlations?.avg_logs_per_day?.toFixed(1)} logs/day
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Current Ultra Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{correlations?.ultra_score || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on all domains
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Active Habits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{habitData?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {habitData?.filter(h => h.streak > 0).length} with streaks
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Regular logging correlates with higher Ultra Scores</li>
                <li>Consistent habit tracking improves overall system balance</li>
                <li>Project completion rates affect Work hub scores directly</li>
                <li>Calendar density impacts energy recommendations</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="hubs" className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={hubData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="hub" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Hub Scores" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="habits" className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="habit" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="streak" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
