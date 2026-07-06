import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useExpenses, useAddExpense, useRemoveExpense } from "@/hooks/useFinance";
import { format } from "date-fns";

export function ExpensesTab() {
  const { data: expenses, isLoading } = useExpenses();
  const addMutation = useAddExpense();
  const removeMutation = useRemoveExpense();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ description, amount, category, expenseDate });
    setDescription("");
    setAmount("");
    setCategory("");
    setOpen(false);
  };

  const sorted = expenses ? [...expenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()) : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-desc">Description *</Label>
                <Input id="expense-desc" placeholder="e.g., Grocery run" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount *</Label>
                <Input id="expense-amount" type="number" step="0.01" placeholder="45.20" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category *</Label>
                <Input id="expense-category" placeholder="e.g., Food" value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date *</Label>
                <Input id="expense-date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add Expense"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{entry.description}</div>
                  <div className="text-sm text-muted-foreground">{entry.category} • {format(new Date(entry.expenseDate), "MMM d, yyyy")}</div>
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No expenses recorded yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
