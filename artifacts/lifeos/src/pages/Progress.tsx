import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { TrendingUp, Target, Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useBudgets, useExpenses, useNetWorthSnapshots, useSavingsGoals } from "@/hooks/useFinance";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shortDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Progress() {
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: snapshots, isLoading: snapshotsLoading } = useNetWorthSnapshots();
  const { data: goals, isLoading: goalsLoading } = useSavingsGoals();

  const monthKey = currentMonth();

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (expenses ?? []).forEach((e) => {
      if (String(e.expenseDate).slice(0, 7) !== monthKey) return;
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    });
    return map;
  }, [expenses, monthKey]);

  const budgetChartData = useMemo(() => {
    return (budgets ?? [])
      .filter((b) => b.month === monthKey)
      .map((b) => ({
        category: b.category,
        budget: Number(b.monthlyLimit),
        actual: spentByCategory.get(b.category) ?? 0,
      }));
  }, [budgets, monthKey, spentByCategory]);

  const sortedSnapshots = useMemo(() => {
    if (!snapshots) return [];
    return [...snapshots].sort((a, b) => String(a.snapshotDate).localeCompare(String(b.snapshotDate)));
  }, [snapshots]);

  const netWorthChartData = sortedSnapshots.map((s) => ({
    date: shortDate(String(s.snapshotDate)),
    netWorth: Number(s.netWorth),
  }));

  const sortedGoals = useMemo(() => {
    return [...(goals ?? [])].sort(
      (a, b) => Number(b.currentAmount) / Number(b.targetAmount) - Number(a.currentAmount) / Number(a.targetAmount)
    );
  }, [goals]);

  const isLoading = budgetsLoading || expensesLoading || snapshotsLoading || goalsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="h-9 w-9 text-indigo-600" />
          Progress
        </h1>
        <p className="text-muted-foreground text-lg">A read-only look at how your finances are trending</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Budget vs. Actual — This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgetsLoading || expensesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : budgetChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <p className="text-muted-foreground text-sm">No budgets set for this month yet.</p>
              <p className="text-xs text-muted-foreground">Add a budget on the Finance page to see this chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetChartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                  width={56}
                />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                <Legend />
                <Bar dataKey="budget" name="Budgeted" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Net Worth Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {snapshotsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : sortedSnapshots.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <p className="text-muted-foreground text-sm">Log a few net worth snapshots to see your trend.</p>
              <p className="text-xs text-muted-foreground">You need at least 2 snapshots to display a chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={netWorthChartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  angle={-40}
                  textAnchor="end"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => (v >= 1000 || v <= -1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                  width={56}
                />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Worth"]} />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Savings Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goalsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : sortedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <p className="text-muted-foreground text-sm">No savings goals yet.</p>
              <p className="text-xs text-muted-foreground">Add one on the Finance page to track progress here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedGoals.map((goal) => {
                const current = Number(goal.currentAmount);
                const target = Number(goal.targetAmount);
                const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-muted-foreground">
                        ${current.toLocaleString()} / ${target.toLocaleString()} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <ProgressBar value={percent} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
