import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck } from "lucide-react";
import { useExpenses, useSavingsGoals } from "@/hooks/useFinance";

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function EmergencyFundTab() {
  const { data: expenses, isLoading: expensesLoading, isError: expensesError } = useExpenses();
  const { data: goals, isLoading: goalsLoading, isError: goalsError } = useSavingsGoals();

  const isLoading = expensesLoading || goalsLoading;
  const isError = expensesError || goalsError;

  const avgMonthlyExpense = useMemo(() => {
    if (!expenses) return 0;
    const cutoff = monthsAgo(3);
    const recent = expenses.filter((e) => new Date(e.expenseDate) >= cutoff);
    const total = recent.reduce((sum, e) => sum + Number(e.amount), 0);
    return total / 3;
  }, [expenses]);

  const emergencyFund = useMemo(() => {
    if (!goals) return undefined;
    return goals.find((g) => g.name.trim().toLowerCase() === "emergency fund");
  }, [goals]);

  const fundAmount = emergencyFund ? Number(emergencyFund.currentAmount) : 0;
  const monthsOfCoverage = avgMonthlyExpense > 0 ? fundAmount / avgMonthlyExpense : 0;
  const gaugePercent = Math.min(100, Math.round((monthsOfCoverage / 6) * 100));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Designation method: we look for a savings goal named "Emergency Fund" (case-insensitive). Rename or create a
        savings goal with that name in the Savings Goals tab to have it tracked here.
      </p>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Couldn't load emergency fund data right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : !emergencyFund ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              No emergency fund set up yet. Create a savings goal named "Emergency Fund" to track your coverage here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Current Fund</div>
                <div className="text-2xl font-bold">${fundAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Monthly Expenses (3mo)</div>
                <div className="text-2xl font-bold">${avgMonthlyExpense.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Months of Coverage</div>
                <div className="text-2xl font-bold">{avgMonthlyExpense > 0 ? monthsOfCoverage.toFixed(1) : "—"}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>0 months</span>
                <span>Target: 3–6 months</span>
                <span>6+ months</span>
              </div>
              <Progress
                value={gaugePercent}
                indicatorClassName={monthsOfCoverage >= 3 ? "bg-green-600" : monthsOfCoverage >= 1 ? "bg-yellow-500" : "bg-red-600"}
              />
              <p className="text-sm text-muted-foreground">
                {monthsOfCoverage >= 6
                  ? "You've reached the full 6-month target — great work!"
                  : monthsOfCoverage >= 3
                    ? "You're within the standard 3–6 month target range."
                    : avgMonthlyExpense === 0
                      ? "Add some expenses to calculate your target coverage."
                      : "Keep contributing — aim for at least 3 months of expenses covered."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
