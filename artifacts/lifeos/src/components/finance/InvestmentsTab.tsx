import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, TrendingUp, Pencil } from "lucide-react";
import { useInvestments, useAddInvestment, useUpdateInvestment, useRemoveInvestment } from "@/hooks/useFinance";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";

const ASSET_TYPES = ["stock", "etf", "real_estate", "crypto", "retirement", "other"] as const;
type AssetType = (typeof ASSET_TYPES)[number];

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: "Stock",
  etf: "ETF",
  real_estate: "Real Estate",
  crypto: "Crypto",
  retirement: "Retirement",
  other: "Other",
};

interface FormState {
  assetName: string;
  assetType: AssetType | "";
  amountInvested: string;
  currentValue: string;
  entryDate: string;
  notes: string;
}

const emptyForm: FormState = {
  assetName: "",
  assetType: "",
  amountInvested: "",
  currentValue: "",
  entryDate: "",
  notes: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function InvestmentsTab() {
  const { data: entries, isLoading, isError } = useInvestments();
  const addMutation = useAddInvestment();
  const updateMutation = useUpdateInvestment();
  const removeMutation = useRemoveInvestment();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(entry: NonNullable<typeof entries>[number]) {
    setForm({
      assetName: entry.assetName,
      assetType: entry.assetType as AssetType,
      amountInvested: entry.amountInvested,
      currentValue: entry.currentValue ?? "",
      entryDate: typeof entry.entryDate === "string" ? entry.entryDate.slice(0, 10) : "",
      notes: entry.notes ?? "",
    });
    setEditingId(entry.id);
    setOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next: FormErrors = {};
    if (!form.assetName.trim()) next.assetName = "Asset name is required";
    if (!form.assetType) next.assetType = "Asset type is required";
    const investedNum = Number(form.amountInvested);
    if (!form.amountInvested.trim() || Number.isNaN(investedNum) || investedNum <= 0) {
      next.amountInvested = "Amount invested must be a positive number";
    }
    if (form.currentValue.trim()) {
      const cvNum = Number(form.currentValue);
      if (Number.isNaN(cvNum) || cvNum < 0) {
        next.currentValue = "Current value must be zero or greater";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      assetName: form.assetName.trim(),
      assetType: form.assetType as AssetType,
      amountInvested: form.amountInvested,
      currentValue: form.currentValue.trim() || undefined,
      entryDate: form.entryDate.trim() || todayString(),
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      addMutation.mutate(payload);
    }
    resetForm();
    setOpen(false);
  }

  const grouped = useMemo(() => {
    if (!entries) return [];
    const byType = new Map<string, typeof entries>();
    for (const e of entries) {
      const list = byType.get(e.assetType) ?? [];
      list.push(e);
      byType.set(e.assetType, list);
    }
    return [...byType.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  const totals = useMemo(() => {
    if (!entries) return { invested: 0, current: 0, gainLoss: 0 };
    let invested = 0;
    let current = 0;
    for (const e of entries) {
      const inv = Number(e.amountInvested);
      const cv = e.currentValue != null ? Number(e.currentValue) : inv;
      invested += inv;
      current += cv;
    }
    return { invested, current, gainLoss: current - invested };
  }, [entries]);

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground max-w-lg">
          This is a manual record-keeping tool. No investment advice, performance
          predictions, or buy/sell recommendations are implied by any figures shown.
        </p>
        <ResponsiveFormModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
          title={editingId ? "Edit Investment" : "Add Investment"}
          trigger={
            <Button className="gap-2" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Investment
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-asset-name">Asset Name *</Label>
              <Input
                id="inv-asset-name"
                placeholder="e.g., Apple Inc."
                value={form.assetName}
                onChange={(e) => setField("assetName", e.target.value)}
              />
              {errors.assetName && <p className="text-sm text-destructive">{errors.assetName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-asset-type">Asset Type *</Label>
              <select
                id="inv-asset-type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.assetType}
                onChange={(e) => setField("assetType", e.target.value as AssetType)}
              >
                <option value="">Select type…</option>
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ASSET_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {errors.assetType && <p className="text-sm text-destructive">{errors.assetType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-amount-invested">Amount Invested *</Label>
              <Input
                id="inv-amount-invested"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="1000.00"
                value={form.amountInvested}
                onChange={(e) => setField("amountInvested", e.target.value)}
              />
              {errors.amountInvested && <p className="text-sm text-destructive">{errors.amountInvested}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-current-value">
                Current Value{" "}
                <span className="text-muted-foreground font-normal">(optional — leave blank if unrealized)</span>
              </Label>
              <Input
                id="inv-current-value"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="1250.00"
                value={form.currentValue}
                onChange={(e) => setField("currentValue", e.target.value)}
              />
              {errors.currentValue && <p className="text-sm text-destructive">{errors.currentValue}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-entry-date">Entry Date (optional, defaults to today)</Label>
              <Input
                id="inv-entry-date"
                type="date"
                value={form.entryDate}
                onChange={(e) => setField("entryDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes (optional)</Label>
              <Input
                id="inv-notes"
                placeholder="Any context you want to record"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingId ? "Save Changes" : "Add Investment"}
              </Button>
            </div>
          </form>
        </ResponsiveFormModal>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Couldn't load investments right now. Please try again.</p>
          </CardContent>
        </Card>
      ) : entries && entries.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Total Invested</div>
                  <div className="text-lg font-bold">${totals.invested.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current Value</div>
                  <div className="text-lg font-bold">${totals.current.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Gain/Loss</div>
                  <div
                    className={`text-lg font-bold ${totals.gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {totals.gainLoss >= 0 ? "+" : ""}${totals.gainLoss.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {grouped.map(([type, items]) => {
            const label = ASSET_TYPE_LABELS[type as AssetType] ?? type;
            return (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((entry) => {
                    const invested = Number(entry.amountInvested);
                    const hasCurrentValue = entry.currentValue != null;
                    const cv = hasCurrentValue ? Number(entry.currentValue) : invested;
                    const gainLoss = cv - invested;
                    const gainLossPct = invested > 0 ? (gainLoss / invested) * 100 : 0;

                    return (
                      <Card key={entry.id}>
                        <CardContent className="p-4 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{entry.assetName}</div>
                              <div className="text-sm text-muted-foreground">
                                Invested: ${invested.toFixed(2)}
                              </div>
                              {hasCurrentValue ? (
                                <div
                                  className={`text-sm font-medium ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {gainLoss >= 0 ? "+" : ""}${gainLoss.toFixed(2)} ({gainLossPct >= 0 ? "+" : ""}{gainLossPct.toFixed(1)}%)
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground italic">unrealized</div>
                              )}
                              {entry.notes && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">{entry.notes}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(entry)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMutation.mutate(entry.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No investments recorded yet.</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Record your positions here for your own reference. This is manual tracking only — no investment advice is provided.
            </p>
            <Button className="gap-2" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add your first investment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
