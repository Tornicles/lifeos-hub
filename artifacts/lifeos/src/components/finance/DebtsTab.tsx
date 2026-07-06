import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, CreditCard, ArrowDownWideNarrow } from "lucide-react";
import { useDebts, useAddDebt, useUpdateDebtBalance, useRemoveDebt } from "@/hooks/useFinance";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";

interface FormState {
  name: string;
  originalAmount: string;
  balance: string;
  interestRate: string;
  minimumPayment: string;
  dueDay: string;
}

const emptyForm: FormState = {
  name: "",
  originalAmount: "",
  balance: "",
  interestRate: "",
  minimumPayment: "",
  dueDay: "",
};

export function DebtsTab() {
  const { data: debts, isLoading, isError } = useDebts();
  const addMutation = useAddDebt();
  const updateMutation = useUpdateDebtBalance();
  const removeMutation = useRemoveDebt();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
  }

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required";
    const originalNum = Number(form.originalAmount);
    if (!form.originalAmount.trim() || Number.isNaN(originalNum) || originalNum <= 0) {
      next.originalAmount = "Original amount must be a positive number";
    }
    const balanceNum = Number(form.balance);
    if (!form.balance.trim() || Number.isNaN(balanceNum) || balanceNum < 0) {
      next.balance = "Current balance must be zero or greater";
    }
    if (form.dueDay.trim()) {
      const dayNum = Number(form.dueDay);
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
        next.dueDay = "Due day must be between 1 and 31";
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
      originalAmount: form.originalAmount,
      balance: form.balance,
      interestRate: form.interestRate.trim() || undefined,
      minimumPayment: form.minimumPayment.trim() || undefined,
      dueDay: form.dueDay.trim() ? Number(form.dueDay) : undefined,
    });
    resetForm();
    setOpen(false);
  }

  function logPayment(debtId: string, currentBalance: string) {
    const raw = paymentInputs[debtId];
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount <= 0) return;
    const newBalance = Math.max(0, Number(currentBalance) - amount).toFixed(2);
    updateMutation.mutate({ id: debtId, balance: newBalance });
    setPaymentInputs((prev) => ({ ...prev, [debtId]: "" }));
  }

  const payoffOrder = useMemo(() => {
    return [...(debts ?? [])]
      .filter((d) => Number(d.balance) > 0)
      .sort((a, b) => Number(b.interestRate ?? 0) - Number(a.interestRate ?? 0));
  }, [debts]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ResponsiveFormModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
          title="Add Debt"
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Debt
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debt-name">Name *</Label>
              <Input id="debt-name" placeholder="e.g., Credit Card" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-original">Original Amount *</Label>
              <Input
                id="debt-original"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="5000.00"
                value={form.originalAmount}
                onChange={(e) => setField("originalAmount", e.target.value)}
              />
              {errors.originalAmount && <p className="text-sm text-destructive">{errors.originalAmount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-balance">Current Balance *</Label>
              <Input
                id="debt-balance"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="1500.00"
                value={form.balance}
                onChange={(e) => setField("balance", e.target.value)}
              />
              {errors.balance && <p className="text-sm text-destructive">{errors.balance}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-rate">Interest Rate % (optional)</Label>
              <Input
                id="debt-rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="18.99"
                value={form.interestRate}
                onChange={(e) => setField("interestRate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-min">Minimum Payment (optional)</Label>
              <Input
                id="debt-min"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="50.00"
                value={form.minimumPayment}
                onChange={(e) => setField("minimumPayment", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-due-day">Due Day of Month (optional)</Label>
              <Input
                id="debt-due-day"
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                placeholder="15"
                value={form.dueDay}
                onChange={(e) => setField("dueDay", e.target.value)}
              />
              {errors.dueDay && <p className="text-sm text-destructive">{errors.dueDay}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding..." : "Add Debt"}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Couldn't load debts right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : debts && debts.length > 0 ? (
        <>
          {payoffOrder.length > 1 && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <ArrowDownWideNarrow className="h-4 w-4" />
                  Suggested payoff order (highest interest first)
                </div>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  {payoffOrder.map((d) => (
                    <li key={d.id}>
                      {d.name} — {d.interestRate ? `${Number(d.interestRate).toFixed(2)}% APR` : "no rate set"}, ${Number(d.balance).toFixed(2)} remaining
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {debts.map((debt) => (
              <Card key={debt.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{debt.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {debt.interestRate ? `${Number(debt.interestRate).toFixed(2)}% APR` : "No rate set"}
                        {debt.minimumPayment ? ` • Min $${Number(debt.minimumPayment).toFixed(2)}/mo` : ""}
                        {debt.dueDay ? ` • Due day ${debt.dueDay}` : ""}
                      </div>
                      <div className="text-lg font-bold mt-1 text-red-600">${Number(debt.balance).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">of ${Number(debt.originalAmount).toFixed(2)} original</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(debt.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="Payment amount"
                      className="h-8"
                      value={paymentInputs[debt.id] ?? ""}
                      onChange={(e) => setPaymentInputs((prev) => ({ ...prev, [debt.id]: e.target.value }))}
                    />
                    <Button size="sm" variant="outline" onClick={() => logPayment(debt.id, debt.balance)}>
                      Log Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No debts tracked yet.</p>
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first debt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
