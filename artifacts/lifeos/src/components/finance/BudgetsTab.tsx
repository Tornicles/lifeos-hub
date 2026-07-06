import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useBudgets, useAddBudget, useRemoveBudget } from "@/hooks/useFinance";

export function BudgetsTab() {
  const { data: budgets, isLoading } = useBudgets();
  const addMutation = useAddBudget();
  const removeMutation = useRemoveBudget();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ name, category, monthlyLimit });
    setName("");
    setCategory("");
    setMonthlyLimit("");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget-name">Name *</Label>
                <Input id="budget-name" placeholder="e.g., Groceries" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-category">Category *</Label>
                <Input id="budget-category" placeholder="e.g., Food" value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-limit">Monthly Limit *</Label>
                <Input id="budget-limit" type="number" step="0.01" placeholder="500.00" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Creating..." : "Create Budget"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{budget.name}</div>
                  <div className="text-sm text-muted-foreground">{budget.category} • {budget.period}</div>
                  <div className="text-lg font-bold mt-1">${Number(budget.monthlyLimit).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(budget.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No budgets yet. Create one to start tracking spending limits.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
