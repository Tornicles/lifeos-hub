import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTriggerAutomation, getListMetricsQueryKey, getListUltraMetricsQueryKey, getListHabitsQueryKey, getListNotificationsQueryKey, getListProjectsQueryKey, getListCalendarEntriesQueryKey } from "@workspace/api-client-react";
import { useToast } from '@/hooks/use-toast';

type FlowType = 'log_created' | 'habit_checkin' | 'project_updated' | 'calendar_event';

interface DataFlowParams {
  flow_type: FlowType;
  data: Record<string, any>;
}

export const useDataFlow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const triggerMutation = useTriggerAutomation();

  const processFlow = useMutation({
    mutationFn: async ({ flow_type, data }: DataFlowParams) => {
      return triggerMutation.mutateAsync({
        data: {
          triggerType: flow_type,
          triggerData: data,
          triggerSource: 'data-flow'
        }
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries based on flow type
      if (variables.flow_type === 'log_created') {
        queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUltraMetricsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      } else if (variables.flow_type === 'habit_checkin') {
        queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      } else if (variables.flow_type === 'project_updated') {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      } else if (variables.flow_type === 'calendar_event') {
        queryClient.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    },
    onError: (error) => {
      console.error('Data flow error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process data flow',
        variant: 'destructive',
      });
    },
  });

  return {
    processFlow,
    isProcessing: processFlow.isPending,
  };
};
