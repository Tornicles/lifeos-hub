import { useParams, useNavigate } from 'react-router-dom';
import { useListMetrics, useListLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Heart, 
  Briefcase, 
  GraduationCap, 
  Sprout,
  Home,
  Users,
  FolderKanban,
  Brain,
  FileText,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

const HUB_CONFIG = {
  finance: { 
    id: 1, 
    name: 'Finance', 
    icon: DollarSign, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  health: { 
    id: 2, 
    name: 'Health', 
    icon: Heart, 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  work: { 
    id: 3, 
    name: 'Work', 
    icon: Briefcase, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  academy: { 
    id: 4, 
    name: 'Academy', 
    icon: GraduationCap, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  'personal-dev': { 
    id: 5, 
    name: 'Personal Development', 
    icon: Sprout, 
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200'
  },
  household: { 
    id: 6, 
    name: 'Household', 
    icon: Home, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  relationships: { 
    id: 7, 
    name: 'Relationships', 
    icon: Users, 
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  projects: { 
    id: 8, 
    name: 'Projects', 
    icon: FolderKanban, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  mindset: { 
    id: 9, 
    name: 'Mindset', 
    icon: Brain, 
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  },
};

export default function HubDetail() {
  const { hubCode } = useParams<{ hubCode: string }>();
  const navigate = useNavigate();
  
  const hubConfig = hubCode ? HUB_CONFIG[hubCode as keyof typeof HUB_CONFIG] : null;

  // Fetch hub metrics
  const { data: allMetrics, isLoading: metricsLoading } = useListMetrics();
  const metrics = allMetrics?.filter(m => m.hubId === hubConfig?.id).sort((a, b) => new Date(b.metricDate).getTime() - new Date(a.metricDate).getTime()).slice(0, 30);

  // Fetch hub logs
  const { data: allLogs, isLoading: logsLoading } = useListLogs();
  const logs = allLogs?.filter(l => l.hubId === hubConfig?.id).sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime()).slice(0, 20);

  // Calculate current score (average of last 7 days)
  const currentScore = metrics && metrics.length > 0
    ? Math.round(
        metrics
          .slice(0, 7)
          .reduce((sum, m) => sum + Number(m.value), 0) / Math.min(7, metrics.length)
      )
    : null;

  // Calculate trend
  const trend = metrics && metrics.length >= 7
    ? Number(metrics[0].value) - Number(metrics[6].value)
    : null;

  if (!hubConfig) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Hub Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested hub doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const HubIcon = hubConfig.icon;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className={`p-3 rounded-lg ${hubConfig.bgColor}`}>
            <HubIcon className={`h-8 w-8 ${hubConfig.color}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{hubConfig.name}</h1>
            <p className="text-muted-foreground">Hub Overview & Analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/logs')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Log
          </Button>
          <Button onClick={() => navigate('/logs')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Metric
          </Button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={`${hubConfig.borderColor} border-2`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Score</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <div className="text-4xl font-bold">{currentScore || '-'}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">7-Day Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-12 w-20" />
            ) : trend !== null ? (
              <div className="flex items-center gap-2">
                {trend > 0 ? (
                  <>
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">+{trend}</span>
                  </>
                ) : trend < 0 ? (
                  <>
                    <TrendingDown className="h-6 w-6 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">{trend}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-600">0</span>
                )}
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{logs?.length || 0}</div>
                <p className="text-sm text-muted-foreground">logs in last 30 days</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metrics History</CardTitle>
              <CardDescription>Your {hubConfig.name.toLowerCase()} metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : metrics && metrics.length > 0 ? (
                <div className="space-y-2">
                  {metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(metric.metricDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{metric.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No metrics yet</p>
                  <Button variant="outline" onClick={() => navigate('/logs')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Metric
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Recent activities in {hubConfig.name.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{log.source}</Badge>
                          {log.metric && (
                            <span className="text-sm text-muted-foreground">{log.metric}</span>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-sm text-muted-foreground">{log.notes}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.logDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      {log.value && (
                        <div className="text-lg font-semibold">{log.value}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No logs yet</p>
                  <Button variant="outline" onClick={() => navigate('/logs')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Log
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
