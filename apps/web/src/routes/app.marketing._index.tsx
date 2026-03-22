/**
 * Marketing Dashboard
 *
 * Overview of marketing metrics, active campaigns, and quick actions.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clipboard,
  ClipboardCheck,
  Cpu,
  DollarSign,
  Link2,
  Mail,
  MousePointerClick,
  Plus,
  Send,
  Target,
  TrendingUp,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { marketingApi } from "../lib/api";

export const Route = createFileRoute("/app/marketing/_index")({
  component: MarketingDashboard,
});

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

const campaignPerformanceData = [
  { month: "Jan", emails: 12000, conversions: 840, revenue: 42000 },
  { month: "Feb", emails: 15000, conversions: 1050, revenue: 52500 },
  { month: "Mar", emails: 18000, conversions: 1260, revenue: 63000 },
  { month: "Apr", emails: 22000, conversions: 1540, revenue: 77000 },
  { month: "May", emails: 25000, conversions: 1750, revenue: 87500 },
  { month: "Jun", emails: 28000, conversions: 1960, revenue: 98000 },
];

const channelDistribution = [
  { name: "Email", value: 45, color: "#22d3ee" },
  { name: "Social", value: 25, color: "#a78bfa" },
  { name: "Paid Ads", value: 20, color: "#f472b6" },
  { name: "Organic", value: 10, color: "#34d399" },
];

const leadScoreDistribution = [
  { score: "Hot (80-100)", count: 234, color: "#ef4444" },
  { score: "Warm (50-79)", count: 892, color: "#f97316" },
  { score: "Cool (20-49)", count: 1456, color: "#eab308" },
  { score: "Cold (0-19)", count: 2103, color: "#22d3ee" },
];

// ─── Simulated Email Open Heatmap Data ───────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Generate simulated open rates (0-100) with realistic peaks (9-11am, 1-3pm)
function simulateOpenRate(day: number, hour: number): number {
  const isWeekend = day >= 5;
  if (isWeekend) return Math.round(Math.random() * 20 + 5);
  // Business hours peaks
  const morning = hour >= 8 && hour <= 11 ? 60 : 0;
  const lunch = hour >= 12 && hour <= 14 ? 40 : 0;
  const evening = hour >= 17 && hour <= 19 ? 30 : 0;
  const base = morning + lunch + evening;
  return Math.min(100, Math.round(base + Math.random() * 20));
}

const heatmapData = DAYS.map((day, dayIdx) =>
  HOURS.map((hour) => ({ hour, rate: simulateOpenRate(dayIdx, hour) }))
);

function getHeatColor(rate: number): string {
  if (rate >= 70) return "bg-primary/80";
  if (rate >= 50) return "bg-primary/60";
  if (rate >= 35) return "bg-primary/40";
  if (rate >= 20) return "bg-primary/20";
  if (rate >= 10) return "bg-primary/10";
  return "bg-muted/30";
}

// ─── Campaign Creation Modal ──────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  channel: string;
  audienceSize: number;
  budget: number;
  startDate: string;
  endDate: string;
  status: "active" | "draft";
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Spring Sale 2026", channel: "Email", audienceSize: 25000, budget: 5000, startDate: "2026-03-01", endDate: "2026-03-31", status: "active" },
  { id: "2", name: "Product Launch - Series X", channel: "Social", audienceSize: 18000, budget: 8000, startDate: "2026-03-15", endDate: "2026-04-15", status: "active" },
  { id: "3", name: "Customer Retention Q1", channel: "Email", audienceSize: 32000, budget: 3000, startDate: "2026-01-01", endDate: "2026-03-31", status: "draft" },
  { id: "4", name: "Newsletter Weekly", channel: "Email", audienceSize: 45000, budget: 1000, startDate: "2026-01-06", endDate: "2026-12-31", status: "active" },
];

interface NewCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}

function NewCampaignModal({ open, onClose, onCreated }: NewCampaignModalProps) {
  const [form, setForm] = useState({
    name: "",
    channel: "Email",
    audienceSize: "",
    budget: "",
    startDate: "",
    endDate: "",
  });

  const channels = ["Email", "SMS", "Social", "Ads"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error("Name and dates are required");
      return;
    }
    const campaign: Campaign = {
      id: String(Date.now()),
      name: form.name,
      channel: form.channel,
      audienceSize: Number(form.audienceSize) || 0,
      budget: Number(form.budget) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      status: "draft",
    };
    onCreated(campaign);
    toast.success("Campaign created");
    setForm({ name: "", channel: "Email", audienceSize: "", budget: "", startDate: "", endDate: "" });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New Campaign</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Campaign Name <span className="text-destructive">*</span>
            </label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Summer Promo 2026"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Channel</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
            >
              {channels.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Audience Size</label>
              <input
                type="number"
                min="0"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="10000"
                value={form.audienceSize}
                onChange={(e) => setForm((f) => ({ ...f, audienceSize: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Budget ($)</label>
              <input
                type="number"
                min="0"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="5000"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Start Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                End Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── UTM Builder ──────────────────────────────────────────────────────────────

function UtmBuilder() {
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState(false);

  const utmUrl = useMemo(() => {
    if (!url) return "";
    try {
      const base = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (source) base.searchParams.set("utm_source", source);
      if (medium) base.searchParams.set("utm_medium", medium);
      if (campaign) base.searchParams.set("utm_campaign", campaign);
      return base.toString();
    } catch {
      return "";
    }
  }, [url, source, medium, campaign]);

  const handleCopy = () => {
    if (!utmUrl) return;
    navigator.clipboard.writeText(utmUrl).then(() => {
      setCopied(true);
      toast.success("UTM URL copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          UTM Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Destination URL
          </label>
          <input
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="https://yoursite.com/landing"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Source
            </label>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="google"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Medium
            </label>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="cpc"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Campaign
            </label>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="spring-sale"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            />
          </div>
        </div>
        {utmUrl && (
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
            <p className="text-[11px] text-muted-foreground mb-2 font-medium">Generated URL:</p>
            <p className="text-xs break-all text-foreground font-mono leading-relaxed">{utmUrl}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {copied ? (
                <>
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard className="h-3.5 w-3.5" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Email Open Heatmap ───────────────────────────────────────────────────────

function EmailOpenHeatmap() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Open Heatmap
        </CardTitle>
        <p className="text-xs text-muted-foreground">Best times to send (by day &amp; hour)</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Hour labels */}
          <div className="flex">
            {/* Day label spacer */}
            <div className="w-8 shrink-0" />
            <div className="flex flex-1 gap-px">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex-1 text-center text-[8px] text-muted-foreground"
                  style={{ minWidth: 10 }}
                >
                  {h % 6 === 0 ? `${h}h` : ""}
                </div>
              ))}
            </div>
          </div>
          {/* Grid rows */}
          <div className="space-y-px mt-1">
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center gap-px">
                <div className="w-8 shrink-0 text-[9px] text-muted-foreground text-right pr-1">
                  {day}
                </div>
                {heatmapData[dayIdx].map(({ hour, rate }) => (
                  <div
                    key={hour}
                    title={`${day} ${hour}:00 — ${rate}% open rate`}
                    className={`flex-1 rounded-sm transition-colors ${getHeatColor(rate)}`}
                    style={{ minWidth: 10, height: 18 }}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Low</span>
            {["bg-primary/10", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80"].map((c) => (
              <div key={c} className={`h-3 w-6 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function MarketingDashboard() {
  const campaignsQuery = useQuery({
    queryKey: ["marketing", "campaigns"],
    queryFn: () => marketingApi.campaigns.list({ limit: 50 }),
    retry: false,
  });

  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const campaigns: Campaign[] = campaignsQuery.data?.data?.length > 0
    ? campaignsQuery.data.data
    : localCampaigns;

  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const handleCampaignCreated = (c: Campaign) => {
    setLocalCampaigns((prev) => [c, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* New Campaign Modal */}
      <NewCampaignModal
        open={showNewCampaign}
        onClose={() => setShowNewCampaign(false)}
        onCreated={handleCampaignCreated}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Emails Sent"
          value="142,500"
          trend="+18.2% vs last month"
          icon={<Mail className="h-4 w-4" />}
          color="text-primary"
        />
        <MetricCard
          title="Active Subscribers"
          value="24,892"
          trend="+1,234 this month"
          icon={<Users className="h-4 w-4" />}
          color="text-violet-400"
        />
        <MetricCard
          title="Conversion Rate"
          value="6.8%"
          trend="+0.4% vs last month"
          icon={<Target className="h-4 w-4" />}
          color="text-emerald-400"
        />
        <MetricCard
          title="Marketing Revenue"
          value="$128,450"
          trend="+$12,300 vs last month"
          icon={<DollarSign className="h-4 w-4" />}
          color="text-amber-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Campaign Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={campaignPerformanceData}>
                  <defs>
                    <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area type="monotone" dataKey="emails" stroke="#22d3ee" fillOpacity={1} fill="url(#colorEmails)" strokeWidth={2} />
                  <Area type="monotone" dataKey="conversions" stroke="#a78bfa" fillOpacity={1} fill="url(#colorConversions)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Channel Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {channelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {channelDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lead Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Lead Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadScoreDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis dataKey="score" type="category" axisLine={false} tickLine={false} fontSize={9} stroke="#888" width={80} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {leadScoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Recent Campaigns
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowNewCampaign(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Campaign
              </Button>
              <Link to="/app/marketing/campaigns">
                <Button size="sm" variant="ghost" rightIcon={<TrendingUp className="h-3 w-3" />}>
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.channel} · {campaign.audienceSize.toLocaleString()} audience
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {campaign.budget > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium">${campaign.budget.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Budget</p>
                      </div>
                    )}
                    <Badge variant={campaign.status === "active" ? "success" : "outline"}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UTM Builder + Heatmap Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UtmBuilder />
        <EmailOpenHeatmap />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setShowNewCampaign(true)}
        >
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">New Campaign</p>
                <p className="text-xs text-muted-foreground">Create campaign</p>
              </div>
            </CardContent>
          </Card>
        </button>
        <Link to="/app/marketing/email-builder">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Mail className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Email Builder</p>
                <p className="text-xs text-muted-foreground">Design emails</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/marketing/automation">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Cpu className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Automation</p>
                <p className="text-xs text-muted-foreground">Workflows</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/marketing/analytics">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Analytics</p>
                <p className="text-xs text-muted-foreground">View reports</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className="h-2.5 w-2.5 text-primary/40" />
              <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
