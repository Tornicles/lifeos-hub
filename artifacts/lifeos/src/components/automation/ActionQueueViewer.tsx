import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useListAutomationQueue, useProcessAutomationQueue, useUpdateAutoAction, getListAutomationQueueQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  const { data: queuedActions, isLoading } = useListAutomationQueue();

  const processActions = useProcessAutomationQueue();
  const updateAction = useUpdateAutoAction();

  const handleProcessActions = async () => {
    try {
      await processActions.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getListAutomationQueueQueryKey() });
      toast.success('Actions processed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process actions');
    }
  };

  const handleCancelAction = async (actionId: number) => {
    try {
      await updateAction.mutateAsync({
        id: actionId,
        data: { status: 'CANCELLED' }
      });
      queryClient.invalidateQueries({ queryKey: getListAutomationQueueQueryKey() });
      toast.success('Action cancelled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel action');
    }
  };

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
          onClick={handleProcessActions}
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
            const priorityColor = PRIORITY_COLORS[(action.priority || 1) as keyof typeof PRIORITY_COLORS] || 'bg-gray-500';

            return (
              <Card key={action.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <CardTitle className="text-base">
                        {getActionTypeLabel(action.actionType)}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <div className={`w-2 h-2 rounded-full ${priorityColor} mr-1`} />
                        {getPriorityLabel(action.priority || 1)}
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
                          onClick={() => handleCancelAction(action.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Scheduled: {action.scheduledFor ? formatDistanceToNow(new Date(action.scheduledFor), { addSuffix: true }) : 'N/A'}
                  </div>
                  {action.errorMessage && (
                    <div className="text-sm text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <span>{action.errorMessage}</span>
                    </div>
                  )}
                  {(action.retryCount || 0) > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Retry attempt: {action.retryCount}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {JSON.stringify(action.actionPayload, null, 2)}
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
