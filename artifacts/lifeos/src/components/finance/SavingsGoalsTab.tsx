import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import {
  useSavingsGoals,
  useAddSavingsGoal,
  useRemoveSavingsGoal,
  useSavingsGoalContributions,
  useAddSavingsGoalContribution,
} from "@/hooks/useFinance";
import { useCouples } from "@/hooks/useCouples";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";

interface FormState {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  isShared: boolean;
}

const emptyForm: FormState = {
  name: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  isShared: false,
};

function daysRemaining(targetDate: string | null | undefined): number | null {
  if (!targetDate) return null;
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function SavingsGoalsTab() {
  const { data: goals, isLoading, isError } = useSavingsGoals();
  const { data: couples } = useCouples();
  const couple = couples?.[0];
  const isLinked = couple?.status === "active";
  const addMutation = useAddSavingsGoal();
  const removeMutation = useRemoveSavingsGoal();
  const addContributionMutation = useAddSavingsGoalContribution();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [contributionInputs, setContributionInputs] = useState<Record<string, string>>({});

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required";
    const targetNum = Number(form.targetAmount);
    if (!form.targetAmount.trim() || Number.isNaN(targetNum) || targetNum <= 0) {
      next.targetAmount = "Target amount must be a positive number";
    }
    if (form.currentAmount.trim()) {
      const currentNum = Number(form.currentAmount);
      if (Number.isNaN(currentNum) || currentNum < 0) {
        next.currentAmount = "Current amount must be zero or greater";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addMutation.mutate({
      name: form.name.trim(),
      targetAmount: form.targetAmount,
      currentAmount: form.currentAmount.trim() || undefined,
      targetDate: form.targetDate.trim() || undefined,
      isShared: form.isShared,
      coupleId: form.isShared && isLinked ? couple!.id : undefined,
    });
    resetForm();
    setOpen(false);
  }

  function addContribution(id: string, currentAmount: string) {
    const raw = contributionInputs[id];
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount <= 0) return;
    addContributionMutation.mutate(
      { id, amount: amount.toFixed(2) },
      { onSuccess: () => setContributionInputs((prev) => ({ ...prev, [id]: "" })) },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ResponsiveFormModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
          title="Create Savings Goal"
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Name *</Label>
              <Input id="goal-name" placeholder="e.g., Emergency Fund" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target Amount *</Label>
              <Input
                id="goal-target"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="5000.00"
                value={form.targetAmount}
                onChange={(e) => setField("targetAmount", e.target.value)}
              />
              {errors.targetAmount && <p className="text-sm text-destructive">{errors.targetAmount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-current">Current Amount (optional, defaults to 0)</Label>
              <Input
                id="goal-current"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={form.currentAmount}
                onChange={(e) => setField("currentAmount", e.target.value)}
              />
              {errors.currentAmount && <p className="text-sm text-destructive">{errors.currentAmount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-date">Target Date (optional)</Label>
              <Input id="goal-date" type="date" value={form.targetDate} onChange={(e) => setField("targetDate", e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="goal-shared">Shared goal</Label>
                <p className="text-xs text-muted-foreground">
                  {isLinked ? "Share this goal with your partner" : "Link with a partner in Couples to share goals"}
                </p>
              </div>
              <Switch
                id="goal-shared"
                checked={form.isShared}
                disabled={!isLinked}
                onCheckedChange={(checked) => setField("isShared", checked)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </form>
        </ResponsiveFormModal>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Couldn't load savings goals right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : goals && goals.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
            const remaining = daysRemaining(goal.targetDate);
            return (
              <Card key={goal.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {goal.name}
                        {goal.isShared && (
                          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Shared</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${Number(goal.currentAmount).toFixed(2)} of ${Number(goal.targetAmount).toFixed(2)}
                      </div>
                      {remaining !== null && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {remaining > 0 ? `${remaining} days remaining` : remaining === 0 ? "Due today" : `${Math.abs(remaining)} days past target date`}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(goal.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{pct}% complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="Contribution amount"
                      className="h-8"
                      value={contributionInputs[goal.id] ?? ""}
                      onChange={(e) => setContributionInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                    />
                    <Button size="sm" variant="outline" onClick={() => addContribution(goal.id, goal.currentAmount)}>
                      Add
                    </Button>
                  </div>
                  {goal.isShared && <ContributorBreakdown goalId={goal.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <PiggyBank className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No savings goals yet. Set one to start tracking progress.</p>
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Create your first goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContributorBreakdown({ goalId }: { goalId: string }) {
  const { data: contributions, isLoading } = useSavingsGoalContributions(goalId);

  if (isLoading) return <Skeleton className="h-4 w-2/3" />;
  if (!contributions || contributions.length === 0) {
    return <p className="text-xs text-muted-foreground">No contributions logged yet.</p>;
  }

  const totalsByUser = contributions.reduce<Record<string, number>>((acc, c) => {
    acc[c.userId] = (acc[c.userId] ?? 0) + Number(c.amount);
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {Object.entries(totalsByUser).map(([userId, total]) => (
        <span key={userId} className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {userId.slice(0, 6)}… contributed ${total.toFixed(2)}
        </span>
      ))}
    </div>
  );
}
