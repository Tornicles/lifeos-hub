import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListBudgets, useCreateBudget, useDeleteBudget, getListBudgetsQueryKey,
  useListIncome, useCreateIncome, useDeleteIncome, getListIncomeQueryKey,
  useListExpenses, useCreateExpense, useDeleteExpense, getListExpensesQueryKey,
  useListSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, getListSavingsGoalsQueryKey,
  useListDebts, useCreateDebt, useDeleteDebt, getListDebtsQueryKey,
  useListInvestmentEntries as useListInvestments, useCreateInvestmentEntry as useCreateInvestment, useDeleteInvestmentEntry as useDeleteInvestment, getListInvestmentEntriesQueryKey as getListInvestmentsQueryKey,
  type BudgetInput, type IncomeInput, type ExpenseInput, type SavingsGoalInput, type SavingsGoalUpdate, type DebtInput, type InvestmentEntryInput,
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

// Budgets
export const useBudgets = () => useListBudgets();
export const useAddBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateBudget();
  return {
    ...mutation,
    mutate: (data: BudgetInput, opts?: { onSuccess?: () => void; onDuplicate?: (message: string) => void }) =>
      mutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
            toast.success('Budget added');
            opts?.onSuccess?.();
          },
          onError: (error: any) => {
            if (error?.status === 409 && opts?.onDuplicate) {
              opts.onDuplicate(error?.data?.error || 'You already have a budget for this category this month — edit it instead');
              return;
            }
            console.error('Failed to add budget', error);
            toast.error(error?.data?.error || error?.message || 'Failed to add budget');
          },
        },
      ),
  };
};
export const useRemoveBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteBudget();
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({ id }, onMutationResult(queryClient, getListBudgetsQueryKey(), 'Budget deleted', 'Failed to delete budget')),
  };
};

// Income
export const useIncome = () => useListIncome();
export const useAddIncome = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateIncome();
  return {
    ...mutation,
    mutate: (data: IncomeInput) =>
      mutation.mutate({ data }, onMutationResult(queryClient, getListIncomeQueryKey(), 'Income added', 'Failed to add income')),
  };
};
export const useRemoveIncome = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteIncome();
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({ id }, onMutationResult(queryClient, getListIncomeQueryKey(), 'Income deleted', 'Failed to delete income')),
  };
};

// Expenses
export const useExpenses = () => useListExpenses();
export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateExpense();
  return {
    ...mutation,
    mutate: (data: ExpenseInput) =>
      mutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
            if (data.budgetId) {
              queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
            }
            toast.success('Expense added');
          },
          onError: (error: any) => {
            console.error('Failed to add expense', error);
            toast.error(error?.data?.error || error?.message || 'Failed to add expense');
          },
        },
      ),
  };
};
export const useRemoveExpense = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteExpense();
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({ id }, onMutationResult(queryClient, getListExpensesQueryKey(), 'Expense deleted', 'Failed to delete expense')),
  };
};

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
export const useRemoveDebt = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteDebt();
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({ id }, onMutationResult(queryClient, getListDebtsQueryKey(), 'Debt deleted', 'Failed to delete debt')),
  };
};

// Investments
export const useInvestments = () => useListInvestments();
export const useAddInvestment = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateInvestment();
  return {
    ...mutation,
    mutate: (data: InvestmentEntryInput) =>
      mutation.mutate({ data }, onMutationResult(queryClient, getListInvestmentsQueryKey(), 'Investment entry added', 'Failed to add investment entry')),
  };
};
export const useRemoveInvestment = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteInvestment();
  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({ id }, onMutationResult(queryClient, getListInvestmentsQueryKey(), 'Investment entry deleted', 'Failed to delete investment entry')),
  };
};
