import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, AlertTriangle, AlertCircle, Bug, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AutomationLog {
  id: number;
  event_type: string;
  severity: string;
  message: string;
  context_data: any;
  created_at: string;
  rule_id?: number;
}

const SEVERITY_ICONS = {
  DEBUG: Bug,
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  CRITICAL: Zap,
};

const SEVERITY_COLORS = {
  DEBUG: 'text-gray-500',
  INFO: 'text-blue-500',
  WARNING: 'text-yellow-500',
  ERROR: 'text-orange-500',
  CRITICAL: 'text-red-500',
};

export function AutomationLogsViewer() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AutomationLog[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Automation Logs</h2>
        <p className="text-muted-foreground">
          Recent automation events and system activity
        </p>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {logs?.map((log) => {
            const SeverityIcon = SEVERITY_ICONS[log.severity as keyof typeof SEVERITY_ICONS] || Info;
            const severityColor = SEVERITY_COLORS[log.severity as keyof typeof SEVERITY_COLORS] || 'text-gray-500';

            return (
              <Card key={log.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <SeverityIcon className={`h-5 w-5 mt-0.5 ${severityColor}`} />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium">
                          {log.message}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {log.event_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      log.severity === 'CRITICAL' || log.severity === 'ERROR' ? 'destructive' :
                      log.severity === 'WARNING' ? 'secondary' :
                      'outline'
                    }>
                      {log.severity}
                    </Badge>
                  </div>
                </CardHeader>
                {log.context_data && Object.keys(log.context_data).length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                      {JSON.stringify(log.context_data, null, 2)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          {logs?.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
                No logs yet
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
