import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListGames,
  useListGameSessions,
  useCreateGameSession,
  useGetGameSession,
  useCreateGameResponse,
  useGetHouseholdDashboard,
  getListGameSessionsQueryKey,
  getGetGameSessionQueryKey,
  getGetHouseholdDashboardQueryKey,
  type GameResponseInput,
} from '@workspace/api-client-react';

export const useGames = () => useListGames();

export const useGameSessions = (coupleId: string) =>
  useListGameSessions(coupleId, {
    query: { enabled: !!coupleId, queryKey: getListGameSessionsQueryKey(coupleId) },
  });

export const useStartGameSession = (coupleId: string) => {
  const queryClient = useQueryClient();
  const mutation = useCreateGameSession();
  return {
    ...mutation,
    mutate: (gameId: number, opts?: { onSuccess?: (sessionId: string) => void }) =>
      mutation.mutate(
        { id: coupleId, data: { gameId } },
        {
          onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: getListGameSessionsQueryKey(coupleId) });
            opts?.onSuccess?.(result.id);
          },
          onError: (error: any) => {
            console.error('Failed to start game', error);
            toast.error(error?.data?.error || error?.message || 'Failed to start game');
          },
        },
      ),
  };
};

export const useGameSession = (sessionId: string) =>
  useGetGameSession(sessionId, {
    query: { enabled: !!sessionId, refetchInterval: 4000, queryKey: getGetGameSessionQueryKey(sessionId) },
  });

export const useSubmitGameResponse = (sessionId: string, coupleId?: string) => {
  const queryClient = useQueryClient();
  const mutation = useCreateGameResponse();
  return {
    ...mutation,
    mutate: (data: GameResponseInput, opts?: { onSuccess?: () => void }) =>
      mutation.mutate(
        { id: sessionId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetGameSessionQueryKey(sessionId) });
            if (coupleId) queryClient.invalidateQueries({ queryKey: getListGameSessionsQueryKey(coupleId) });
            opts?.onSuccess?.();
          },
          onError: (error: any) => {
            if (error?.status === 409) {
              toast.info('This round is already complete');
            } else {
              console.error('Failed to submit response', error);
              toast.error(error?.data?.error || error?.message || 'Failed to submit response');
            }
          },
        },
      ),
  };
};

export const useHouseholdDashboard = (coupleId: string) =>
  useGetHouseholdDashboard(coupleId, {
    query: { enabled: !!coupleId, queryKey: getGetHouseholdDashboardQueryKey(coupleId) },
  });
