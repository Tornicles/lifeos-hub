import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const habitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export type HabitInsert = z.infer<typeof habitSchema>;

export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .select('*, habit_checkins(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useHabit = (id: number) => {
  return useQuery({
    queryKey: ['habit', id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .select('*, habit_checkins(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitData: HabitInsert) => {
      const validated = habitSchema.parse(habitData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...validated,
          user_id: user.id,
          streak: 0,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit created successfully');
    },
    onError: (error: any) => {
      console.error('Create habit error:', error);
      toast.error(error.message || 'Failed to create habit');
    },
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HabitInsert> & { id: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit updated');
    },
    onError: () => {
      toast.error('Failed to update habit');
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit deleted');
    },
    onError: () => {
      toast.error('Failed to delete habit');
    },
  });
};

export const useHabitCheckin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date, done }: { habitId: number; date: string; done: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify habit ownership
      const { data: habit } = await supabase
        .from('habits')
        .select('id, streak, last_checkin')
        .eq('id', habitId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!habit) throw new Error('Habit not found or access denied');

      if (done) {
        // Create check-in
        const { error } = await supabase
          .from('habit_checkins')
          .upsert({
            habit_id: habitId,
            date,
            done: true,
          }, {
            onConflict: 'habit_id,date',
          });

        if (error) throw error;

        // Update streak
        const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
        const newStreak = habit.last_checkin === yesterday ? (habit.streak || 0) + 1 : 1;

        await supabase
          .from('habits')
          .update({
            streak: newStreak,
            last_checkin: date,
          })
          .eq('id', habitId);
      } else {
        // Delete check-in
        await supabase
          .from('habit_checkins')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', date);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit updated');
    },
    onError: (error: any) => {
      console.error('Checkin error:', error);
      toast.error('Failed to update habit');
    },
  });
};