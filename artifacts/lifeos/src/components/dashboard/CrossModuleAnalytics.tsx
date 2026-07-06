import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useListMetrics, 
  useListHabits, 
  useListLogs,
  useListHubs
} from '@workspace/api-client-react';
import {
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
import { TrendingUp, Activity } from 'lucide-react';

// NOTE: this component previously also had a "Trends" tab and an
// "Ultra Score" correlation stat backed by `useListUltraMetrics()`. The
// Tech-Tate schema migration dropped `ultra_metrics_table` and there is no
// `/api/ultra-metrics` route anymore (calls would 404), so that data source
// was removed rather than left erroring silently.
export function CrossModuleAnalytics() {
  const { data: hubs } = useListHubs();
  const { data: metrics, isLoading: metricsLoading } = useListMetrics();
  const { data: habits, isLoading: habitsLoading } = useListHabits();
  const { data: logs, isLoading: logsLoading } = useListLogs();

  const hubData = (() => {
    if (!metrics || !hubs) return [];
    
    const hubMap = new Map(hubs.map(h => [h.id, h.name]));
    const hubScores: Record<string, number[]> = {};
    
    // Use last 90 metrics as per original query limit
    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(b.metricDate).getTime() - new Date(a.metricDate).getTime()
    ).slice(0, 90);

    sortedMetrics.forEach((m) => {
      const hubName = m.hubId ? hubMap.get(m.hubId) : 'Unknown';
      if (hubName) {
        if (!hubScores[hubName]) hubScores[hubName] = [];
        hubScores[hubName].push(m.value);
      }
    });

    return Object.entries(hubScores).map(([name, values]) => ({
      hub: name,
      score: values.reduce((a, b) => a + b, 0) / values.length,
    }));
  })();

  const habitData = habits?.map(h => ({
    habit: h.name,
    streak: h.streak || 0,
  })) || [];

  const correlations = (() => {
    if (!logs) return null;

    const recentLogs = [...logs]
      .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
      .slice(0, 200);

    const logsByDate: Record<string, number> = {};
    recentLogs.forEach((log) => {
      logsByDate[log.logDate] = (logsByDate[log.logDate] || 0) + 1;
    });

    const numDaysWithLogs = Object.keys(logsByDate).length;

    return {
      logging_frequency: recentLogs.length,
      avg_logs_per_day: numDaysWithLogs > 0 ? recentLogs.length / numDaysWithLogs : 0,
    };
  })();

  const isLoading = metricsLoading || habitsLoading || logsLoading;

  if (isLoading) {
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hubs">Hub Balance</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                <li>Consistent habit tracking improves overall system balance</li>
                <li>Regular logging helps surface patterns across hubs</li>
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
