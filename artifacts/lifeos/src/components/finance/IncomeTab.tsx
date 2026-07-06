import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { useIncome, useAddIncome, useRemoveIncome } from "@/hooks/useFinance";
import { format } from "date-fns";

export function IncomeTab() {
  const { data: income, isLoading } = useIncome();
  const addMutation = useAddIncome();
  const removeMutation = useRemoveIncome();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ source, amount, frequency, receivedDate });
    setSource("");
    setAmount("");
    setOpen(false);
  };

  const sorted = income ? [...income].sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()) : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income-source">Source *</Label>
                <Input id="income-source" placeholder="e.g., Paycheck" value={source} onChange={(e) => setSource(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-amount">Amount *</Label>
                <Input id="income-amount" type="number" step="0.01" placeholder="2500.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-frequency">Frequency</Label>
                <Input id="income-frequency" placeholder="monthly" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-date">Received Date *</Label>
                <Input id="income-date" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add Income"}</Button>
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
                  <div className="font-medium">{entry.source}</div>
                  <div className="text-sm text-muted-foreground">{entry.frequency} • {format(new Date(entry.receivedDate), "MMM d, yyyy")}</div>
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
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No income recorded yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
