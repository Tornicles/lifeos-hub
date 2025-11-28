import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Target,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// Maps Excel: COMMAND_CENTER_2 / ULTRA_FUSION / ULTRA_HOMEPAGE
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [ultraScore, setUltraScore] = useState<number | null>(null);
  const [hubScores, setHubScores] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load Ultra Score (maps to Excel Ultra_Metrics sheet, ULTRA_Score row)
      const { data: ultraMetrics, error: ultraError } = await supabase
        .from("ultra_metrics")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", "ULTRA_Score")
        .order("metric_date", { ascending: false })
        .limit(1);

      if (!ultraError && ultraMetrics && ultraMetrics.length > 0) {
        setUltraScore(Number(ultraMetrics[0].value));
      }

      // Load Hub Scores (maps to Excel HubStates sheet)
      const { data: metrics, error: metricsError } = await supabase
        .from("metrics")
        .select("*, hubs(name, code)")
        .eq("user_id", user.id)
        .eq("name", "DailyScore")
        .order("metric_date", { ascending: false })
        .limit(9);

      if (!metricsError && metrics) {
        setHubScores(metrics);
      }

      // Load Recent Logs (maps to Excel *_Log sheets)
      const { data: logs, error: logsError } = await supabase
        .from("logs")
        .select("*, hubs(name)")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(5);

      if (!logsError && logs) {
        setRecentLogs(logs);
      }
    } catch (error: any) {
      toast.error("Error loading dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (score: number) => {
    if (score < 40) return "ultra-danger";
    if (score < 60) return "ultra-urgency";
    if (score < 80) return "ultra-stable";
    return "ultra-affluent";
  };

  const getStateLabel = (score: number) => {
    if (score < 40) return "Danger";
    if (score < 60) return "Urgency";
    if (score < 80) return "Stable";
    return "Affluent";
  };

  const getStateIcon = (score: number) => {
    if (score < 60) return AlertCircle;
    return CheckCircle2;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Command Center</h1>
          <p className="text-muted-foreground text-lg">
            Your daily mission control for life mastery
          </p>
        </div>
        <Button
          className="gradient-primary text-white hover:opacity-90 transition-lifeos shadow-lifeos-md"
          size="lg"
        >
          <Activity className="mr-2 h-5 w-5" />
          Sync Data
        </Button>
      </div>

      {/* Ultra Score Card (maps to Excel ULTRA_FUSION dashboard) */}
      <Card className="border-2 shadow-lifeos-xl overflow-hidden relative">
        <div className="absolute inset-0 gradient-ultra opacity-10" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Ultra Score</CardTitle>
              <p className="text-muted-foreground">
                Your overall life performance metric
              </p>
            </div>
            <Target className="h-12 w-12 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-end gap-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {ultraScore !== null ? ultraScore.toFixed(1) : "--"}
            </div>
            <div className="flex flex-col gap-2 mb-2">
              {ultraScore !== null && (
                <>
                  <Badge
                    variant="outline"
                    className={`${getStateColor(
                      ultraScore
                    )} bg-opacity-10 border-current font-medium`}
                  >
                    {getStateLabel(ultraScore)}
                  </Badge>
                  {ultraScore < 70 ? (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingDown className="h-4 w-4" />
                      <span>Needs focus</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-success">
                      <TrendingUp className="h-4 w-4" />
                      <span>Excellent</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1">
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button className="flex-1 gradient-primary text-white hover:opacity-90">
              Focus Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hub Scores Grid (maps to Excel HubStates sheet) */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Hub Performance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hubScores.length > 0 ? (
            hubScores.map((hub) => {
              const score = Number(hub.value);
              const StateIcon = getStateIcon(score);
              return (
                <Card
                  key={hub.id}
                  className="hover:shadow-lifeos-lg transition-lifeos cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {hub.hubs?.name || "Unknown Hub"}
                      </CardTitle>
                      <StateIcon
                        className={`h-5 w-5 ${getStateColor(score)}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold">{score.toFixed(1)}</div>
                      <Badge
                        variant="outline"
                        className={`${getStateColor(
                          score
                        )} bg-opacity-10 border-current`}
                      >
                        {getStateLabel(score)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Hub Data Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start logging your activities to see hub performance
                </p>
                <Button className="gradient-primary text-white">
                  Log Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activity (maps to Excel *_Log sheets) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-lifeos"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <div className="font-medium">{log.metric || "Activity"}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.hubs?.name || log.source} • {log.log_date}
                      </div>
                    </div>
                  </div>
                  {log.value && (
                    <div className="font-medium">{log.value}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity. Start logging to see your progress!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;