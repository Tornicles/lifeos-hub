import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Plus, Trophy, Sparkles } from "lucide-react";
import { useSavingsChallenges, useAddSavingsChallenge, useCheckInChallenge } from "@/hooks/useFinance";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";

interface FormState {
  name: string;
  targetAmount: string;
  durationDays: string;
  startDate: string;
}

const emptyForm: FormState = {
  name: "",
  targetAmount: "",
  durationDays: "30",
  startDate: new Date().toISOString().slice(0, 10),
};

export function SavingsChallengesTab() {
  const { data: challenges, isLoading, isError } = useSavingsChallenges();
  const addMutation = useAddSavingsChallenge();
  const checkInMutation = useCheckInChallenge();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [checkInInputs, setCheckInInputs] = useState<Record<string, string>>({});

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
    const durationNum = Number(form.durationDays);
    if (!form.durationDays.trim() || !Number.isInteger(durationNum) || durationNum <= 0) {
      next.durationDays = "Duration must be a whole number of days";
    }
    if (!form.startDate.trim()) next.startDate = "Start date is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addMutation.mutate({
      name: form.name.trim(),
      targetAmount: form.targetAmount,
      durationDays: Number(form.durationDays),
      startDate: form.startDate,
    });
    resetForm();
    setOpen(false);
  }

  function checkIn(id: string) {
    const raw = checkInInputs[id];
    const amount = raw?.trim() ? raw : undefined;
    if (amount !== undefined) {
      const num = Number(amount);
      if (Number.isNaN(num) || num <= 0) return;
    }
    checkInMutation.mutate(
      { id, amount },
      { onSuccess: () => setCheckInInputs((prev) => ({ ...prev, [id]: "" })) },
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
          title="Start a Savings Challenge"
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Challenge
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="challenge-name">Name *</Label>
              <Input id="challenge-name" placeholder="e.g., No-Spend November" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenge-target">Target Amount *</Label>
              <Input
                id="challenge-target"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="500.00"
                value={form.targetAmount}
                onChange={(e) => setField("targetAmount", e.target.value)}
              />
              {errors.targetAmount && <p className="text-sm text-destructive">{errors.targetAmount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenge-duration">Duration (days) *</Label>
              <Input
                id="challenge-duration"
                type="number"
                inputMode="numeric"
                step="1"
                value={form.durationDays}
                onChange={(e) => setField("durationDays", e.target.value)}
              />
              {errors.durationDays && <p className="text-sm text-destructive">{errors.durationDays}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenge-start">Start Date *</Label>
              <Input id="challenge-start" type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Starting..." : "Start Challenge"}
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
            <p className="text-muted-foreground">Couldn't load savings challenges right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : challenges && challenges.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {challenges.map((c) => {
            const pct = Math.min(100, Math.round((Number(c.savedAmount) / Number(c.targetAmount)) * 100));
            const isComplete = c.status === "completed";
            return (
              <Card key={c.id} className={isComplete ? "border-amber-300 bg-amber-50/40 dark:bg-amber-950/10" : undefined}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {c.name}
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5">
                            <Trophy className="h-3 w-3" /> Complete
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${Number(c.savedAmount).toFixed(2)} of ${Number(c.targetAmount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.durationDays} day challenge</div>
                    </div>
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{pct}% complete</span>
                  </div>
                  {!isComplete && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="Amount saved (optional)"
                        className="h-8"
                        value={checkInInputs[c.id] ?? ""}
                        onChange={(e) => setCheckInInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="outline" onClick={() => checkIn(c.id)}>
                        Check In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No savings challenges yet. Start one to build a streak.</p>
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Start your first challenge
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
