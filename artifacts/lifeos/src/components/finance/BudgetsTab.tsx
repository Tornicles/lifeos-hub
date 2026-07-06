import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useBudgets, useAddBudget, useRemoveBudget, useExpenses } from "@/hooks/useFinance";
import { CategoryAutocomplete } from "@/components/finance/CategoryAutocomplete";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function progressColorClass(percent: number) {
  if (percent > 100) return "bg-red-600";
  if (percent >= 80) return "bg-yellow-500";
  return "bg-green-600";
}

export function BudgetsTab() {
  const { data: budgets, isLoading, isError } = useBudgets();
  const { data: expenses } = useExpenses();
  const addMutation = useAddBudget();
  const removeMutation = useRemoveBudget();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [errors, setErrors] = useState<{ category?: string; monthlyLimit?: string; duplicate?: string }>({});

  const knownCategories = useMemo(() => {
    const set = new Set<string>();
    (budgets ?? []).forEach((b) => set.add(b.category));
    (expenses ?? []).forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [budgets, expenses]);

  const spentByBudget = useMemo(() => {
    const map = new Map<string, number>();
    (expenses ?? []).forEach((e) => {
      if (!e.budgetId) return;
      map.set(e.budgetId, (map.get(e.budgetId) ?? 0) + Number(e.amount));
    });
    return map;
  }, [expenses]);

  function resetForm() {
    setCategory("");
    setMonthlyLimit("");
    setMonth(currentMonth());
    setErrors({});
  }

  function validate() {
    const next: typeof errors = {};
    if (!category.trim()) next.category = "Category is required";
    const limitNum = Number(monthlyLimit);
    if (!monthlyLimit.trim() || Number.isNaN(limitNum) || limitNum <= 0) {
      next.monthlyLimit = "Monthly limit must be a positive number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addMutation.mutate(
      { category: category.trim(), monthlyLimit, month },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
        onDuplicate: (message) => setErrors((prev) => ({ ...prev, duplicate: message })),
      },
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
          title="Create Budget"
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Budget
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget-category">Category *</Label>
              <CategoryAutocomplete
                id="budget-category"
                value={category}
                onChange={(v) => {
                  setCategory(v);
                  setErrors((prev) => ({ ...prev, category: undefined, duplicate: undefined }));
                }}
                categories={knownCategories}
                placeholder="e.g., Food"
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-limit">Monthly Limit *</Label>
              <Input
                id="budget-limit"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="500.00"
                value={monthlyLimit}
                onChange={(e) => {
                  setMonthlyLimit(e.target.value);
                  setErrors((prev) => ({ ...prev, monthlyLimit: undefined }));
                }}
              />
              {errors.monthlyLimit && <p className="text-sm text-destructive">{errors.monthlyLimit}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-month">Month</Label>
              <Input
                id="budget-month"
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setErrors((prev) => ({ ...prev, duplicate: undefined }));
                }}
              />
            </div>
            {errors.duplicate && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 p-2">{errors.duplicate}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Creating..." : "Create Budget"}
              </Button>
            </div>
          </form>
        </ResponsiveFormModal>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
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
            <p className="text-muted-foreground">Couldn't load budgets right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {budgets.map((budget) => {
            const spent = spentByBudget.get(budget.id) ?? 0;
            const limit = Number(budget.monthlyLimit);
            const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            return (
              <Card key={budget.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{budget.category}</div>
                      <div className="text-sm text-muted-foreground">{budget.month}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(budget.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">
                      ${spent.toFixed(2)} <span className="text-muted-foreground">of ${limit.toFixed(2)}</span>
                    </span>
                    <span className="text-muted-foreground">{percent}%</span>
                  </div>
                  <Progress value={Math.min(percent, 100)} indicatorClassName={progressColorClass(percent)} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No budgets yet. Create one to start tracking spending limits.</p>
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Create your first budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
