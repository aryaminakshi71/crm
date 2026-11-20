/**
 * Social Posts
 *
 * Post queue with platform indicators, scheduled time, status,
 * engagement metrics (likes/comments/shares), and platform filter.
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
import {
  Calendar,
  Heart,
  Megaphone,
  MessageCircle,
  Plus,
  Repeat2,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { socialApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const searchSchema = z.object({
  q: z.string().optional(),
  platform: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/social/posts/_index")({
  validateSearch: searchSchema,
  component: SocialPostsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: "published" | "scheduled" | "draft" | "failed";
  likes?: number;
  comments?: number;
  shares?: number;
  reach?: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_POSTS: SocialPost[] = [
  { id: "1", content: "Exciting news! We're launching our new Series X product line next week. Stay tuned for live demos, exclusive early-bird pricing, and behind-the-scenes content from our team.", platforms: ["twitter", "linkedin"], scheduledAt: "2026-03-25T10:00:00Z", status: "scheduled", reach: 0 },
  { id: "2", content: "🌟 Customer spotlight: How Acme Corp reduced churn by 40% using our retention tools. Full case study in bio →", platforms: ["instagram", "facebook"], publishedAt: "2026-03-24T14:00:00Z", status: "published", likes: 342, comments: 28, shares: 54, reach: 8900 },
  { id: "3", content: "Join us for a free webinar on mastering B2B lead generation. April 10th, 2pm EST. Register now — link in bio!", platforms: ["twitter", "linkedin", "facebook"], publishedAt: "2026-03-23T09:00:00Z", status: "published", likes: 189, comments: 42, shares: 81, reach: 12400 },
  { id: "4", content: "We just hit 10,000 customers 🎉 Thank you for being part of this journey. Here's to the next 10,000!", platforms: ["twitter", "instagram", "linkedin", "facebook"], publishedAt: "2026-03-22T16:00:00Z", status: "published", likes: 1204, comments: 156, shares: 340, reach: 45000 },
  { id: "5", content: "Q2 roadmap preview — DM for early access to our beta features. Limited spots available.", platforms: ["linkedin"], scheduledAt: "2026-03-28T11:00:00Z", status: "scheduled", reach: 0 },
  { id: "6", content: "5 email marketing mistakes that are killing your open rates (and how to fix them).", platforms: ["twitter"], status: "draft", reach: 0 },
];

// ─── Platform helpers ─────────────────────────────────────────────────────────

const PLATFORMS = ["all", "twitter", "instagram", "facebook", "linkedin"] as const;

function PlatformPill({ platform }: { platform: string }) {
  const styles: Record<string, string> = {
    twitter: "bg-sky-500/10 text-sky-400",
    instagram: "bg-pink-500/10 text-pink-400",
    facebook: "bg-blue-500/10 text-blue-400",
    linkedin: "bg-blue-600/10 text-blue-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[platform] ?? "bg-muted/50 text-muted-foreground"}`}>
      {platform}
    </span>
  );
}

function statusVariant(s: string) {
  switch (s) {
    case "published": return "success";
    case "scheduled": return "default";
    case "draft": return "outline";
    case "failed": return "destructive";
    default: return "outline";
  }
}

// ─── New Post Modal ───────────────────────────────────────────────────────────

function NewPostModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ content: "", platforms: [] as string[], scheduledAt: "" });

  const togglePlatform = (p: string) =>
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));

  const mutation = useMutation({
    mutationFn: () => socialApi.posts.create({ content: form.content, platforms: form.platforms, scheduledAt: form.scheduledAt || undefined }),
    onSuccess: () => {
      toast.success("Post created");
      onCreated();
      onClose();
      setForm({ content: "", platforms: [], scheduledAt: "" });
    },
    onError: () => toast.error("Failed to create post"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New Post</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.content) { toast.error("Content is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Content <span className="text-destructive">*</span></label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={4}
              placeholder="What would you like to share?"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              maxLength={280}
              required
            />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{form.content.length}/280</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {["twitter", "instagram", "facebook", "linkedin"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${form.platforms.includes(p) ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Schedule (optional)</label>
            <input
              type="datetime-local"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : form.scheduledAt ? "Schedule Post" : "Post Now"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

function SocialPostsPage() {
  const qc = useQueryClient();
  const { q: search = "", platform: platformFilter = "all", status: statusFilter = "all", page = 1 } = useSearch({ from: "/app/social/posts/_index" });
  const navigate = useNavigate({ from: "/app/social/posts" });

  const setSearch = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val }) });
  const setPlatformFilter = (val: string) => navigate({ search: (prev) => ({ ...prev, platform: val, page: 1 }) });
  const setStatusFilter = (val: string) => navigate({ search: (prev) => ({ ...prev, status: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["social", "posts", page],
    queryFn: () => socialApi.posts.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const posts: SocialPost[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = posts.filter((p) => {
    const matchSearch = !search || p.content.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === "all" || p.platforms.includes(platformFilter);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchPlatform && matchStatus;
  });

  const postsThisMonth = posts.filter((p) => p.status === "published").length;
  const totalReach = posts.reduce((s, p) => s + (p.reach ?? 0), 0);
  const totalEngagement = posts.reduce((s, p) => s + (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0), 0);
  const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <NewPostModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["social", "posts"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Posts This Month</p>
              <p className="text-2xl font-black">{postsThisMonth}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-black">{totalReach.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Engagement Rate</p>
              <p className="text-2xl font-black">{engagementRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatformFilter(p)}
                className={`px-3 py-1.5 capitalize transition-colors ${platformFilter === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
            {["all", "published", "scheduled", "draft"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Post
          </Button>
        </div>
      </div>

      {/* Posts List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading posts…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Megaphone className="h-8 w-8 opacity-40" />
              <p className="text-sm">No posts found</p>
              <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create your first post
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((p) => {
                const dateStr = p.publishedAt ?? p.scheduledAt;
                const hasEngagement = (p.likes ?? 0) > 0 || (p.comments ?? 0) > 0;
                return (
                  <div key={p.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed line-clamp-2 mb-2">{p.content}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {p.platforms.map((pl) => (
                              <PlatformPill key={pl} platform={pl} />
                            ))}
                          </div>
                          {dateStr && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {hasEngagement && (
                            <>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-rose-400" />
                                {(p.likes ?? 0).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3 text-sky-400" />
                                {(p.comments ?? 0).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Repeat2 className="h-3 w-3 text-emerald-400" />
                                {(p.shares ?? 0).toLocaleString()}
                              </span>
                              {(p.reach ?? 0) > 0 && (
                                <span>
                                  {(p.reach ?? 0).toLocaleString()} reach
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusVariant(p.status) as any} className="shrink-0 capitalize">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
