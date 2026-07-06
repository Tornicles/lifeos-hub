import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { useDebts, useAddDebt, useRemoveDebt } from "@/hooks/useFinance";

export function DebtsTab() {
  const { data: debts, isLoading } = useDebts();
  const addMutation = useAddDebt();
  const removeMutation = useRemoveDebt();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      name,
      balance,
      interestRate: interestRate || undefined,
      minimumPayment: minimumPayment || undefined,
    });
    setName("");
    setBalance("");
    setInterestRate("");
    setMinimumPayment("");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Debt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Debt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="debt-name">Name *</Label>
                <Input id="debt-name" placeholder="e.g., Credit Card" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-balance">Balance *</Label>
                <Input id="debt-balance" type="number" step="0.01" placeholder="1500.00" value={balance} onChange={(e) => setBalance(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-rate">Interest Rate % (optional)</Label>
                <Input id="debt-rate" type="number" step="0.01" placeholder="18.99" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-min">Minimum Payment (optional)</Label>
                <Input id="debt-min" type="number" step="0.01" placeholder="50.00" value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add Debt"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : debts && debts.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {debts.map((debt) => (
            <Card key={debt.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{debt.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {debt.interestRate ? `${debt.interestRate}% APR` : "No rate set"}
                    {debt.minimumPayment ? ` • Min $${Number(debt.minimumPayment).toFixed(2)}/mo` : ""}
                  </div>
                  <div className="text-lg font-bold mt-1 text-red-600">${Number(debt.balance).toFixed(2)}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(debt.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No debts tracked yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
