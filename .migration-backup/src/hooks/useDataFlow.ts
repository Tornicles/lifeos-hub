import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type FlowType = 'log_created' | 'habit_checkin' | 'project_updated' | 'calendar_event';

interface DataFlowParams {
  flow_type: FlowType;
  data: Record<string, any>;
}

export const useDataFlow = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processFlow = useMutation({
    mutationFn: async ({ flow_type, data }: DataFlowParams) => {
      // User ID is extracted from auth in the edge function
      const { data: result, error } = await supabase.functions.invoke('data-flow-processor', {
        body: { flow_type, data }
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries based on flow type
      if (variables.flow_type === 'log_created') {
        queryClient.invalidateQueries({ queryKey: ['metrics'] });
        queryClient.invalidateQueries({ queryKey: ['ultra-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      } else if (variables.flow_type === 'habit_checkin') {
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else if (variables.flow_type === 'project_updated') {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['metrics'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else if (variables.flow_type === 'calendar_event') {
        queryClient.invalidateQueries({ queryKey: ['calendar-entries'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
