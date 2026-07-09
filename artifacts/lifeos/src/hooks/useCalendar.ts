import { useQueryClient } from '@tanstack/react-query';
import { useListCalendarEntries, useCreateCalendarEntry as useCreateCalendarEntryApi, useUpdateCalendarEntry as useUpdateCalendarEntryApi, useDeleteCalendarEntry as useDeleteCalendarEntryApi, getListCalendarEntriesQueryKey } from "@workspace/api-client-react";
import { toast } from 'sonner';
import { z } from 'zod';

const calendarEntrySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  hubId: z.number().int().positive().optional().nullable(),
  focusDomain: z.string().trim().max(50).optional().nullable(),
  amount: z.string().optional().nullable(),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  isAutopay: z.boolean().optional(),
  category: z.string().trim().max(100).optional().nullable(),
});

export type CalendarEntryInsert = z.infer<typeof calendarEntrySchema>;

// NOTE: `filters` (startDate/endDate) is accepted for API compatibility with
// callers but not yet wired to the backend query params.
export const useCalendarEntries = (filters?: { startDate?: string; endDate?: string }) => {
  return useListCalendarEntries();
};

export const useCreateCalendarEntry = () => {
  const queryClient = useQueryClient();
  const createMutation = useCreateCalendarEntryApi();

  return {
    ...createMutation,
    mutate: (entryData: CalendarEntryInsert) => {
      const validated = calendarEntrySchema.parse(entryData);
      return createMutation.mutate({
        data: {
          title: validated.title,
          description: validated.description ?? undefined,
          date: validated.date,
          startTime: validated.startTime ?? undefined,
          endTime: validated.endTime ?? undefined,
          hubId: validated.hubId ?? undefined,
          focusDomain: validated.focusDomain ?? undefined,
          amount: validated.amount ?? undefined,
          dueDay: validated.dueDay ?? undefined,
          isAutopay: validated.isAutopay ?? undefined,
          category: validated.category ?? undefined,
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() });
          toast.success('Event created');
        },
        onError: (error: any) => {
          console.error('Create calendar entry error:', error);
          toast.error(error.message || 'Failed to create event');
        },
      });
    },
    mutateAsync: async (entryData: CalendarEntryInsert) => {
      const validated = calendarEntrySchema.parse(entryData);
      try {
        const result = await createMutation.mutateAsync({
          data: {
            title: validated.title,
            description: validated.description ?? undefined,
            date: validated.date,
            startTime: validated.startTime ?? undefined,
            endTime: validated.endTime ?? undefined,
            hubId: validated.hubId ?? undefined,
            focusDomain: validated.focusDomain ?? undefined,
            amount: validated.amount ?? undefined,
            dueDay: validated.dueDay ?? undefined,
            isAutopay: validated.isAutopay ?? undefined,
            category: validated.category ?? undefined,
          }
        });
        queryClient.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() });
        toast.success('Event created');
        return result;
      } catch (error: any) {
        console.error('Create calendar entry error:', error);
        toast.error(error.message || 'Failed to create event');
        throw error;
      }
    }
  };
};

export const useUpdateCalendarEntry = () => {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateCalendarEntryApi();

  return {
    ...updateMutation,
    mutate: ({ id, ...updates }: Partial<CalendarEntryInsert> & { id: number }) => {
      return updateMutation.mutate({
        id,
        data: updates as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() });
          toast.success('Event updated');
        },
        onError: () => {
          toast.error('Failed to update event');
        },
      });
    },
    mutateAsync: async ({ id, ...updates }: Partial<CalendarEntryInsert> & { id: number }) => {
      try {
        const result = await updateMutation.mutateAsync({
          id,
          data: updates as any
        });
        queryClient.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() });
        toast.success('Event updated');
        return result;
      } catch (error) {
        toast.error('Failed to update event');
        throw error;
      }
    }
  };
};

export const useDeleteCalendarEntry = () => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteCalendarEntryApi();

  return {
    ...deleteMutation,
    mutate: (id: number) => {
      return deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() });
          toast.success('Event deleted');
        },
        onError: () => {
          toast.error('Failed to delete event');
        },
      });
    },
    mutateAsync: async (id: number) => {
      try {
        const result = await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListCalendarEntriesQueryKey() });
        toast.success('Event deleted');
        return result;
      } catch (error) {
        toast.error('Failed to delete event');
        throw error;
      }
    }
  };
};