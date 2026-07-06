import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { useListHabits, useCreateHabit, useUpdateHabit, useDeleteHabit, useCreateHabitCheckin, getListHabitsQueryKey } from "@workspace/api-client-react";

const habitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export type HabitInsert = z.infer<typeof habitSchema>;

export const useHabits = () => {
  return useListHabits();
};

export const useHabit = (id: number) => {
  const { data: habits, ...rest } = useListHabits();
  const habit = habits?.find(h => h.id === id);
  return { data: habit, ...rest };
};

export const useCreateHabitHook = () => {
  const queryClient = useQueryClient();
  const createHabit = useCreateHabit();

  return {
    ...createHabit,
    mutate: (habitData: HabitInsert) => {
      const validated = habitSchema.parse(habitData);
      return createHabit.mutate({
        data: {
          ...validated,
          streak: 0,
        } as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
          toast.success('Habit created successfully');
        },
        onError: (error: any) => {
          console.error('Create habit error:', error);
          toast.error(error.message || 'Failed to create habit');
        },
      });
    }
  };
};

export const useUpdateHabitHook = () => {
  const queryClient = useQueryClient();
  const updateHabit = useUpdateHabit();

  return {
    ...updateHabit,
    mutate: ({ id, ...updates }: Partial<HabitInsert> & { id: number }) => {
      return updateHabit.mutate({
        id,
        data: updates as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
          toast.success('Habit updated');
        },
        onError: () => {
          toast.error('Failed to update habit');
        },
      });
    }
  };
};


export const useDeleteHabitHook = () => {
  const queryClient = useQueryClient();
  const deleteHabit = useDeleteHabit();

  return {
    ...deleteHabit,
    mutate: (id: number) => {
      return deleteHabit.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
          toast.success('Habit deleted');
        },
        onError: () => {
          toast.error('Failed to delete habit');
        },
      });
    }
  };
};

export const useHabitCheckin = () => {
  const queryClient = useQueryClient();
  const createCheckin = useCreateHabitCheckin();
  const updateHabit = useUpdateHabit();

  return {
    ...createCheckin,
    mutate: async ({ habitId, date, done }: { habitId: number; date: string; done: boolean }) => {
      if (done) {
        return createCheckin.mutate({
          habitId,
          data: {
            date,
            done: true
          }
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
            toast.success('Habit updated');
          },
          onError: (error: any) => {
            console.error('Checkin error:', error);
            toast.error('Failed to update habit');
          }
        });
      } else {
        // Degraded: Backend might not support deleting checkin via this hook or we need a delete hook
        // For now, let's just try to update the habit directly or just toast
        toast.error('Removing check-ins is currently not supported via API');
      }
    }
  };
};
