/**
 * Lead Scoring
 *
 * Scoring rules with conditions, points, categories, and a score
 * distribution chart. Stats for hot/warm/cold leads.
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
  Flame,
  Plus,
  Search,
  Target,
  Thermometer,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { marketingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/app/marketing/lead-scoring/_index")({
  validateSearch: searchSchema,
  component: LeadScoringPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoringRule {
  id: string;
  name: string;
  condition: string;
  points: number;
  category: "behavior" | "demographic" | "firmographic";
  active: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────


const SCORE_DISTRIBUTION = [
  { range: "0–19", count: 2103, color: "#22d3ee" },
  { range: "20–49", count: 1456, color: "#eab308" },
  { range: "50–79", count: 892, color: "#f97316" },
  { range: "80–100", count: 234, color: "#ef4444" },
];

// ─── Category Badge ───────────────────────────────────────────────────────────

function categoryBadge(cat: string) {
  switch (cat) {
    case "behavior": return "bg-primary/10 text-primary";
    case "demographic": return "bg-violet-500/10 text-violet-400";
    case "firmographic": return "bg-amber-500/10 text-amber-400";
    default: return "bg-muted/50 text-muted-foreground";
  }
}

// ─── New Rule Modal ───────────────────────────────────────────────────────────

function NewRuleModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", condition: "", points: "10", category: "behavior" });

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await marketingApi.leadScoring.create({ name: form.name, condition: form.condition, points: Number(form.points), category: form.category });
      return result;
    },
    onSuccess: () => {
      toast.success("Scoring rule created");
      onCreated();
      onClose();
      setForm({ name: "", condition: "", points: "10", category: "behavior" });
    },
    onError: () => toast.error("Failed to create rule"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New Scoring Rule</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name) { toast.error("Name is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Rule Name <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Visited Pricing Page"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Condition</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Page = /pricing"
              value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Points</label>
              <input
                type="number" min="1" max="100"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {["behavior", "demographic", "firmographic"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save Rule"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function LeadScoringPage() {
  const qc = useQueryClient();
  const { q = "", category = "all" } = useSearch({ from: "/app/marketing/lead-scoring/_index" });
  const navigate = useNavigate({ from: "/app/marketing/lead-scoring/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setCategory = (v: string) => navigate({ search: (p) => ({ ...p, category: v === "all" ? undefined : v }) });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "lead-scoring"],
    queryFn: () => marketingApi.leadScoring.list(),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const rules: ScoringRule[] = (data as any)?.data ?? [];

  const filtered = rules.filter((r) => {
    const matchSearch = !q || r.name.toLowerCase().includes(q.toLowerCase());
    const matchCat = (category || "all") === "all" || r.category === category;
    return matchSearch && matchCat;
  });

  const hotLeads = SCORE_DISTRIBUTION.find((d) => d.range === "80–100")?.count ?? 0;
  const warmLeads = SCORE_DISTRIBUTION.find((d) => d.range === "50–79")?.count ?? 0;
  const coldLeads = (SCORE_DISTRIBUTION.find((d) => d.range === "0–19")?.count ?? 0) + (SCORE_DISTRIBUTION.find((d) => d.range === "20–49")?.count ?? 0);

  return (
    <div className="space-y-6">
      <NewRuleModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["marketing", "lead-scoring"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <Flame className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hot Leads (&gt;80 pts)</p>
              <p className="text-2xl font-black">{hotLeads.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Thermometer className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Warm Leads (50–80)</p>
              <p className="text-2xl font-black">{warmLeads.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cold Leads (&lt;50)</p>
              <p className="text-2xl font-black">{coldLeads.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Rules */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Distribution Chart */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SCORE_DISTRIBUTION} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(v: number) => [v.toLocaleString(), "Leads"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Leads">
                    {SCORE_DISTRIBUTION.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {SCORE_DISTRIBUTION.map((d) => (
                <div key={d.range} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">Score {d.range}</span>
                  </div>
                  <span className="font-medium">{d.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rules list */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Scoring Rules
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
                  {["all", "behavior", "demographic", "firmographic"].map((c) => (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className={`px-2.5 py-1.5 capitalize transition-colors ${(category || "all") === c ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    className="h-8 w-36 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Search rules…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Rule
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading rules…</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                <Target className="h-8 w-8 opacity-40" />
                <p className="text-sm">No rules found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filtered.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 shrink-0">
                      <Zap className={`h-4.5 w-4.5 ${r.active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.condition}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${categoryBadge(r.category)}`}>
                      {r.category}
                    </span>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-primary">+{r.points}</p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                    <Badge variant={r.active ? "success" : "outline"} className={`shrink-0 ${r.active ? "text-emerald-400" : ""}`}>
                      {r.active ? "Active" : "Off"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
