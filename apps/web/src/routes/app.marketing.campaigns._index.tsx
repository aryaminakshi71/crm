/**
 * Marketing Campaigns
 *
 * Full list of marketing campaigns with status, performance metrics,
 * and pause/launch actions.
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
  BarChart3,
  Mail,
  Megaphone,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { marketingApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const perfData = [
  { name: "Summer Sale", opens: 42, clicks: 18 },
  { name: "Newsletter", opens: 38, clicks: 12 },
  { name: "Product Launch", opens: 61, clicks: 29 },
  { name: "Re-engagement", opens: 24, clicks: 8 },
];

const perfTooltipStyle = {
  background: "#0f172a",
  border: "none",
  borderRadius: "12px",
  fontSize: "11px",
};

export const Route = createFileRoute("/app/marketing/campaigns/_index")({
  validateSearch: z.object({
    q: z.string().optional().default(""),
    status: z.string().optional().default("all"),
    page: z.number().optional().default(1),
  }),
  component: CampaignsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  type?: string;
  channel?: string;
  status: "active" | "paused" | "draft" | "completed";
  sentCount?: number;
  openRate?: number;
  clickRate?: number;
  conversions?: number;
  audienceSize?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
}

// ─── Mock data fallback ───────────────────────────────────────────────────────

const _MOCK_CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Spring Sale 2026", type: "email", channel: "Email", status: "active", sentCount: 24500, openRate: 28.4, clickRate: 6.2, conversions: 312, audienceSize: 25000, budget: 5000 },
  { id: "2", name: "Product Launch – Series X", type: "social", channel: "Social", status: "active", sentCount: 18000, openRate: 34.1, clickRate: 8.9, conversions: 540, audienceSize: 18000, budget: 8000 },
  { id: "3", name: "Customer Retention Q1", type: "email", channel: "Email", status: "paused", sentCount: 12000, openRate: 22.0, clickRate: 4.5, conversions: 180, audienceSize: 32000, budget: 3000 },
  { id: "4", name: "Newsletter Weekly", type: "email", channel: "Email", status: "active", sentCount: 44000, openRate: 31.6, clickRate: 5.8, conversions: 440, audienceSize: 45000, budget: 1000 },
  { id: "5", name: "Brand Awareness Q2", type: "ads", channel: "Ads", status: "draft", sentCount: 0, openRate: 0, clickRate: 0, conversions: 0, audienceSize: 10000, budget: 6000 },
  { id: "6", name: "Year-End Promo 2025", type: "email", channel: "Email", status: "completed", sentCount: 38000, openRate: 29.3, clickRate: 7.1, conversions: 890, audienceSize: 40000, budget: 4500 },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function statusVariant(status: string) {
  switch (status) {
    case "active": return "success";
    case "paused": return "warning";
    case "draft": return "outline";
    case "completed": return "default";
    default: return "outline";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "active": return "text-emerald-400";
    case "paused": return "text-amber-400";
    case "draft": return "text-muted-foreground";
    case "completed": return "text-sky-400";
    default: return "text-muted-foreground";
  }
}

// ─── Channel Icon ─────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel?: string }) {
  const cls = "h-5 w-5";
  switch ((channel ?? "").toLowerCase()) {
    case "email": return <Mail className={`${cls} text-primary`} />;
    case "social": return <Megaphone className={`${cls} text-violet-400`} />;
    case "ads": return <Target className={`${cls} text-rose-400`} />;
    default: return <Zap className={`${cls} text-muted-foreground`} />;
  }
}

// ─── New Campaign Modal ───────────────────────────────────────────────────────

interface NewCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function NewCampaignModal({ open, onClose, onCreated }: NewCampaignModalProps) {
  const [form, setForm] = useState({ name: "", channel: "Email", budget: "", startDate: "", endDate: "" });

  const mutation = useMutation({
    mutationFn: () => marketingApi.campaigns.create({ name: form.name, channel: form.channel, budget: Number(form.budget) || undefined }),
    onSuccess: () => {
      toast.success("Campaign created");
      onCreated();
      onClose();
      setForm({ name: "", channel: "Email", budget: "", startDate: "", endDate: "" });
    },
    onError: () => toast.error("Failed to create campaign"),
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New Campaign</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name) { toast.error("Name is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Campaign Name <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Summer Promo 2026"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Channel</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              >
                {["Email", "Social", "Ads", "SMS"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Budget ($)</label>
              <input
                type="number" min="0"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="5000"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Start Date</label>
              <input type="date" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">End Date</label>
              <input type="date" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

function CampaignsPage() {
  const qc = useQueryClient();
  const { q: search, status: statusFilter, page } = useSearch({ from: Route.fullPath });
  const navigate = useNavigate({ from: Route.fullPath });
  const setSearch = (v: string) => navigate({ search: (prev: any) => ({ ...prev, q: v, page: 1 }) });
  const setStatusFilter = (v: string) => navigate({ search: (prev: any) => ({ ...prev, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (prev: any) => ({ ...prev, page: v }) });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "campaigns", "list", page],
    queryFn: () => marketingApi.campaigns.list({ page, limit: PAGE_SIZE }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      marketingApi.campaigns.update(id, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Campaign ${status === "active" ? "launched" : "paused"}`);
      qc.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
    },
    onError: () => toast.error("Failed to update campaign"),
  });

  const campaigns: Campaign[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = campaigns.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalReach = campaigns.reduce((s, c) => s + (c.audienceSize ?? 0), 0);
  const avgOpenRate = campaigns.filter((c) => (c.openRate ?? 0) > 0).reduce((s, c, _, arr) => s + (c.openRate ?? 0) / arr.length, 0);

  return (
    <div className="space-y-6">
      <NewCampaignModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["marketing", "campaigns"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-black">{activeCampaigns}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-black">{totalReach.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <TrendingUp className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Open Rate</p>
              <p className="text-2xl font-black">{avgOpenRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Open vs Click Rate Chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Open Rate vs Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perfData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={9} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={perfTooltipStyle} formatter={(v: number, name: string) => [`${v}%`, name === "opens" ? "Open Rate" : "Click Rate"]} />
                  <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="opens" fill="#22d3ee" radius={[4, 4, 0, 0]} name="opens" />
                  <Bar dataKey="clicks" fill="#818cf8" radius={[4, 4, 0, 0]} name="clicks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-[200px] content-center">
              {[
                {
                  label: "Total Sent",
                  value: campaigns.reduce((s, c) => s + (c.sentCount ?? 0), 0).toLocaleString(),
                  icon: <Mail className="h-4 w-4" />,
                  color: "text-primary",
                },
                {
                  label: "Avg Open Rate",
                  value: `${campaigns.filter((c) => (c.openRate ?? 0) > 0).reduce((s, c, _, arr) => s + (c.openRate ?? 0) / arr.length, 0).toFixed(1)}%`,
                  icon: <MousePointerClick className="h-4 w-4" />,
                  color: "text-emerald-400",
                },
                {
                  label: "Avg Click Rate",
                  value: `${campaigns.filter((c) => (c.clickRate ?? 0) > 0).reduce((s, c, _, arr) => s + (c.clickRate ?? 0) / arr.length, 0).toFixed(1)}%`,
                  icon: <Target className="h-4 w-4" />,
                  color: "text-violet-400",
                },
                {
                  label: "Total Conversions",
                  value: campaigns.reduce((s, c) => s + (c.conversions ?? 0), 0).toLocaleString(),
                  icon: <Zap className="h-4 w-4" />,
                  color: "text-amber-400",
                },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                  <div className={`rounded-lg bg-muted/30 p-2 ${stat.color}`}>{stat.icon}</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              All Campaigns
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter */}
              <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
                {["all", "active", "paused", "draft", "completed"].map((s) => (
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
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="h-8 w-44 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search campaigns…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading campaigns…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Megaphone className="h-8 w-8 opacity-40" />
              <p className="text-sm">No campaigns found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-5 py-3 text-left">Campaign</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Sent</th>
                    <th className="px-4 py-3 text-right">Open Rate</th>
                    <th className="px-4 py-3 text-right">Click Rate</th>
                    <th className="px-4 py-3 text-right">Conversions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 shrink-0">
                            <ChannelIcon channel={c.channel ?? c.type} />
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{c.name}</p>
                            {c.audienceSize ? (
                              <p className="text-[11px] text-muted-foreground">{c.audienceSize.toLocaleString()} audience</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-muted-foreground">{c.channel ?? c.type ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={statusVariant(c.status) as any} className={`capitalize ${statusColor(c.status)}`}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{(c.sentCount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        <span className={(c.openRate ?? 0) > 25 ? "text-emerald-400" : ""}>{(c.openRate ?? 0).toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        <span className={(c.clickRate ?? 0) > 5 ? "text-primary" : ""}>{(c.clickRate ?? 0).toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-medium">{(c.conversions ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              disabled={updateMutation.isPending}
                              onClick={() => updateMutation.mutate({ id: c.id, status: "paused" })}
                            >
                              <Pause className="h-3 w-3" />
                              Pause
                            </Button>
                          ) : c.status === "paused" || c.status === "draft" ? (
                            <Button
                              size="sm"
                              variant="primary"
                              className="h-7 text-xs gap-1"
                              disabled={updateMutation.isPending}
                              onClick={() => updateMutation.mutate({ id: c.id, status: "active" })}
                            >
                              <Play className="h-3 w-3" />
                              Launch
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground px-2">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
