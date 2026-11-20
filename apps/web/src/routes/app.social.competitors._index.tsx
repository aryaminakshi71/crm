/**
 * Social Competitors
 *
 * Competitor tracking table with platforms, followers, posting frequency,
 * engagement rate, and comparison to your own metrics.
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
  BarChart3,
  Plus,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { socialApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/social/competitors/_index")({
  validateSearch: searchSchema,
  component: SocialCompetitorsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Competitor {
  id: string;
  name: string;
  handle?: string;
  platform: string;
  followers: number;
  followersCount?: number;
  postingFrequency?: number;
  engagementRate?: number;
  notes?: string;
}

// ─── Your own baseline metrics ────────────────────────────────────────────────

const OWN_METRICS = {
  followers: 62300,
  engagementRate: 3.4,
  postingFrequency: 5,
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_COMPETITORS: Competitor[] = [
  { id: "1", name: "Acme CRM", handle: "@acmecrm", platform: "linkedin", followers: 88400, postingFrequency: 7, engagementRate: 2.8 },
  { id: "2", name: "Salesforce", handle: "@salesforce", platform: "twitter", followers: 410000, postingFrequency: 12, engagementRate: 1.2 },
  { id: "3", name: "HubSpot", handle: "@hubspot", platform: "linkedin", followers: 320000, postingFrequency: 10, engagementRate: 2.1 },
  { id: "4", name: "Pipedrive", handle: "@pipedrive", platform: "twitter", followers: 42000, postingFrequency: 4, engagementRate: 3.1 },
  { id: "5", name: "Zoho CRM", handle: "@zohocrm", platform: "twitter", followers: 65000, postingFrequency: 6, engagementRate: 1.9 },
];

// ─── Platform helpers ─────────────────────────────────────────────────────────

function platformStyles(p: string) {
  switch (p) {
    case "twitter": return { bg: "bg-sky-500/10", text: "text-sky-400" };
    case "instagram": return { bg: "bg-pink-500/10", text: "text-pink-400" };
    case "facebook": return { bg: "bg-blue-500/10", text: "text-blue-400" };
    case "linkedin": return { bg: "bg-blue-600/10", text: "text-blue-500" };
    default: return { bg: "bg-muted/50", text: "text-muted-foreground" };
  }
}

// ─── Relative rank badge ──────────────────────────────────────────────────────

function RelativeRank({ competitor, ownFollowers }: { competitor: Competitor; ownFollowers: number }) {
  const cFollowers = competitor.followers ?? competitor.followersCount ?? 0;
  const ratio = cFollowers > 0 ? ownFollowers / cFollowers : 1;
  if (ratio >= 1) return <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">Ahead</span>;
  if (ratio >= 0.5) return <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5">Behind</span>;
  return <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">Far behind</span>;
}

// ─── Add Competitor Modal ─────────────────────────────────────────────────────

function AddCompetitorModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", handle: "", platform: "linkedin" });

  const mutation = useMutation({
    mutationFn: () => socialApi.competitors.create({ name: form.name, handle: form.handle || undefined, platform: form.platform }),
    onSuccess: () => {
      toast.success(`Added ${form.name} as competitor`);
      onCreated();
      onClose();
      setForm({ name: "", handle: "", platform: "linkedin" });
    },
    onError: () => toast.error("Failed to add competitor"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">Add Competitor</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name) { toast.error("Name is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Competitor Name <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Acme CRM"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Handle</label>
              <input
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="@acmecrm"
                value={form.handle}
                onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Platform</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              >
                {["twitter", "instagram", "facebook", "linkedin"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add Competitor"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SocialCompetitorsPage() {
  const qc = useQueryClient();
  const { q = "", page = 1 } = useSearch({ from: "/app/social/competitors/_index" });
  const navigate = useNavigate({ from: "/app/social/competitors/_index" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["social", "competitors"],
    queryFn: () => socialApi.competitors.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const competitors: Competitor[] = (data as any)?.data ?? [];

  const filtered = competitors.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.handle ?? "").toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === "all" || c.platform === platformFilter;
    return matchSearch && matchPlatform;
  });

  // Rank: how many competitors we're ahead of by followers
  const aheadCount = competitors.filter((c) => OWN_METRICS.followers > (c.followers ?? c.followersCount ?? 0)).length;
  const relativeRank = competitors.length > 0 ? `${aheadCount}/${competitors.length}` : "—";

  return (
    <div className="space-y-6">
      <AddCompetitorModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["social", "competitors"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Competitors Tracked</p>
              <p className="text-2xl font-black">{competitors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Relative Rank</p>
              <p className="text-2xl font-black">{relativeRank}</p>
              <p className="text-[10px] text-muted-foreground/60 font-bold">by followers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Followers</p>
              <p className="text-2xl font-black">{OWN_METRICS.followers.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your baseline highlight */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">YOUR METRICS (benchmark)</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Followers</p>
              <p className="font-bold">{OWN_METRICS.followers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Engagement Rate</p>
              <p className="font-bold text-emerald-400">{OWN_METRICS.engagementRate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Posts / Week</p>
              <p className="font-bold">{OWN_METRICS.postingFrequency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={[
              { name: "Your Brand", followers: 24800, engagement: 4.2, mentions: 1240 },
              { name: "Competitor A", followers: 41200, engagement: 2.8, mentions: 890 },
              { name: "Competitor B", followers: 18900, engagement: 5.1, mentions: 720 },
              { name: "Competitor C", followers: 31500, engagement: 3.4, mentions: 1050 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Legend />
              <Bar dataKey="followers" fill="#6366f1" name="Followers" radius={[0, 4, 4, 0]} />
              <Bar dataKey="mentions" fill="#10b981" name="Mentions" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Competitor Analysis
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
                {["all", "twitter", "instagram", "facebook", "linkedin"].map((p) => (
                  <button key={p} type="button" onClick={() => setPlatformFilter(p)}
                    className={`px-2.5 py-1.5 capitalize transition-colors ${platformFilter === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="h-8 w-40 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search competitors…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Competitor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading competitors…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Shield className="h-8 w-8 opacity-40" />
              <p className="text-sm">No competitors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-5 py-3 text-left">Competitor</th>
                    <th className="px-4 py-3 text-left">Platform</th>
                    <th className="px-4 py-3 text-right">Followers</th>
                    <th className="px-4 py-3 text-right">Posts/Wk</th>
                    <th className="px-4 py-3 text-right">Eng. Rate</th>
                    <th className="px-4 py-3 text-left">vs You</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const ps = platformStyles(c.platform);
                    const cFollowers = c.followers ?? c.followersCount ?? 0;
                    const followerDelta = cFollowers - OWN_METRICS.followers;
                    const engDelta = (c.engagementRate ?? 0) - OWN_METRICS.engagementRate;
                    return (
                      <tr key={c.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold">{c.name}</p>
                          {c.handle && <p className="text-xs text-muted-foreground">{c.handle}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ps.bg} ${ps.text}`}>
                            {c.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <p>{cFollowers.toLocaleString()}</p>
                          {followerDelta !== 0 && (
                            <p className={`text-[10px] flex items-center justify-end gap-0.5 ${followerDelta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                              {followerDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                              {Math.abs(followerDelta).toLocaleString()} vs you
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{c.postingFrequency ?? "—"}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <p>{(c.engagementRate ?? 0).toFixed(1)}%</p>
                          {engDelta !== 0 && (
                            <p className={`text-[10px] flex items-center justify-end gap-0.5 ${engDelta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                              {engDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                              {Math.abs(engDelta).toFixed(1)}%
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <RelativeRank competitor={c} ownFollowers={OWN_METRICS.followers} />
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
