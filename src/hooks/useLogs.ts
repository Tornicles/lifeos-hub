import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const logSchema = z.object({
  hub_id: z.number().int().positive().optional().nullable(),
  source: z.string().trim().min(1).max(100),
  metric: z.string().trim().max(100).optional().nullable(),
  value: z.number().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type LogInsert = z.infer<typeof logSchema>;

export const useLogs = (filters?: { hubId?: number; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['logs', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('logs')
        .select('*, hubs(name, code)')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.hubId) {
        query = query.eq('hub_id', filters.hubId);
      }
      if (filters?.startDate) {
        query = query.gte('log_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('log_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logData: LogInsert) => {
      // Validate input
      const validated = logSchema.parse(logData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('logs')
        .insert({
          ...validated,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['ultra-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['automation-engine'] });
      toast.success('Log created successfully');
    },
    onError: (error: any) => {
      console.error('Create log error:', error);
      toast.error(error.message || 'Failed to create log');
    },
  });
};

export const useUpdateLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LogInsert> & { id: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('logs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      toast.success('Log updated');
    },
    onError: () => {
      toast.error('Failed to update log');
    },
  });
};

export const useDeleteLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      toast.success('Log deleted');
    },
    onError: () => {
      toast.error('Failed to delete log');
    },
  });
};