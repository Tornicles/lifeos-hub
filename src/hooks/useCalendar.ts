import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const calendarEntrySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  hub_id: z.number().int().positive().optional().nullable(),
  focus_domain: z.string().trim().max(50).optional().nullable(),
});

export type CalendarEntryInsert = z.infer<typeof calendarEntrySchema>;

export const useCalendarEntries = (filters?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['calendar-entries', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('calendar_entries')
        .select('*, hubs(name, code)')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCalendarEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryData: CalendarEntryInsert) => {
      const validated = calendarEntrySchema.parse(entryData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_entries')
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
      queryClient.invalidateQueries({ queryKey: ['calendar-entries'] });
      toast.success('Event created');
    },
    onError: (error: any) => {
      console.error('Create calendar entry error:', error);
      toast.error(error.message || 'Failed to create event');
    },
  });
};

export const useUpdateCalendarEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEntryInsert> & { id: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-entries'] });
      toast.success('Event updated');
    },
    onError: () => {
      toast.error('Failed to update event');
    },
  });
};

export const useDeleteCalendarEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calendar_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-entries'] });
      toast.success('Event deleted');
    },
    onError: () => {
      toast.error('Failed to delete event');
    },
  });
};