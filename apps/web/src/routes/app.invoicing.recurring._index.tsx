/**
 * Recurring Invoices
 *
 * Manage recurring invoice templates with frequency and status controls.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Calendar,
  Plus,
  RefreshCcw,
  Search,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from "lucide-react";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  frequency: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
});

export const Route = createFileRoute("/app/invoicing/recurring/_index")({
  validateSearch: searchSchema,
  component: RecurringPage,
});

const FREQ_BADGE: Record<string, string> = {
  monthly: "bg-primary/10 text-primary",
  quarterly: "bg-violet-500/10 text-violet-400",
  annual: "bg-amber-500/10 text-amber-400",
  weekly: "bg-cyan-500/10 text-cyan-400",
  biweekly: "bg-emerald-500/10 text-emerald-400",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RecurringPage() {
  const qc = useQueryClient();
  const { q: search = "", frequency: frequencyFilter = "", active: activeFilter } = useSearch({ from: "/app/invoicing/recurring/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/recurring/_index" });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/recurring"],
    queryFn: () => invoicingApi.recurring.list(),
    retry: false,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      invoicingApi.recurring.update(id, { isActive: !isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoicing/recurring"] }),
  });

  const items: any[] = (data as any)?.data ?? [];

  const filtered = items
    .filter(
      (r) =>
        !search ||
        r.templateName?.toLowerCase().includes(search.toLowerCase()) ||
        r.clientName?.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((r) => !frequencyFilter || (r.frequency ?? "monthly") === frequencyFilter)
    .filter((r) => {
      if (activeFilter === "true") return r.isActive !== false;
      if (activeFilter === "false") return r.isActive === false;
      return true;
    });

  const activeCount = items.filter((r) => r.isActive !== false).length;

  const mrr = items
    .filter((r) => r.isActive !== false)
    .reduce((s, r) => {
      const amount = Number(r.totalAmount ?? r.amount) || 0;
      const freq = r.frequency ?? "monthly";
      if (freq === "monthly") return s + amount;
      if (freq === "quarterly") return s + amount / 3;
      if (freq === "annual") return s + amount / 12;
      if (freq === "weekly") return s + amount * 4;
      return s + amount;
    }, 0);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load recurring invoices.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Subscriptions</p>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{activeCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <RefreshCcw className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="mt-0.5 text-2xl font-black text-primary">{fmt(mrr)}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recurring..."
              value={search}
              onChange={(e) =>
                navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
              }
              className="pl-9 h-8 w-56 text-sm"
            />
          </div>
          <div className="flex gap-1 rounded-full border border-border/60 bg-muted/30 p-0.5">
            {[
              { value: "", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, active: (t.value as "true" | "false") || undefined }) })
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  (activeFilter ?? "") === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-full border border-border/60 bg-muted/30 p-0.5">
            {["", "weekly", "biweekly", "monthly", "quarterly", "annual"].map((f) => (
              <button
                key={f}
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, frequency: f || undefined }) })
                }
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                  frequencyFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {f || "All"}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Recurring
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading recurring invoices...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <RefreshCcw className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No recurring invoices set up</p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create a recurring invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Template Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Frequency</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Next Date</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any) => {
                    const freq = r.frequency ?? "monthly";
                    const freqClass = FREQ_BADGE[freq] ?? "bg-muted text-muted-foreground";
                    const isActive = r.isActive !== false;
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{r.templateName ?? r.description ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{r.clientName ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-bold">{fmt(Number(r.totalAmount ?? r.amount) || 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${freqClass}`}>
                            {freq}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {fmtDate(r.nextDate ?? r.nextInvoiceDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isActive ? "success" : "outline"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggleMutation.mutate({ id: r.id, isActive })}
                            disabled={toggleMutation.isPending}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isActive ? (
                              <ToggleRight className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
