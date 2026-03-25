/**
 * A/B Testing
 *
 * Test list with variant performance progress bars, winner highlight,
 * confidence percentage, and status.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  Award,
  BarChart2,
  CheckCircle2,
  FlaskConical,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { marketingApi } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/marketing/ab-testing/_index")({
  validateSearch: searchSchema,
  component: AbTestingPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface AbTest {
  id: string;
  name: string;
  metric: string;
  variantA: { name: string; value: number };
  variantB: { name: string; value: number };
  winner?: "A" | "B" | null;
  confidence: number;
  status: "running" | "completed" | "draft";
  startDate?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_TESTS: AbTest[] = [
  {
    id: "1", name: "Subject Line — Spring Sale", metric: "Open Rate",
    variantA: { name: "🌸 Spring Sale — 30% off", value: 28.4 },
    variantB: { name: "Final hours: Spring deals inside", value: 34.1 },
    winner: "B", confidence: 97.2, status: "completed", startDate: "2026-03-01",
  },
  {
    id: "2", name: "CTA Button Color", metric: "Click Rate",
    variantA: { name: "Blue CTA", value: 5.8 },
    variantB: { name: "Green CTA", value: 6.9 },
    winner: "B", confidence: 91.5, status: "completed", startDate: "2026-02-15",
  },
  {
    id: "3", name: "Landing Page Headline", metric: "Conversion Rate",
    variantA: { name: "Start your free trial", value: 12.3 },
    variantB: { name: "Try it free for 14 days", value: 13.8 },
    winner: null, confidence: 78.4, status: "running", startDate: "2026-03-18",
  },
  {
    id: "4", name: "Email Send Time", metric: "Open Rate",
    variantA: { name: "9:00 AM", value: 31.2 },
    variantB: { name: "2:00 PM", value: 29.8 },
    winner: null, confidence: 60.1, status: "running", startDate: "2026-03-20",
  },
  {
    id: "5", name: "Pricing Page Layout", metric: "Conversion Rate",
    variantA: { name: "3-column pricing", value: 0 },
    variantB: { name: "Feature-focused pricing", value: 0 },
    winner: null, confidence: 0, status: "draft", startDate: undefined,
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusVariant(s: string) {
  switch (s) {
    case "running": return "success";
    case "completed": return "default";
    case "draft": return "outline";
    default: return "outline";
  }
}

function statusColor(s: string) {
  switch (s) {
    case "running": return "text-emerald-400";
    case "completed": return "text-sky-400";
    default: return "text-muted-foreground";
  }
}

// ─── Variant Progress Bar ─────────────────────────────────────────────────────

function VariantBar({ label, value, maxValue, isWinner, color }: {
  label: string; value: number; maxValue: number; isWinner: boolean; color: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{label}</span>
          {isWinner && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
        </div>
        <span className={`font-bold tabular-nums ${isWinner ? "text-emerald-400" : ""}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── New Test Modal ───────────────────────────────────────────────────────────

function NewTestModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", metric: "Open Rate", variantA: "", variantB: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return { id: String(Date.now()), ...form, status: "draft" };
    },
    onSuccess: () => {
      toast.success("A/B test created");
      onCreated();
      onClose();
      setForm({ name: "", metric: "Open Rate", variantA: "", variantB: "" });
    },
    onError: () => toast.error("Failed to create test"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New A/B Test</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name) { toast.error("Name is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Test Name <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Subject Line Test — Q2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Primary Metric</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.metric}
              onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))}
            >
              {["Open Rate", "Click Rate", "Conversion Rate", "Revenue"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Variant A</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Control version"
              value={form.variantA}
              onChange={(e) => setForm((f) => ({ ...f, variantA: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Variant B</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Challenger version"
              value={form.variantB}
              onChange={(e) => setForm((f) => ({ ...f, variantB: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Test"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AbTestingPage() {
  const qc = useQueryClient();
  const { q = "", status = "all" } = useSearch({ from: "/app/marketing/ab-testing/_index" });
  const navigate = useNavigate({ from: "/app/marketing/ab-testing/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v }) });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "ab-tests"],
    queryFn: async () => ({ data: [] }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const tests: AbTest[] = (data as any)?.data ?? [];

  const filtered = tests.filter((t) => {
    const matchSearch = !q || t.name.toLowerCase().includes(q.toLowerCase());
    const matchStatus = (status || "all") === "all" || t.status === status;
    return matchSearch && matchStatus;
  });

  const activeTests = tests.filter((t) => t.status === "running").length;
  const wonThisMonth = tests.filter((t) => t.status === "completed" && t.winner).length;

  return (
    <div className="space-y-6">
      <NewTestModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["marketing", "ab-tests"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <FlaskConical className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Tests</p>
              <p className="text-2xl font-black">{activeTests}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Award className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tests Won This Month</p>
              <p className="text-2xl font-black">{wonThisMonth}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { variant: "Control A", conversionRate: 3.2, clickRate: 8.1, bounceRate: 42 },
              { variant: "Variant B", conversionRate: 4.1, clickRate: 9.7, bounceRate: 38 },
              { variant: "Variant C", conversionRate: 3.8, clickRate: 8.9, bounceRate: 40 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="variant" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
              <Legend />
              <Bar dataKey="conversionRate" fill="#6366f1" name="Conv. Rate" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clickRate" fill="#10b981" name="Click Rate" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tests */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              A/B Tests
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
                {["all", "running", "completed", "draft"].map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 capitalize transition-colors ${(status || "all") === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="h-8 w-44 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search tests…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Test
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading tests…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <FlaskConical className="h-8 w-8 opacity-40" />
              <p className="text-sm">No tests found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((t) => {
                const maxVal = Math.max(t.variantA.value, t.variantB.value);
                return (
                  <div key={t.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{t.name}</p>
                          <Badge variant={statusVariant(t.status) as any} className={`capitalize ${statusColor(t.status)}`}>
                            {t.status}
                          </Badge>
                          {t.winner && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                              <Award className="h-3 w-3" />
                              Winner: Variant {t.winner}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Metric: <span className="font-medium text-foreground">{t.metric}</span>
                          {t.startDate && <span className="ml-3">Started: {new Date(t.startDate).toLocaleDateString()}</span>}
                        </p>
                        <div className="space-y-2.5 max-w-lg">
                          <VariantBar
                            label={`A: ${t.variantA.name}`}
                            value={t.variantA.value}
                            maxValue={maxVal}
                            isWinner={t.winner === "A"}
                            color="#22d3ee"
                          />
                          <VariantBar
                            label={`B: ${t.variantB.name}`}
                            value={t.variantB.value}
                            maxValue={maxVal}
                            isWinner={t.winner === "B"}
                            color="#a78bfa"
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-black">{t.confidence.toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Confidence</div>
                        {t.confidence >= 95 && (
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Significant
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
