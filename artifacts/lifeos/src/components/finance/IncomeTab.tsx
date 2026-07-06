import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { useIncome, useAddIncome, useRemoveIncome } from "@/hooks/useFinance";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";
import { format } from "date-fns";

const RECURRENCE_OPTIONS = ["weekly", "biweekly", "monthly"] as const;

export function IncomeTab() {
  const { data: income, isLoading, isError } = useIncome();
  const addMutation = useAddIncome();
  const removeMutation = useRemoveIncome();

  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>("monthly");
  const [errors, setErrors] = useState<{ source?: string; amount?: string }>({});

  function resetForm() {
    setSource("");
    setAmount("");
    setReceivedDate(new Date().toISOString().split("T")[0]);
    setIsRecurring(false);
    setRecurrenceInterval("monthly");
    setErrors({});
  }

  function validate() {
    const next: typeof errors = {};
    if (!source.trim()) next.source = "Source is required";
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
      source: source.trim(),
      amount,
      receivedDate,
      isRecurring,
      recurrenceInterval: isRecurring ? (recurrenceInterval as any) : null,
    });
    resetForm();
    setOpen(false);
  }

  const sorted = income
    ? [...income].sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ResponsiveFormModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
          title="Add Income"
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Income
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income-source">Source *</Label>
              <Input
                id="income-source"
                placeholder="e.g., Paycheck"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setErrors((prev) => ({ ...prev, source: undefined }));
                }}
              />
              {errors.source && <p className="text-sm text-destructive">{errors.source}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount *</Label>
              <Input
                id="income-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="2500.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-date">Received Date *</Label>
              <Input
                id="income-date"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="income-recurring" className="cursor-pointer">
                Recurring income
              </Label>
              <Switch id="income-recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="income-interval">Recurs every</Label>
                <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                  <SelectTrigger id="income-interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding..." : "Add Income"}
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
            <p className="text-muted-foreground">Couldn't load income right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{entry.source}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.isRecurring ? `Recurring • ${entry.recurrenceInterval}` : "One-time"} •{" "}
                    {format(new Date(entry.receivedDate), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-green-600">+${Number(entry.amount).toFixed(2)}</div>
                  <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(entry.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No income recorded yet.</p>
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first income
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
