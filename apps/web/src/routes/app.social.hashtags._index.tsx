/**
 * Social Hashtags
 *
 * Tracked hashtags with platform, post count, reach, engagement,
 * trending indicator, and "Track" button to add new ones.
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
  Hash,
  Plus,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { socialApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/social/hashtags/_index")({
  validateSearch: searchSchema,
  component: SocialHashtagsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hashtag {
  id: string;
  tag: string;
  platform: string;
  postCount: number;
  reach: number;
  engagement: number;
  trending: boolean;
  lastUsed?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_HASHTAGS: Hashtag[] = [
  { id: "1", tag: "#B2Bsales", platform: "twitter", postCount: 1240, reach: 890000, engagement: 42800, trending: true, lastUsed: "2026-03-24T09:00:00Z" },
  { id: "2", tag: "#CRM", platform: "linkedin", postCount: 3400, reach: 2100000, engagement: 84000, trending: false, lastUsed: "2026-03-24T08:30:00Z" },
  { id: "3", tag: "#SaaSgrowth", platform: "twitter", postCount: 680, reach: 420000, engagement: 18900, trending: true, lastUsed: "2026-03-24T07:45:00Z" },
  { id: "4", tag: "#marketingautomation", platform: "linkedin", postCount: 920, reach: 540000, engagement: 21600, trending: false, lastUsed: "2026-03-23T18:00:00Z" },
  { id: "5", tag: "#productlaunch", platform: "instagram", postCount: 5600, reach: 3200000, engagement: 160000, trending: true, lastUsed: "2026-03-23T16:00:00Z" },
  { id: "6", tag: "#leadgeneration", platform: "linkedin", postCount: 1800, reach: 1100000, engagement: 44000, trending: false, lastUsed: "2026-03-23T14:00:00Z" },
  { id: "7", tag: "#startups", platform: "twitter", postCount: 8900, reach: 7400000, engagement: 296000, trending: true, lastUsed: "2026-03-24T10:00:00Z" },
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

// ─── Track Modal ──────────────────────────────────────────────────────────────

function TrackHashtagModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ tag: "", platform: "twitter" });

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return { id: String(Date.now()), tag: form.tag.startsWith("#") ? form.tag : `#${form.tag}`, platform: form.platform, postCount: 0, reach: 0, engagement: 0, trending: false };
    },
    onSuccess: () => {
      toast.success(`Now tracking #${form.tag.replace(/^#/, "")}`);
      onCreated();
      onClose();
      setForm({ tag: "", platform: "twitter" });
    },
    onError: () => toast.error("Failed to track hashtag"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">Track Hashtag</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.tag) { toast.error("Hashtag is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Hashtag <span className="text-destructive">*</span></label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="B2Bsales"
                value={form.tag.replace(/^#/, "")}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value.replace(/^#/, "") }))}
                required
              />
            </div>
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
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Tracking…" : "Track"}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SocialHashtagsPage() {
  const qc = useQueryClient();
  const { q = "", page = 1 } = useSearch({ from: "/app/social/hashtags/_index" });
  const navigate = useNavigate({ from: "/app/social/hashtags" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["social", "hashtags"],
    queryFn: () => socialApi.hashtags.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const hashtags: Hashtag[] = (data as any)?.data ?? [];

  const filtered = hashtags.filter((h) => {
    const matchSearch = !search || h.tag.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === "all" || h.platform === platformFilter;
    return matchSearch && matchPlatform;
  });

  const trendingCount = hashtags.filter((h) => h.trending).length;
  const totalReach = hashtags.reduce((s, h) => s + h.reach, 0);

  return (
    <div className="space-y-6">
      <TrackHashtagModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["social", "hashtags"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tracked Hashtags</p>
              <p className="text-2xl font-black">{hashtags.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currently Trending</p>
              <p className="text-2xl font-black">{trendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Combined Reach</p>
              <p className="text-2xl font-black">{(totalReach / 1000000).toFixed(1)}M</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Tracked Hashtags
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
                  className="h-8 w-36 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search hashtags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Track
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading hashtags…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Hash className="h-8 w-8 opacity-40" />
              <p className="text-sm">No hashtags found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-5 py-3 text-left">Hashtag</th>
                    <th className="px-4 py-3 text-left">Platform</th>
                    <th className="px-4 py-3 text-right">Posts</th>
                    <th className="px-4 py-3 text-right">Reach</th>
                    <th className="px-4 py-3 text-right">Engagement</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => {
                    const ps = platformStyles(h.platform);
                    const tagDisplay = h.tag.startsWith("#") ? h.tag : `#${h.tag}`;
                    const engRate = h.reach > 0 ? ((h.engagement / h.reach) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={h.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-semibold">{tagDisplay}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ps.bg} ${ps.text}`}>
                            {h.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{h.postCount.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          {h.reach >= 1000000 ? `${(h.reach / 1000000).toFixed(1)}M` : `${(h.reach / 1000).toFixed(0)}K`}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <span>{h.engagement.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-1">({engRate}%)</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {h.trending ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5 w-fit">
                              <TrendingUp className="h-2.5 w-2.5" />
                              Trending
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Stable</span>
                          )}
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
