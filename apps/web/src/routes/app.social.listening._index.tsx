/**
 * Social Listening
 *
 * Keyword/topic monitoring with mention count, sentiment analysis
 * (positive/neutral/negative), and reach stats.
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
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertTriangle,
  Minus,
  Plus,
  Radio,
  Search,
  SmilePlus,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { socialApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  sentiment: z.string().optional(),
});

export const Route = createFileRoute("/app/social/listening/_index")({
  validateSearch: searchSchema,
  component: SocialListeningPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListeningTopic {
  id: string;
  keyword: string;
  platforms: string[];
  mentions: number;
  sentiment: "positive" | "neutral" | "negative";
  sentimentBreakdown?: { positive: number; neutral: number; negative: number };
  reach: number;
  trending: boolean;
  lastMentionAt?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_TOPICS: ListeningTopic[] = [
  { id: "1", keyword: "Nucleo One", platforms: ["twitter", "linkedin", "reddit"], mentions: 2840, sentiment: "positive", sentimentBreakdown: { positive: 68, neutral: 24, negative: 8 }, reach: 142000, trending: true, lastMentionAt: "2026-03-24T10:00:00Z" },
  { id: "2", keyword: "#B2Bsales", platforms: ["twitter", "linkedin"], mentions: 5420, sentiment: "neutral", sentimentBreakdown: { positive: 42, neutral: 45, negative: 13 }, reach: 380000, trending: true, lastMentionAt: "2026-03-24T09:45:00Z" },
  { id: "3", keyword: "CRM software", platforms: ["twitter", "facebook", "linkedin"], mentions: 3100, sentiment: "neutral", sentimentBreakdown: { positive: 35, neutral: 50, negative: 15 }, reach: 210000, trending: false, lastMentionAt: "2026-03-24T08:00:00Z" },
  { id: "4", keyword: "Series X launch", platforms: ["twitter", "instagram"], mentions: 890, sentiment: "positive", sentimentBreakdown: { positive: 78, neutral: 18, negative: 4 }, reach: 56000, trending: true, lastMentionAt: "2026-03-24T07:30:00Z" },
  { id: "5", keyword: "competitor_name", platforms: ["twitter"], mentions: 620, sentiment: "negative", sentimentBreakdown: { positive: 12, neutral: 28, negative: 60 }, reach: 34000, trending: false, lastMentionAt: "2026-03-23T18:00:00Z" },
];

// ─── Sentiment helpers ────────────────────────────────────────────────────────

function SentimentIcon({ sentiment }: { sentiment: string }) {
  switch (sentiment) {
    case "positive": return <SmilePlus className="h-4 w-4 text-emerald-400" />;
    case "negative": return <AlertTriangle className="h-4 w-4 text-red-400" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

function sentimentColor(s: string) {
  switch (s) {
    case "positive": return "text-emerald-400 bg-emerald-500/10";
    case "negative": return "text-red-400 bg-red-500/10";
    default: return "text-muted-foreground bg-muted/50";
  }
}

function SentimentBar({ breakdown }: { breakdown: { positive: number; neutral: number; negative: number } }) {
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-px">
      <div className="bg-emerald-400 rounded-l-full" style={{ width: `${breakdown.positive}%` }} title={`Positive: ${breakdown.positive}%`} />
      <div className="bg-muted-foreground/40" style={{ width: `${breakdown.neutral}%` }} title={`Neutral: ${breakdown.neutral}%`} />
      <div className="bg-red-400 rounded-r-full" style={{ width: `${breakdown.negative}%` }} title={`Negative: ${breakdown.negative}%`} />
    </div>
  );
}

// ─── New Topic Modal ──────────────────────────────────────────────────────────

function NewTopicModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ keyword: "", platforms: [] as string[] });

  const togglePlatform = (p: string) =>
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return { id: String(Date.now()), keyword: form.keyword, platforms: form.platforms, mentions: 0, sentiment: "neutral", reach: 0, trending: false };
    },
    onSuccess: () => {
      toast.success(`Now tracking "${form.keyword}"`);
      onCreated();
      onClose();
      setForm({ keyword: "", platforms: [] });
    },
    onError: () => toast.error("Failed to add topic"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">Track New Keyword</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.keyword) { toast.error("Keyword is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Keyword / Hashtag <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="brand name, #hashtag, competitor…"
              value={form.keyword}
              onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Platforms (optional)</label>
            <div className="flex flex-wrap gap-2">
              {["twitter", "instagram", "facebook", "linkedin", "reddit"].map((p) => (
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
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Start Tracking"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SocialListeningPage() {
  const qc = useQueryClient();
  const { q: search = "", sentiment: sentimentFilter = "all" } = useSearch({ from: "/app/social/listening/_index" });
  const navigate = useNavigate({ from: "/app/social/listening" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setSentimentFilter = (v: string) => navigate({ search: (p) => ({ ...p, sentiment: v }) });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["social", "listening"],
    queryFn: () => socialApi.listening.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const topics: ListeningTopic[] = (data as any)?.data ?? [];

  const filtered = topics.filter((t) => {
    const matchSearch = !search || t.keyword.toLowerCase().includes(search.toLowerCase());
    const matchSentiment = sentimentFilter === "all" || t.sentiment === sentimentFilter;
    return matchSearch && matchSentiment;
  });

  const totalMentions = topics.reduce((s, t) => s + t.mentions, 0);
  const positivePct = topics.length > 0
    ? (topics.filter((t) => t.sentiment === "positive").length / topics.length * 100).toFixed(0)
    : "0";
  const trendingCount = topics.filter((t) => t.trending).length;

  return (
    <div className="space-y-6">
      <NewTopicModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["social", "listening"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Mentions</p>
              <p className="text-2xl font-black">{totalMentions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <SmilePlus className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Positive Sentiment</p>
              <p className="text-2xl font-black">{positivePct}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trending Topics</p>
              <p className="text-2xl font-black">{trendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topics */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Tracked Keywords & Topics
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
                {["all", "positive", "neutral", "negative"].map((s) => (
                  <button key={s} type="button" onClick={() => setSentimentFilter(s)}
                    className={`px-3 py-1.5 capitalize transition-colors ${sentimentFilter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="h-8 w-40 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search topics…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Track Keyword
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading topics…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Radio className="h-8 w-8 opacity-40" />
              <p className="text-sm">No topics found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((t) => (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SentimentIcon sentiment={t.sentiment} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{t.keyword}</p>
                        {t.trending && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />
                            Trending
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {t.platforms.map((p) => (
                          <span key={p} className="text-[10px] text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">{p}</span>
                        ))}
                      </div>
                      {t.sentimentBreakdown && (
                        <div className="max-w-48">
                          <SentimentBar breakdown={t.sentimentBreakdown} />
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="text-emerald-400">{t.sentimentBreakdown.positive}% pos</span>
                            <span>{t.sentimentBreakdown.neutral}% neu</span>
                            <span className="text-red-400">{t.sentimentBreakdown.negative}% neg</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      <p className="font-bold text-foreground text-sm">{t.mentions.toLocaleString()}</p>
                      <p>mentions</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{(t.reach / 1000).toFixed(0)}k</p>
                      <p>reach</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${sentimentColor(t.sentiment)}`}>
                    {t.sentiment}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
