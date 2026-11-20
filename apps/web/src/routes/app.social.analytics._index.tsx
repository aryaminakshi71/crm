/**
 * Social Analytics
 *
 * Follower growth (LineChart), engagement rate by platform (BarChart),
 * and top posts by engagement.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { z } from "zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { socialApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  period: z.enum(["week", "month", "quarter"]).optional(),
  platform: z.string().optional(),
});

export const Route = createFileRoute("/app/social/analytics/_index")({
  validateSearch: searchSchema,
  component: SocialAnalyticsPage,
});

// ─── Static chart data ────────────────────────────────────────────────────────

const FOLLOWER_GROWTH: { month: string; total: number }[] = [];

const ENGAGEMENT_BY_PLATFORM: { platform: string; engagementRate: number; color: string }[] = [];

const TOP_POSTS: { id: string; platform: string; content: string; likes: number; comments: number; shares: number; reach: number }[] = [];

const POST_ENGAGEMENT_DATA: { post: string; impressions: number; likes: number; comments: number }[] = [];

const PERIOD_OPTIONS = ["week", "month", "quarter"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "#0f172a",
  border: "none",
  borderRadius: "12px",
  fontSize: "11px",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon, color }: { title: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="text-2xl font-black mt-0.5">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground/60 font-bold mt-1">{sub}</p>}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Platform indicator ───────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

function SocialAnalyticsPage() {
  const { q = "", period: periodParam = "month", platform = "" } = useSearch({ from: "/app/social/analytics/_index" });
  const navigate = useNavigate({ from: "/app/social/analytics" });
  const period = periodParam as Period;

  const { data } = useQuery({
    queryKey: ["social", "analytics", period],
    queryFn: () => socialApi.analytics.get("all"),
    retry: false,
  });

  const followerGrowth = (data as any)?.followerGrowth ?? FOLLOWER_GROWTH;
  const engagementByPlatform = (data as any)?.engagementByPlatform ?? ENGAGEMENT_BY_PLATFORM;
  const topPosts = (data as any)?.topPosts ?? TOP_POSTS;

  const filteredPosts = topPosts.filter((post: any) => {
    const matchesQ = !q || post.content?.toLowerCase().includes(q.toLowerCase());
    const matchesPlatform = !platform || post.platform?.toLowerCase() === platform.toLowerCase();
    return matchesQ && matchesPlatform;
  });

  const latestFollowers = followerGrowth[followerGrowth.length - 1]?.total ?? 0;
  const followerGrowthNet = latestFollowers - (followerGrowth[0]?.total ?? 0);
  const avgEngagement = engagementByPlatform.length > 0
    ? (engagementByPlatform.reduce((s: number, p: any) => s + p.engagementRate, 0) / engagementByPlatform.length).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6">
      {/* Period Selector & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <h2 className="text-lg font-semibold">Social Analytics</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 w-52"
              placeholder="Search posts..."
              value={q}
              onChange={(e) =>
                navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
              }
            />
          </div>
          <select
            value={platform}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, platform: e.target.value || undefined }) })
            }
            className="rounded-md border border-border/60 bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
            <option value="facebook">Facebook</option>
          </select>
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => navigate({ search: (prev) => ({ ...prev, period: p }) })}
                className={`px-4 py-2 capitalize transition-colors ${period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Followers" value={latestFollowers.toLocaleString()} sub={`+${followerGrowthNet.toLocaleString()} this period`} icon={<Users className="h-4 w-4" />} color="text-primary" />
        <KpiCard title="Avg Engagement Rate" value={`${avgEngagement}%`} sub="+0.3% vs last period" icon={<Heart className="h-4 w-4" />} color="text-rose-400" />
        <KpiCard title="Total Impressions" value="148K" sub="+18% vs last period" icon={<Eye className="h-4 w-4" />} color="text-violet-400" />
        <KpiCard title="Post Reach" value="66.3K" sub="avg per post" icon={<TrendingUp className="h-4 w-4" />} color="text-emerald-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Follower Growth */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Follower Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={followerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), "Followers"]} />
                  <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="Total Followers" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Rate by Platform */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Engagement Rate by Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementByPlatform} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="platform" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Engagement Rate"]} />
                  <Bar dataKey="engagementRate" radius={[4, 4, 0, 0]} name="Engagement Rate">
                    {engagementByPlatform.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {engagementByPlatform.map((p: any) => (
                <div key={p.platform} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-muted-foreground">{p.platform}</span>
                  <span className="font-medium">{p.engagementRate}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post Engagement Breakdown */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Post Engagement Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={POST_ENGAGEMENT_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="post" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [v.toLocaleString(), name.charAt(0).toUpperCase() + name.slice(1)]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="impressions" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} name="impressions" />
                <Line type="monotone" dataKey="likes" stroke="#f472b6" strokeWidth={2} dot={{ r: 3 }} name="likes" />
                <Line type="monotone" dataKey="comments" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} name="comments" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Top Posts by Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {filteredPosts.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No posts match your search.</p>
            )}
            {filteredPosts.map((post: any, i: number) => {
              const totalEng = (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);
              const engRate = post.reach > 0 ? ((totalEng / post.reach) * 100).toFixed(1) : "0.0";
              return (
                <div key={post.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg font-black text-muted-foreground/40 w-6 shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformPill platform={post.platform} />
                      </div>
                      <p className="text-sm line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-rose-400" />
                      {(post.likes ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5 text-sky-400" />
                      {(post.comments ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="h-3.5 w-3.5 text-emerald-400" />
                      {(post.shares ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {(post.reach ?? 0).toLocaleString()} reach
                    </span>
                    <span className="font-bold text-primary">{engRate}% eng.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
