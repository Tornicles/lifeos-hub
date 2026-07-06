import { useListAutomationLogs, getListAutomationLogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, AlertTriangle, AlertCircle, Bug, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const { data: logs, isLoading } = useListAutomationLogs({
    query: {
      refetchInterval: 10000, // Refresh every 10 seconds
      queryKey: getListAutomationLogsQueryKey(),
    }
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
                            {log.eventType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : 'N/A'}
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
                {!!log.contextData && Object.keys(log.contextData as object).length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                      {JSON.stringify(log.contextData, null, 2) as React.ReactNode}
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
