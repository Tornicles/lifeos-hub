import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  Sparkles,
  BarChart3,
  Award,
  AlertCircle
} from "lucide-react";

export default function Insights() {
  const { toast } = useToast();
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState({ weekly: false, monthly: false });

  const generateWeeklyReview = async () => {
    setLoading({ ...loading, weekly: true });
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-review');
      if (error) throw error;
      setWeeklyData(data);
      toast({
        title: "Weekly Review Generated",
        description: "Your weekly performance review is ready.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate weekly review.",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, weekly: false });
    }
  };

  const generateMonthlyInsights = async () => {
    setLoading({ ...loading, monthly: true });
    try {
      const { data, error } = await supabase.functions.invoke('generate-monthly-insights');
      if (error) throw error;
      setMonthlyData(data);
      toast({
        title: "Monthly Insights Generated",
        description: "Your monthly performance insights are ready.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate monthly insights.",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, monthly: false });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground">Weekly and monthly performance analysis</p>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly Review</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Insights</TabsTrigger>
        </TabsList>

        {/* Weekly Review Tab */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Performance Review
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!weeklyData ? (
                <Button onClick={generateWeeklyReview} disabled={loading.weekly}>
                  {loading.weekly ? "Generating..." : "Generate Weekly Review"}
                </Button>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Period: {weeklyData.period}</p>
                    <Button variant="outline" size="sm" onClick={generateWeeklyReview}>
                      Regenerate
                    </Button>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Activity className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{weeklyData.statistics.total_logs}</p>
                          <p className="text-xs text-muted-foreground">Total Logs</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          <p className="text-2xl font-bold">
                            {weeklyData.statistics.habits_completed}/{weeklyData.statistics.habits_total}
                          </p>
                          <p className="text-xs text-muted-foreground">Habits</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-accent" />
                          <p className="text-2xl font-bold">{weeklyData.statistics.avg_ultra_score.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">Avg Ultra Score</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Domain Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Domain Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {weeklyData.domain_performance.slice(0, 5).map((domain: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {idx === 0 ? (
                                <Award className="w-4 h-4 text-yellow-500" />
                              ) : idx === weeklyData.domain_performance.length - 1 ? (
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                              ) : (
                                <div className="w-4" />
                              )}
                              <span className="text-sm">{domain.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{domain.avg.toFixed(1)}</Badge>
                              {domain.trend > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : domain.trend < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Summary */}
                  {weeklyData.ai_summary && (
                    <Card className="border-2 border-accent/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-accent" />
                          AI Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <pre className="whitespace-pre-wrap font-sans text-sm">{weeklyData.ai_summary}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Insights Tab */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Performance Insights
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of your last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!monthlyData ? (
                <Button onClick={generateMonthlyInsights} disabled={loading.monthly}>
                  {loading.monthly ? "Generating..." : "Generate Monthly Insights"}
                </Button>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Period: {monthlyData.period}</p>
                    <Button variant="outline" size="sm" onClick={generateMonthlyInsights}>
                      Regenerate
                    </Button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{monthlyData.summary.avg_ultra_score.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
                          {monthlyData.summary.score_change !== 0 && (
                            <Badge variant="outline" className="mt-2">
                              {monthlyData.summary.score_change > 0 ? '+' : ''}
                              {monthlyData.summary.score_change.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{monthlyData.summary.total_logs}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total Logs</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{monthlyData.projects.completed}</p>
                          <p className="text-xs text-muted-foreground mt-1">Projects Done</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{monthlyData.habits.longest_streak}</p>
                          <p className="text-xs text-muted-foreground mt-1">Best Streak</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Domain Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Domain Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {monthlyData.domains.slice(0, 7).map((domain: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm">{domain.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{domain.avg.toFixed(1)}</Badge>
                              <Badge 
                                variant={domain.trend === 'improving' ? 'default' : domain.trend === 'declining' ? 'destructive' : 'secondary'}
                              >
                                {domain.trend}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Insights */}
                  {monthlyData.ai_insights && (
                    <Card className="border-2 border-primary/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          AI Comprehensive Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <pre className="whitespace-pre-wrap font-sans text-sm">{monthlyData.ai_insights}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
