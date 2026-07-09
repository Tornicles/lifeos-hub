import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { BudgetsTab } from "@/components/finance/BudgetsTab";
import { IncomeTab } from "@/components/finance/IncomeTab";
import { ExpensesTab } from "@/components/finance/ExpensesTab";
import { SavingsGoalsTab } from "@/components/finance/SavingsGoalsTab";
import { DebtsTab } from "@/components/finance/DebtsTab";
import { EmergencyFundTab } from "@/components/finance/EmergencyFundTab";
import { InvestmentsTab } from "@/components/finance/InvestmentsTab";
import { NetWorthTab } from "@/components/finance/NetWorthTab";
import { useIncome, useExpenses, useDebts } from "@/hooks/useFinance";
import { useCalendarEntries } from "@/hooks/useCalendar";
import { Receipt } from "lucide-react";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function Finance() {
  const { data: income, isLoading: incomeLoading } = useIncome();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: debts, isLoading: debtsLoading } = useDebts();
  const { data: calendarEntries, isLoading: billsLoading } = useCalendarEntries();

  const monthKey = currentMonthKey();
  const monthIncome = income?.filter((i) => i.receivedDate?.toString().slice(0, 7) === monthKey) ?? [];
  const monthExpenses = expenses?.filter((e) => e.expenseDate?.toString().slice(0, 7) === monthKey) ?? [];

  const totalIncome = monthIncome.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalDebt = debts?.reduce((sum, d) => sum + Number(d.balance), 0) ?? 0;
  const net = totalIncome - totalExpenses;

  const statsLoading = incomeLoading || expensesLoading || debtsLoading;

  function daysUntilDue(dueDay: number) {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (dueDay >= currentDay) return dueDay - currentDay;
    const daysLeftThisMonth = daysInMonth - currentDay;
    return daysLeftThisMonth + dueDay;
  }

  const thisWeekBills = (calendarEntries ?? [])
    .filter((e) => e.dueDay !== null && e.dueDay !== undefined && daysUntilDue(e.dueDay) <= 7)
    .sort((a, b) => daysUntilDue(a.dueDay ?? 0) - daysUntilDue(b.dueDay ?? 0));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <DollarSign className="h-9 w-9 text-green-600" />
          Finance
        </h1>
        <p className="text-muted-foreground text-lg">Track budgets, income, expenses, savings, and debt</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Income This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expenses This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className={`text-2xl font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>${net.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">${totalDebt.toFixed(2)}</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Bills Due This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billsLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : thisWeekBills.length === 0 ? (
            <div className="text-sm text-muted-foreground">No bills due in the next 7 days</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {thisWeekBills.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                  <span className="truncate">{b.title}</span>
                  <span className="font-semibold">${Number(b.amount ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="savings">Savings Goals</TabsTrigger>
          <TabsTrigger value="debts">Debts</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Fund</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="net-worth">Net Worth</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets"><BudgetsTab /></TabsContent>
        <TabsContent value="income"><IncomeTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="savings"><SavingsGoalsTab /></TabsContent>
        <TabsContent value="debts"><DebtsTab /></TabsContent>
        <TabsContent value="emergency"><EmergencyFundTab /></TabsContent>
        <TabsContent value="investments"><InvestmentsTab /></TabsContent>
        <TabsContent value="net-worth"><NetWorthTab /></TabsContent>
      </Tabs>
    </div>
  );
}
