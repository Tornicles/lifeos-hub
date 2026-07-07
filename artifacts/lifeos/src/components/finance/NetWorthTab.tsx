import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, BarChart2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNetWorthSnapshots, useAddNetWorthSnapshot, useUpdateNetWorthSnapshot } from "@/hooks/useFinance";
import { ResponsiveFormModal } from "@/components/finance/ResponsiveFormModal";
import type { NetWorthSnapshot } from "@workspace/api-client-react";

interface FormState {
  totalAssets: string;
  totalLiabilities: string;
  snapshotDate: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  totalAssets: "",
  totalLiabilities: "",
  snapshotDate: new Date().toISOString().slice(0, 10),
};

function computedNetWorth(assets: string, liabilities: string): number | null {
  const a = Number(assets);
  const l = Number(liabilities);
  if (!assets.trim() || !liabilities.trim() || Number.isNaN(a) || Number.isNaN(l)) return null;
  return a - l;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function shortDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NetWorthTab() {
  const { data: snapshots, isLoading, isError } = useNetWorthSnapshots();
  const addMutation = useAddNetWorthSnapshot();
  const updateMutation = useUpdateNetWorthSnapshot();

  const [open, setOpen] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<NetWorthSnapshot | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setDuplicateMsg(null);
    setEditingSnapshot(null);
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(snap: NetWorthSnapshot) {
    setEditingSnapshot(snap);
    setForm({
      totalAssets: snap.totalAssets,
      totalLiabilities: snap.totalLiabilities,
      snapshotDate: typeof snap.snapshotDate === "string" ? snap.snapshotDate.slice(0, 10) : "",
    });
    setErrors({});
    setDuplicateMsg(null);
    setOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDuplicateMsg(null);
  }

  function validate() {
    const next: FormErrors = {};
    const a = Number(form.totalAssets);
    if (!form.totalAssets.trim() || Number.isNaN(a) || a < 0) {
      next.totalAssets = "Total assets must be zero or greater";
    }
    const l = Number(form.totalLiabilities);
    if (!form.totalLiabilities.trim() || Number.isNaN(l) || l < 0) {
      next.totalLiabilities = "Total liabilities must be zero or greater";
    }
    if (!form.snapshotDate) next.snapshotDate = "Date is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (editingSnapshot) {
      updateMutation.mutate({
        id: editingSnapshot.id,
        totalAssets: form.totalAssets,
        totalLiabilities: form.totalLiabilities,
      });
      resetForm();
      setOpen(false);
      return;
    }

    addMutation.mutate(
      {
        totalAssets: form.totalAssets,
        totalLiabilities: form.totalLiabilities,
        snapshotDate: form.snapshotDate,
      },
      {
        onDuplicate: (msg, existingId) => {
          setDuplicateMsg(msg);
          if (existingId) {
            const existing = snapshots?.find((s) => s.id === existingId) ?? null;
            if (existing) {
              setOpen(false);
              setTimeout(() => openEdit(existing), 0);
            }
          }
        },
      },
    );
    resetForm();
    setOpen(false);
  }

  const sorted = useMemo(() => {
    if (!snapshots) return [];
    return [...snapshots].sort((a, b) => String(a.snapshotDate).localeCompare(String(b.snapshotDate)));
  }, [snapshots]);

  const latest = sorted[sorted.length - 1];

  const chartData = sorted.map((s) => ({
    date: shortDate(String(s.snapshotDate)),
    netWorth: Number(s.netWorth),
  }));

  const nw = computedNetWorth(form.totalAssets, form.totalLiabilities);
  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ResponsiveFormModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
          title={editingSnapshot ? `Edit Snapshot — ${formatDate(String(editingSnapshot.snapshotDate))}` : "Log Net Worth Snapshot"}
          trigger={
            <Button className="gap-2" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Log Snapshot
            </Button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {duplicateMsg && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 text-sm">
                {duplicateMsg}
              </div>
            )}
            {!editingSnapshot && (
              <div className="space-y-2">
                <Label htmlFor="nw-date">Date *</Label>
                <Input
                  id="nw-date"
                  type="date"
                  value={form.snapshotDate}
                  onChange={(e) => setField("snapshotDate", e.target.value)}
                />
                {errors.snapshotDate && <p className="text-sm text-destructive">{errors.snapshotDate}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nw-assets">Total Assets *</Label>
              <Input
                id="nw-assets"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="250000.00"
                value={form.totalAssets}
                onChange={(e) => setField("totalAssets", e.target.value)}
              />
              {errors.totalAssets && <p className="text-sm text-destructive">{errors.totalAssets}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nw-liabilities">Total Liabilities *</Label>
              <Input
                id="nw-liabilities"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="120000.00"
                value={form.totalLiabilities}
                onChange={(e) => setField("totalLiabilities", e.target.value)}
              />
              {errors.totalLiabilities && <p className="text-sm text-destructive">{errors.totalLiabilities}</p>}
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Net Worth (computed)</span>
              <span
                className={`font-semibold ${nw === null ? "text-muted-foreground" : nw >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {nw === null ? "—" : `$${nw.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingSnapshot ? "Save Changes" : "Log Snapshot"}
              </Button>
            </div>
          </form>
        </ResponsiveFormModal>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Couldn't load net worth snapshots. Please try again.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {latest && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Assets</div>
                    <div className="text-lg font-bold text-green-600">${Number(latest.totalAssets).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Liabilities</div>
                    <div className="text-lg font-bold text-red-600">${Number(latest.totalLiabilities).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Net Worth</div>
                    <div
                      className={`text-lg font-bold ${Number(latest.netWorth) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      ${Number(latest.netWorth).toLocaleString()}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  As of {formatDate(String(latest.snapshotDate))}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Net Worth Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sorted.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <p className="text-muted-foreground text-sm">Log a few snapshots to see your trend over time.</p>
                  <p className="text-xs text-muted-foreground">You need at least 2 snapshots to display a chart.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      angle={-40}
                      textAnchor="end"
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        v >= 1000 || v <= -1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                      width={56}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Worth"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {sorted.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Snapshot History</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {[...sorted].reverse().map((snap) => (
                  <Card key={snap.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{formatDate(String(snap.snapshotDate))}</div>
                        <div className={`text-base font-bold ${Number(snap.netWorth) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${Number(snap.netWorth).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assets ${Number(snap.totalAssets).toLocaleString()} · Liabilities ${Number(snap.totalLiabilities).toLocaleString()}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(snap)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!snapshots?.length && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <BarChart2 className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No snapshots yet. Log your first to start tracking net worth over time.</p>
                <Button className="gap-2" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Log your first snapshot
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
