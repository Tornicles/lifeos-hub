import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import { useSavingsGoals, useAddSavingsGoal, useUpdateSavingsGoalProgress, useRemoveSavingsGoal } from "@/hooks/useFinance";

export function SavingsGoalsTab() {
  const { data: goals, isLoading } = useSavingsGoals();
  const addMutation = useAddSavingsGoal();
  const updateMutation = useUpdateSavingsGoalProgress();
  const removeMutation = useRemoveSavingsGoal();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ name, targetAmount, targetDate: targetDate || undefined });
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setOpen(false);
  };

  const addContribution = (id: string, currentAmount: string) => {
    const amountStr = window.prompt("How much did you add to this goal?");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (Number.isNaN(amount) || amount <= 0) return;
    const newAmount = (Number(currentAmount) + amount).toFixed(2);
    updateMutation.mutate({ id, currentAmount: newAmount });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Name *</Label>
                <Input id="goal-name" placeholder="e.g., Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target Amount *</Label>
                <Input id="goal-target" type="number" step="0.01" placeholder="5000.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-date">Target Date (optional)</Label>
                <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Creating..." : "Create Goal"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : goals && goals.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
            return (
              <Card key={goal.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{goal.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${Number(goal.currentAmount).toFixed(2)} of ${Number(goal.targetAmount).toFixed(2)}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(goal.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{pct}% complete</span>
                    <Button variant="outline" size="sm" onClick={() => addContribution(goal.id, goal.currentAmount)}>
                      Add Contribution
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PiggyBank className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No savings goals yet. Set one to start tracking progress.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
