import { useQueryClient } from '@tanstack/react-query';
import { useListLogs, useCreateLog as useCreateLogApi, useUpdateLog as useUpdateLogApi, useDeleteLog as useDeleteLogApi, getListLogsQueryKey, getListMetricsQueryKey } from "@workspace/api-client-react";
import { toast } from 'sonner';
import { z } from 'zod';

const logSchema = z.object({
  hubId: z.number().int().positive().optional().nullable(),
  source: z.string().trim().min(1).max(100),
  metric: z.string().trim().max(100).optional().nullable(),
  value: z.number().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type LogInsert = z.infer<typeof logSchema>;

// NOTE: `filters` (hubId/startDate/endDate) is accepted for API
// compatibility with callers but not yet wired to the backend query params.
export const useLogs = (filters?: { hubId?: number; startDate?: string; endDate?: string }) => {
  return useListLogs();
};

export const useCreateLog = () => {
  const queryClient = useQueryClient();
  const createMutation = useCreateLogApi();

  return {
    ...createMutation,
    mutate: (logData: LogInsert) => {
      const validated = logSchema.parse(logData);
      return createMutation.mutate({
        data: {
          hubId: validated.hubId ?? undefined,
          source: validated.source,
          metric: validated.metric ?? undefined,
          value: validated.value ?? undefined,
          notes: validated.notes ?? undefined,
          logDate: validated.logDate,
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['automation-engine'] });
          toast.success('Log created successfully');
        },
        onError: (error: any) => {
          console.error('Create log error:', error);
          toast.error(error.message || 'Failed to create log');
        },
      });
    },
    mutateAsync: async (logData: LogInsert) => {
      const validated = logSchema.parse(logData);
      try {
        const result = await createMutation.mutateAsync({
          data: {
            hubId: validated.hubId ?? undefined,
            source: validated.source,
            metric: validated.metric ?? undefined,
            value: validated.value ?? undefined,
            notes: validated.notes ?? undefined,
            logDate: validated.logDate,
          }
        });
        queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['automation-engine'] });
        toast.success('Log created successfully');
        return result;
      } catch (error: any) {
        console.error('Create log error:', error);
        toast.error(error.message || 'Failed to create log');
        throw error;
      }
    }
  };
};

export const useUpdateLog = () => {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateLogApi();

  return {
    ...updateMutation,
    mutate: ({ id, ...updates }: Partial<LogInsert> & { id: number }) => {
      return updateMutation.mutate({
        id,
        data: updates as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
          toast.success('Log updated');
        },
        onError: () => {
          toast.error('Failed to update log');
        },
      });
    },
    mutateAsync: async ({ id, ...updates }: Partial<LogInsert> & { id: number }) => {
      try {
        const result = await updateMutation.mutateAsync({
          id,
          data: updates as any
        });
        queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
        toast.success('Log updated');
        return result;
      } catch (error) {
        toast.error('Failed to update log');
        throw error;
      }
    }
  };
};

export const useDeleteLog = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteLogApi();

  return {
    ...deleteMutation,
    mutate: (id: number) => {
      return deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
          toast.success('Log deleted');
        },
        onError: () => {
          toast.error('Failed to delete log');
        },
      });
    },
    mutateAsync: async (id: number) => {
      try {
        const result = await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
        toast.success('Log deleted');
        return result;
      } catch (error) {
        toast.error('Failed to delete log');
        throw error;
      }
    }
  };
};