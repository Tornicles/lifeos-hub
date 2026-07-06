import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useExpenses, useAddExpense, useRemoveExpense, useBudgets } from "@/hooks/useFinance";
import { CategoryAutocomplete } from "@/components/finance/CategoryAutocomplete";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";
import { format } from "date-fns";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ExpensesTab() {
  const { data: expenses, isLoading, isError } = useExpenses();
  const { data: budgets } = useBudgets();
  const addMutation = useAddExpense();
  const removeMutation = useRemoveExpense();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [budgetId, setBudgetId] = useState<string>("none");
  const [errors, setErrors] = useState<{ category?: string; amount?: string }>({});

  const knownCategories = useMemo(() => {
    const set = new Set<string>();
    (budgets ?? []).forEach((b) => set.add(b.category));
    (expenses ?? []).forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [budgets, expenses]);

  const thisMonthBudgets = useMemo(
    () => (budgets ?? []).filter((b) => b.month === currentMonth()),
    [budgets],
  );

  function resetForm() {
    setCategory("");
    setAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setMerchant("");
    setNotes("");
    setBudgetId("none");
    setErrors({});
  }

  function validate() {
    const next: typeof errors = {};
    if (!category.trim()) next.category = "Category is required";
    const amountNum = Number(amount);
    if (!amount.trim() || Number.isNaN(amountNum) || amountNum <= 0) {
      next.amount = "Amount must be a positive number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addMutation.mutate({
      category: category.trim(),
      amount,
      expenseDate,
      merchant: merchant.trim() || undefined,
      notes: notes.trim() || undefined,
      budgetId: budgetId !== "none" ? budgetId : undefined,
    });
    resetForm();
    setOpen(false);
  }

  const sorted = expenses
    ? [...expenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    : [];

  const grouped = useMemo(() => {
    const map = new Map<string, typeof sorted>();
    sorted.forEach((entry) => {
      const list = map.get(entry.category) ?? [];
      list.push(entry);
      map.set(entry.category, list);
    });
    return Array.from(map.entries());
  }, [sorted]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ResponsiveFormModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
          title="Add Expense"
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category *</Label>
              <CategoryAutocomplete
                id="expense-category"
                value={category}
                onChange={(v) => {
                  setCategory(v);
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                categories={knownCategories}
                placeholder="e.g., Food"
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount *</Label>
              <Input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="45.20"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Date *</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-merchant">Merchant</Label>
              <Input
                id="expense-merchant"
                placeholder="e.g., Whole Foods"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notes</Label>
              <Textarea
                id="expense-notes"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-budget">Link to budget</Label>
              <Select value={budgetId} onValueChange={setBudgetId}>
                <SelectTrigger id="expense-budget">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {thisMonthBudgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.category} (${Number(budget.monthlyLimit).toFixed(2)}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </ResponsiveFormModal>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Couldn't load expenses right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(([groupCategory, entries]) => {
            const subtotal = entries.reduce((sum, e) => sum + Number(e.amount), 0);
            return (
              <div key={groupCategory} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-semibold">{groupCategory}</h3>
                  <span className="text-sm text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</span>
                </div>
                {entries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{entry.merchant || entry.description || entry.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.expenseDate), "MMM d, yyyy")}
                          {entry.notes ? ` • ${entry.notes}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-red-600">-${Number(entry.amount).toFixed(2)}</div>
                        <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Receipt className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No expenses recorded yet.</p>
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first expense
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
