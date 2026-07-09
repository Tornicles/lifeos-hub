import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListChallenges,
  useListChallengeCompletions,
  useCreateChallengeCompletion,
  getListChallengeCompletionsQueryKey,
  useListXpEvents,
  useListBadges,
  useListUserBadges,
  getListUserBadgesQueryKey,
  getListHabitsQueryKey,
} from '@workspace/api-client-react';
import { celebrateGamification } from '@/lib/gamificationToast';

export const useChallenges = () => useListChallenges();
export const useChallengeCompletions = () => useListChallengeCompletions();

export const useCompleteChallenge = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateChallengeCompletion();
  return {
    ...mutation,
    mutate: (challengeId: number) =>
      mutation.mutate(
        { data: { challengeId } },
        {
          onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: getListChallengeCompletionsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
            toast.success('Challenge completed!');
            if (data?.newBadges?.length) {
              queryClient.invalidateQueries({ queryKey: getListUserBadgesQueryKey() });
            }
            celebrateGamification(data);
          },
          onError: (error: any) => {
            console.error('Complete challenge error:', error);
            toast.error(error?.message || 'Failed to complete challenge');
          },
        },
      ),
  };
};

export const useXpEvents = () => useListXpEvents();
export const useBadges = () => useListBadges();
export const useUserBadges = () => useListUserBadges();
