import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { SavingsGoalsTab } from "@/components/finance/SavingsGoalsTab";
import { DebtsTab } from "@/components/finance/DebtsTab";
import { SavingsChallengesTab } from "@/components/finance/SavingsChallengesTab";
import { ShareableCards } from "@/components/finance/ShareableCards";
import { useDebts } from "@/hooks/useFinance";
import { useCalendarEntries } from "@/hooks/useCalendar";
import { Receipt } from "lucide-react";

export default function Finance() {
  const { data: debts, isLoading: debtsLoading } = useDebts();
  const { data: calendarEntries, isLoading: billsLoading } = useCalendarEntries();

  const totalDebt = debts?.reduce((sum, d) => sum + Number(d.balance), 0) ?? 0;

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
        <p className="text-muted-foreground text-lg">Track savings goals, challenges, and debt payoff</p>
      </div>

      <div className="grid gap-4 md:grid-cols-1 max-w-xs">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            {debtsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">${totalDebt.toFixed(2)}</div>}
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

      <ShareableCards />

      <Tabs defaultValue="savings" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="savings">Savings Goals</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="debts">Debts</TabsTrigger>
        </TabsList>
        <TabsContent value="savings"><SavingsGoalsTab /></TabsContent>
        <TabsContent value="challenges"><SavingsChallengesTab /></TabsContent>
        <TabsContent value="debts"><DebtsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
