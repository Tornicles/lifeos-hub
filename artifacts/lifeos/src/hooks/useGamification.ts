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
} from '@workspace/api-client-react';

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
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListChallengeCompletionsQueryKey() });
            toast.success('Challenge completed! XP awarded.');
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
