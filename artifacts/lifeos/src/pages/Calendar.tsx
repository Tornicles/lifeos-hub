import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Receipt,
} from "lucide-react";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";
import {
  useCalendarEntries,
  useCreateCalendarEntry,
  useUpdateCalendarEntry,
  useDeleteCalendarEntry,
} from "@/hooks/useCalendar";

interface FormState {
  id: number | null;
  title: string;
  amount: string;
  dueDay: string;
  category: string;
  isAutopay: boolean;
}

const emptyForm: FormState = {
  id: null,
  title: "",
  amount: "",
  dueDay: "",
  category: "",
  isAutopay: false,
};

function toDateKey(value: unknown): string {
  return new Date(value as string).toISOString().slice(0, 10);
}

function isBill(entry: { dueDay?: number | null }) {
  return entry.dueDay !== null && entry.dueDay !== undefined;
}

export default function CalendarPage() {
  const { data: entries, isLoading } = useCalendarEntries();
  const createMutation = useCreateCalendarEntry();
  const updateMutation = useUpdateCalendarEntry();
  const deleteMutation = useDeleteCalendarEntry();

  const [monthCursor, setMonthCursor] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const bills = useMemo(() => (entries ?? []).filter(isBill), [entries]);

  const sortedBills = useMemo(
    () => [...bills].sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0)),
    [bills]
  );

  const totalMonthly = useMemo(
    () => bills.reduce((sum, b) => sum + Number(b.amount ?? 0), 0),
    [bills]
  );

  const today = new Date();

  function daysUntilDue(dueDay: number) {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (dueDay >= currentDay) return dueDay - currentDay;
    const daysLeftThisMonth = daysInMonth - currentDay;
    return daysLeftThisMonth + dueDay;
  }

  const thisWeekBills = useMemo(
    () => sortedBills.filter((b) => b.dueDay !== null && b.dueDay !== undefined && daysUntilDue(b.dueDay) <= 7),
    [sortedBills]
  );

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const monthGrid = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();

    const cells: Array<{ day: number | null }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
    return cells;
  }, [monthCursor]);

  const billsByDueDay = useMemo(() => {
    const map = new Map<number, typeof sortedBills>();
    for (const bill of sortedBills) {
      if (bill.dueDay === null || bill.dueDay === undefined) continue;
      const list = map.get(bill.dueDay) ?? [];
      list.push(bill);
      map.set(bill.dueDay, list);
    }
    return map;
  }, [sortedBills]);

  function navigateMonth(direction: "prev" | "next") {
    setMonthCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function openAddForm() {
    resetForm();
    setOpen(true);
  }

  function openEditForm(bill: (typeof sortedBills)[number]) {
    setForm({
      id: bill.id,
      title: bill.title,
      amount: bill.amount ?? "",
      dueDay: bill.dueDay != null ? String(bill.dueDay) : "",
      category: bill.category ?? "",
      isAutopay: !!bill.isAutopay,
    });
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Bill name is required";
    const amountNum = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amountNum) || amountNum <= 0) {
      next.amount = "Amount must be a positive number";
    }
    const dayNum = Number(form.dueDay);
    if (!form.dueDay.trim() || !Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
      next.dueDay = "Due day must be between 1 and 31";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextOccurrenceDateForDay(dueDay: number) {
    const now = new Date();
    const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const clampedDay = Math.min(dueDay, daysInThisMonth);
    let candidate = new Date(now.getFullYear(), now.getMonth(), clampedDay);
    if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      const nextMonth = now.getMonth() + 1;
      const daysInNextMonth = new Date(now.getFullYear(), nextMonth + 1, 0).getDate();
      candidate = new Date(now.getFullYear(), nextMonth, Math.min(dueDay, daysInNextMonth));
    }
    return candidate.toISOString().slice(0, 10);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const dueDay = Number(form.dueDay);
    const payload = {
      title: form.title.trim(),
      date: nextOccurrenceDateForDay(dueDay),
      amount: form.amount.trim(),
      dueDay,
      isAutopay: form.isAutopay,
      category: form.category.trim() || undefined,
    };

    if (form.id !== null) {
      updateMutation.mutate({ id: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
    resetForm();
    setOpen(false);
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Receipt className="h-9 w-9 text-emerald-600" />
            Bills & Calendar
          </h1>
          <p className="text-muted-foreground text-lg">Track recurring bills and due dates</p>
        </div>
        <ResponsiveFormModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
          title={form.id !== null ? "Edit Bill" : "Add Bill"}
          trigger={
            <Button className="gap-2" onClick={openAddForm}>
              <Plus className="h-4 w-4" />
              Add Bill
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bill-title">Bill Name</Label>
              <Input
                id="bill-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Rent, Electric, Netflix"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bill-amount">Amount</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setField("amount", e.target.value)}
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bill-due-day">Due Day (1-31)</Label>
                <Input
                  id="bill-due-day"
                  type="number"
                  min="1"
                  max="31"
                  value={form.dueDay}
                  onChange={(e) => setField("dueDay", e.target.value)}
                  placeholder="15"
                />
                {errors.dueDay && <p className="text-sm text-destructive">{errors.dueDay}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-category">Category</Label>
              <Input
                id="bill-category"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="e.g. Housing, Utilities, Subscriptions"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="bill-autopay"
                checked={form.isAutopay}
                onCheckedChange={(checked) => setField("isAutopay", checked === true)}
              />
              <Label htmlFor="bill-autopay" className="font-normal">Autopay enabled</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {form.id !== null ? "Save Changes" : "Add Bill"}
            </Button>
          </form>
        </ResponsiveFormModal>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Monthly Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">${totalMonthly.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bills Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{bills.length}</div>}
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : thisWeekBills.length === 0 ? (
              <div className="text-sm text-muted-foreground">No bills due this week</div>
            ) : (
              <div className="space-y-1.5">
                {thisWeekBills.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{b.title}</span>
                    <span className="font-medium">${Number(b.amount ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {monthLabel}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMonthCursor(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((cell, idx) => {
              const isToday =
                cell.day !== null &&
                cell.day === today.getDate() &&
                monthCursor.getMonth() === today.getMonth() &&
                monthCursor.getFullYear() === today.getFullYear();
              const dayBills = cell.day !== null ? billsByDueDay.get(cell.day) ?? [] : [];

              return (
                <div
                  key={idx}
                  className={`min-h-[72px] rounded-md border p-1 ${
                    cell.day === null ? "border-transparent" : isToday ? "border-primary border-2" : "border-border"
                  }`}
                >
                  {cell.day !== null && (
                    <>
                      <div className={`text-xs text-right mb-1 ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                        {cell.day}
                      </div>
                      <div className="space-y-0.5">
                        {dayBills.slice(0, 2).map((b) => (
                          <div
                            key={b.id}
                            className="text-[10px] leading-tight truncate rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-1 py-0.5"
                            title={`${b.title} - $${Number(b.amount ?? 0).toFixed(2)}`}
                          >
                            {b.title}
                          </div>
                        ))}
                        {dayBills.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">+{dayBills.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sortedBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bills yet. Add one to start tracking due dates.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-md bg-muted shrink-0">
                      <span className="text-xs font-bold leading-none">{bill.dueDay}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{bill.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {bill.category && <span>{bill.category}</span>}
                        {bill.isAutopay && (
                          <Badge variant="secondary" className="text-[10px]">Autopay</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-semibold">${Number(bill.amount ?? 0).toFixed(2)}</div>
                    <Button variant="ghost" size="icon" onClick={() => openEditForm(bill)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(bill.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
