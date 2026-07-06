import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { BudgetsTab } from "@/components/finance/BudgetsTab";
import { IncomeTab } from "@/components/finance/IncomeTab";
import { ExpensesTab } from "@/components/finance/ExpensesTab";
import { SavingsGoalsTab } from "@/components/finance/SavingsGoalsTab";
import { DebtsTab } from "@/components/finance/DebtsTab";
import { useIncome, useExpenses, useDebts } from "@/hooks/useFinance";

export default function Finance() {
  const { data: income, isLoading: incomeLoading } = useIncome();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: debts, isLoading: debtsLoading } = useDebts();

  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const totalDebt = debts?.reduce((sum, d) => sum + Number(d.balance), 0) ?? 0;
  const net = totalIncome - totalExpenses;

  const statsLoading = incomeLoading || expensesLoading || debtsLoading;

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
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net</CardTitle>
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

      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="savings">Savings Goals</TabsTrigger>
          <TabsTrigger value="debts">Debts</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets"><BudgetsTab /></TabsContent>
        <TabsContent value="income"><IncomeTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="savings"><SavingsGoalsTab /></TabsContent>
        <TabsContent value="debts"><DebtsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
