import { useQueryClient } from '@tanstack/react-query';
import { useListMetrics, useListUltraMetrics, useCreateMetric as useCreateMetricApi, getListMetricsQueryKey } from "@workspace/api-client-react";
import { toast } from 'sonner';
import { z } from 'zod';

const metricSchema = z.object({
  hubId: z.number().int().positive().optional().nullable(),
  name: z.string().trim().min(1).max(100),
  value: z.number(),
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type MetricInsert = z.infer<typeof metricSchema>;

export const useMetrics = (filters?: { hubId?: number; name?: string; startDate?: string; endDate?: string }) => {
  return useListMetrics({
    tenantId: undefined, // Or get current tenant
  });
};

export const useUltraMetrics = (filters?: { startDate?: string; endDate?: string }) => {
  return useListUltraMetrics({
    tenantId: undefined, // Or get current tenant
  });
};

export const useCreateMetric = () => {
  const queryClient = useQueryClient();
  const createMutation = useCreateMetricApi();

  return {
    ...createMutation,
    mutate: (metricData: MetricInsert) => {
      const validated = metricSchema.parse(metricData);
      return createMutation.mutate({
        data: {
          hubId: validated.hubId ?? undefined,
          name: validated.name,
          value: validated.value,
          metricDate: validated.metricDate,
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['automation-engine'] });
          toast.success('Metric saved');
        },
        onError: (error: any) => {
          console.error('Create metric error:', error);
          toast.error(error.message || 'Failed to save metric');
        },
      });
    },
    mutateAsync: async (metricData: MetricInsert) => {
      const validated = metricSchema.parse(metricData);
      try {
        const result = await createMutation.mutateAsync({
          data: {
            hubId: validated.hubId ?? undefined,
            name: validated.name,
            value: validated.value,
            metricDate: validated.metricDate,
          }
        });
        queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['automation-engine'] });
        toast.success('Metric saved');
        return result;
      } catch (error: any) {
        console.error('Create metric error:', error);
        toast.error(error.message || 'Failed to save metric');
        throw error;
      }
    }
  };
};