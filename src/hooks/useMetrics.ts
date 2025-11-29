import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const metricSchema = z.object({
  hub_id: z.number().int().positive().optional().nullable(),
  name: z.string().trim().min(1).max(100),
  value: z.number(),
  metric_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type MetricInsert = z.infer<typeof metricSchema>;

export const useMetrics = (filters?: { hubId?: number; name?: string; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['metrics', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('metrics')
        .select('*, hubs(name, code)')
        .eq('user_id', user.id)
        .order('metric_date', { ascending: false });

      if (filters?.hubId) {
        query = query.eq('hub_id', filters.hubId);
      }
      if (filters?.name) {
        query = query.eq('name', filters.name);
      }
      if (filters?.startDate) {
        query = query.gte('metric_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('metric_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useUltraMetrics = (filters?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['ultra-metrics', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('ultra_metrics')
        .select('*, ultra_domains(name, code)')
        .eq('user_id', user.id)
        .order('metric_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('metric_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('metric_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metricData: MetricInsert) => {
      const validated = metricSchema.parse(metricData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('metrics')
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
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['automation-engine'] });
      toast.success('Metric saved');
    },
    onError: (error: any) => {
      console.error('Create metric error:', error);
      toast.error(error.message || 'Failed to save metric');
    },
  });
};