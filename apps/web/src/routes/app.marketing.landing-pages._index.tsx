/**
 * Marketing Landing Pages
 *
 * List of landing pages with visits, conversions, conversion rate,
 * and published/draft status.
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
  ExternalLink,
  Globe,
  MousePointerClick,
  Plus,
  Search,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { marketingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/marketing/landing-pages/_index")({
  validateSearch: searchSchema,
  component: LandingPagesPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface LandingPage {
  id: string;
  title: string;
  slug?: string;
  visits: number;
  conversions: number;
  status: "published" | "draft";
  updatedAt?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_PAGES: LandingPage[] = [
  { id: "1", title: "Spring Sale 2026", slug: "/promo/spring-2026", visits: 12400, conversions: 744, status: "published", updatedAt: "2026-03-20" },
  { id: "2", title: "Series X Product Launch", slug: "/products/series-x", visits: 8900, conversions: 623, status: "published", updatedAt: "2026-03-18" },
  { id: "3", title: "Free Trial Sign-Up", slug: "/trial", visits: 31200, conversions: 4368, status: "published", updatedAt: "2026-03-15" },
  { id: "4", title: "Webinar Registration", slug: "/webinar/q2-2026", visits: 5600, conversions: 840, status: "published", updatedAt: "2026-03-10" },
  { id: "5", title: "Partner Program", slug: "/partners", visits: 2100, conversions: 84, status: "draft", updatedAt: "2026-03-05" },
  { id: "6", title: "Enterprise Contact", slug: "/enterprise", visits: 0, conversions: 0, status: "draft", updatedAt: "2026-03-01" },
];

// ─── New Page Modal ───────────────────────────────────────────────────────────

function NewPageModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", slug: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await marketingApi.landingPages.create({ title: form.title, slug: form.slug, status: "draft" });
      return result;
    },
    onSuccess: () => {
      toast.success("Landing page created");
      onCreated();
      onClose();
      setForm({ title: "", slug: "" });
    },
    onError: () => toast.error("Failed to create landing page"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New Landing Page</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.title) { toast.error("Title is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Page Title <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Spring Sale 2026"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">URL Slug</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="/promo/spring-2026"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Page"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function LandingPagesPage() {
  const qc = useQueryClient();
  const { q = "", status = "all" } = useSearch({ from: "/app/marketing/landing-pages/_index" });
  const navigate = useNavigate({ from: "/app/marketing/landing-pages" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v }) });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "landing-pages"],
    queryFn: () => marketingApi.landingPages.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const pages: LandingPage[] = (data as any)?.data ?? [];

  const filtered = pages.filter((p) => {
    const matchSearch = !q || p.title.toLowerCase().includes(q.toLowerCase());
    const matchStatus = (status || "all") === "all" || p.status === status;
    return matchSearch && matchStatus;
  });

  const publishedCount = pages.filter((p) => p.status === "published").length;
  const totalVisits = pages.reduce((s, p) => s + p.visits, 0);
  const avgConvRate = pages
    .filter((p) => p.visits > 0)
    .reduce((s, p, _, arr) => s + (p.conversions / p.visits) * 100 / arr.length, 0);

  return (
    <div className="space-y-6">
      <NewPageModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["marketing", "landing-pages"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Globe className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Published Pages</p>
              <p className="text-2xl font-black">{publishedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MousePointerClick className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Visits</p>
              <p className="text-2xl font-black">{totalVisits.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Target className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Conv. Rate</p>
              <p className="text-2xl font-black">{avgConvRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Landing Pages
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
                {["all", "published", "draft"].map((s) => (
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
                  placeholder="Search pages…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Page
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading pages…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Globe className="h-8 w-8 opacity-40" />
              <p className="text-sm">No landing pages found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-5 py-3 text-left">Page</th>
                    <th className="px-4 py-3 text-left">URL Slug</th>
                    <th className="px-4 py-3 text-right">Visits</th>
                    <th className="px-4 py-3 text-right">Conversions</th>
                    <th className="px-4 py-3 text-right">Conv. Rate</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const convRate = p.visits > 0 ? ((p.conversions / p.visits) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium">{p.title}</p>
                          {p.updatedAt && <p className="text-[11px] text-muted-foreground">Updated {new Date(p.updatedAt).toLocaleDateString()}</p>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{p.slug ?? "—"}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{p.visits.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{p.conversions.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <span className={parseFloat(convRate) > 10 ? "text-emerald-400 font-medium" : ""}>{convRate}%</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={p.status === "published" ? "success" : "outline"} className={p.status === "published" ? "text-emerald-400" : ""}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"
                            onClick={() => toast.info(`Opening "${p.title}"`)}>
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
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
