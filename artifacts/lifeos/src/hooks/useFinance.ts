import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, getListSavingsGoalsQueryKey,
  useListDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, getListDebtsQueryKey,
  useListSavingsChallenges, useCreateSavingsChallenge, useCheckInSavingsChallenge, getListSavingsChallengesQueryKey,
  useListShareableCards, getListShareableCardsQueryKey,
  useListSavingsGoalContributions, useCreateSavingsGoalContribution, getListSavingsGoalContributionsQueryKey,
  type SavingsGoalInput, type SavingsGoalUpdate, type DebtInput, type DebtUpdate,
  type SavingsChallengeInput, type SavingsChallengeCheckInInput, type SavingsGoalContributionInput,
} from '@workspace/api-client-react';

function onMutationResult(queryClient: ReturnType<typeof useQueryClient>, queryKey: readonly unknown[], successMsg: string, errorMsg: string) {
  return {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMsg);
    },
    onError: (error: any) => {
      console.error(errorMsg, error);
      toast.error(error?.message || errorMsg);
    },
  };
}

// Savings Goals
export const useSavingsGoals = () => useListSavingsGoals();
export const useAddSavingsGoal = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateSavingsGoal();
  return {
    ...mutation,
    mutate: (data: SavingsGoalInput) =>
      mutation.mutate({ data }, onMutationResult(queryClient, getListSavingsGoalsQueryKey(), 'Savings goal added', 'Failed to add savings goal')),
  };
};
export const useUpdateSavingsGoalProgress = () => {
  const queryClient = useQueryClient();
  const mutation = useUpdateSavingsGoal();
  return {
    ...mutation,
    mutate: ({ id, ...data }: SavingsGoalUpdate & { id: string }) =>
      mutation.mutate({ id, data }, onMutationResult(queryClient, getListSavingsGoalsQueryKey(), 'Savings goal updated', 'Failed to update savings goal')),
  };
};
export const useRemoveSavingsGoal = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteSavingsGoal();
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({ id }, onMutationResult(queryClient, getListSavingsGoalsQueryKey(), 'Savings goal deleted', 'Failed to delete savings goal')),
  };
};

export const useSavingsGoalContributions = (goalId: string) =>
  useListSavingsGoalContributions(goalId, {
    query: { enabled: !!goalId, queryKey: getListSavingsGoalContributionsQueryKey(goalId) },
  });
export const useAddSavingsGoalContribution = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateSavingsGoalContribution();
  return {
    ...mutation,
    mutate: ({ id, ...data }: SavingsGoalContributionInput & { id: string }, opts?: { onSuccess?: () => void }) =>
      mutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSavingsGoalsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListSavingsGoalContributionsQueryKey(id) });
            toast.success('Contribution added');
            opts?.onSuccess?.();
          },
          onError: (error: any) => {
            console.error('Failed to add contribution', error);
            toast.error(error?.data?.error || error?.message || 'Failed to add contribution');
          },
        },
      ),
  };
};

// Debts
export const useDebts = () => useListDebts();
export const useAddDebt = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateDebt();
  return {
    ...mutation,
    mutate: (data: DebtInput) =>
      mutation.mutate({ data }, onMutationResult(queryClient, getListDebtsQueryKey(), 'Debt added', 'Failed to add debt')),
  };
};
export const useUpdateDebtBalance = () => {
  const queryClient = useQueryClient();
  const mutation = useUpdateDebt();
  return {
    ...mutation,
    mutate: ({ id, ...data }: DebtUpdate & { id: string }) =>
      mutation.mutate({ id, data }, onMutationResult(queryClient, getListDebtsQueryKey(), 'Debt updated', 'Failed to update debt')),
  };
};
export const useRemoveDebt = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteDebt();
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({ id }, onMutationResult(queryClient, getListDebtsQueryKey(), 'Debt deleted', 'Failed to delete debt')),
  };
};

// Savings Challenges
export const useSavingsChallenges = () => useListSavingsChallenges();
export const useAddSavingsChallenge = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateSavingsChallenge();
  return {
    ...mutation,
    mutate: (data: SavingsChallengeInput) =>
      mutation.mutate({ data }, onMutationResult(queryClient, getListSavingsChallengesQueryKey(), 'Challenge started', 'Failed to start challenge')),
  };
};
export const useCheckInChallenge = () => {
  const queryClient = useQueryClient();
  const mutation = useCheckInSavingsChallenge();
  return {
    ...mutation,
    mutate: ({ id, ...data }: SavingsChallengeCheckInInput & { id: string }, opts?: { onSuccess?: () => void }) =>
      mutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSavingsChallengesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListShareableCardsQueryKey() });
            toast.success('Checked in!');
            opts?.onSuccess?.();
          },
          onError: (error: any) => {
            console.error('Failed to check in', error);
            toast.error(error?.data?.error || error?.message || 'Failed to check in');
          },
        },
      ),
  };
};

// Shareable Cards
export const useShareableCards = () => useListShareableCards();
