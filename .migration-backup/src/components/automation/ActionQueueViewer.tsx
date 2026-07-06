import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QueuedAction {
  id: number;
  action_type: string;
  action_payload: any;
  priority: number;
  status: string;
  scheduled_for: string;
  created_at: string;
  error_message?: string;
  retry_count: number;
}

const PRIORITY_COLORS = {
  1: 'bg-blue-500',
  2: 'bg-yellow-500',
  3: 'bg-orange-500',
  4: 'bg-red-500',
};

const STATUS_ICONS = {
  PENDING: Clock,
  PROCESSING: Play,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  CANCELLED: X,
};

export function ActionQueueViewer() {
  const queryClient = useQueryClient();

  const { data: queuedActions, isLoading } = useQuery({
    queryKey: ['automation-action-queue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('automation_action_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data as QueuedAction[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const processActions = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('automation-processor');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-action-queue'] });
      toast.success('Actions processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const cancelAction = useMutation({
    mutationFn: async (actionId: number) => {
      const { error } = await supabase
        .from('automation_action_queue')
        .update({ status: 'CANCELLED' })
        .eq('id', actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-action-queue'] });
      toast.success('Action cancelled');
    },
  });

  const getPriorityLabel = (priority: number) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return labels[priority as keyof typeof labels] || 'Unknown';
  };

  const getActionTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading queue...</div>;
  }

  const pendingActions = queuedActions?.filter(a => a.status === 'PENDING') || [];
  const completedActions = queuedActions?.filter(a => a.status === 'COMPLETED') || [];
  const failedActions = queuedActions?.filter(a => a.status === 'FAILED') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Action Queue</h2>
          <p className="text-muted-foreground">
            {pendingActions.length} pending, {completedActions.length} completed, {failedActions.length} failed
          </p>
        </div>
        <Button
          onClick={() => processActions.mutate()}
          disabled={pendingActions.length === 0 || processActions.isPending}
        >
          <Play className="h-4 w-4 mr-2" />
          Process Now
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {queuedActions?.map((action) => {
            const StatusIcon = STATUS_ICONS[action.status as keyof typeof STATUS_ICONS] || AlertCircle;
            const priorityColor = PRIORITY_COLORS[action.priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-500';

            return (
              <Card key={action.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <CardTitle className="text-base">
                        {getActionTypeLabel(action.action_type)}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <div className={`w-2 h-2 rounded-full ${priorityColor} mr-1`} />
                        {getPriorityLabel(action.priority)}
                      </Badge>
                      <Badge variant={
                        action.status === 'COMPLETED' ? 'default' :
                        action.status === 'FAILED' ? 'destructive' :
                        action.status === 'PROCESSING' ? 'secondary' :
                        'outline'
                      }>
                        {action.status}
                      </Badge>
                      {action.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelAction.mutate(action.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Scheduled: {formatDistanceToNow(new Date(action.scheduled_for), { addSuffix: true })}
                  </div>
                  {action.error_message && (
                    <div className="text-sm text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <span>{action.error_message}</span>
                    </div>
                  )}
                  {action.retry_count > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Retry attempt: {action.retry_count}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {JSON.stringify(action.action_payload, null, 2)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {queuedActions?.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
                No actions in queue
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
