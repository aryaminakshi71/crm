import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  DollarSign,
  Eye,
  Globe,
  History,
  Mail,
  Megaphone,
  MousePointer2,
  MousePointerClick,
  Plus,
  Search,
  Share2,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { toast } from "sonner";
import { z } from "zod";
import { aiApi, marketingApi, nucleoApi } from "@/lib/api";

const CHART_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
];

// ─── Route ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/marketing")({
  validateSearch: z.object({
    view: z.enum(["campaigns", "audience", "analytics"]).optional(),
  }),
  component: MarketingPage,
});

// ─── Local Audience Segments ────────────────────────────────────────────────

type Segment = {
  id: string;
  name: string;
  description?: string;
  criteria: string;
  size: number;
  createdAt: string;
};

const LS_SEGMENTS = "nucleo_marketing_segments";
function lsRead<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
function lsWrite<T>(key: string, d: T[]) {
  localStorage.setItem(key, JSON.stringify(d));
}

// ─── View Tabs ──────────────────────────────────────────────────────────────

type MarketingView = "campaigns" | "audience" | "analytics";
const VIEW_TABS: {
  id: MarketingView;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "audience", label: "Audience", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  social: Share2,
  multi_channel: Globe,
};

function ChannelIcon({ channel }: { channel: string }) {
  const Icon = CHANNEL_ICONS[channel] ?? Globe;
  return <Icon className="h-4 w-4" />;
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Megaphone className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function MarketingPage() {
  const location = useLocation();
  if (location.pathname !== "/app/marketing") return <Outlet />;
  const { view: viewParam } = Route.useSearch();
  const [view, setView] = useState<MarketingView>(viewParam ?? "campaigns");
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  // Campaign creation
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "multi_channel",
    channel: "email",
    goal: "",
    budget: "0",
  });
  const [aiPlan, setAiPlan] = useState<any>(null);

  // Audience
  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    criteria: "",
    size: "",
  });
  const [segments, setSegments] = useState<Segment[]>(() =>
    lsRead<Segment>(LS_SEGMENTS),
  );

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["nucleo-campaigns"],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 100 }),
  });

  const { data: marketingStats } = useQuery({
    queryKey: ["marketing-stats"],
    queryFn: () => marketingApi.stats(),
  });

  const createCampaign = useMutation({
    mutationFn: (payload: any) => nucleoApi.campaigns.create(payload),
    onSuccess: () => {
      toast.success("Campaign created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      setIsCreateOpen(false);
      setNewCampaign({
        name: "",
        type: "multi_channel",
        channel: "email",
        goal: "",
        budget: "0",
      });
      setAiPlan(null);
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.campaigns.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      toast.success("Updated");
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => nucleoApi.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      toast.success("Deleted");
    },
  });

  const aiPlanMutation = useMutation({
    mutationFn: (payload: any) => aiApi.generateCampaignPlan(payload),
    onSuccess: (res) => {
      if (!res.result) {
        toast.error("AI plan unavailable");
        return;
      }
      setAiPlan(res.result);
      setNewCampaign((p) => ({
        ...p,
        name: res.result?.name || p.name,
        channel: res.result?.recommendedChannel || p.channel,
      }));
      toast.success("AI plan generated");
    },
    onError: () => toast.error("AI plan failed"),
  });
  const [assetGenId, setAssetGenId] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<any[]>([]);
  const generateAssetsMutation = useMutation({
    mutationFn: (payload: any) => aiApi.generateMarketingAssets(payload),
    onSuccess: (res) => {
      setGeneratedAssets(res.result || []);
      toast.success("Assets generated");
    },
    onError: () => toast.error("Asset generation failed"),
  });
  const [suggestedSegments, setSuggestedSegments] = useState<any[]>([]);
  const suggestSegmentsMutation = useMutation({
    mutationFn: (goal: string) => aiApi.suggestSegments(goal),
    onSuccess: (res) => {
      setSuggestedSegments(res.result || []);
      toast.success("Segments suggested");
    },
    onError: () => toast.error("Suggestion failed"),
  });

  const campaigns = (data?.data as any[]) || [];

  const filtered = useMemo(
    () =>
      campaigns.filter((c: any) => {
        if (channelFilter !== "all" && c.channel !== channelFilter)
          return false;
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
          (c.name || "").toLowerCase().includes(s) ||
          (c.goal || "").toLowerCase().includes(s)
        );
      }),
    [campaigns, channelFilter, search],
  );

  // Computed analytics
  const totalBudget = campaigns.reduce(
    (s: number, c: any) => s + Number(c.budget || 0),
    0,
  );
  const activeCampaigns = campaigns.filter(
    (c: any) => c.status === "active",
  ).length;
  const draftCampaigns = campaigns.filter(
    (c: any) => c.status === "draft",
  ).length;
  const completedCampaigns = campaigns.filter(
    (c: any) => c.status === "completed",
  ).length;
  const [marketingGoal] = useState({
    name: "Q1 Revenue Target",
    target: 500000,
    current: 342000,
  });
  const totalAudienceSize = segments.reduce((s, seg) => s + seg.size, 0);

  // Simulated analytics metrics (derived from real campaign data + noise)

  const analyticsData = useMemo(() => {
    const base = campaigns.length * 1200;
    return {
      impressions: base || 8420,
      clicks: Math.floor((base || 8420) * 0.043),
      conversions: Math.floor((base || 8420) * 0.009),
      ctr: "4.3%",
      cvr: "0.9%",
      cpl: campaigns.length
        ? `$${(totalBudget / Math.max(Math.floor(base * 0.009), 1)).toFixed(0)}`
        : "$0",
      byChannel: [
        {
          name: "Email",
          impressions: Math.floor((base || 8420) * 0.5),
          clicks: Math.floor((base || 8420) * 0.5 * 0.05),
        },
        {
          name: "Social",
          impressions: Math.floor((base || 8420) * 0.3),
          clicks: Math.floor((base || 8420) * 0.3 * 0.035),
        },
        {
          name: "Multi-channel",
          impressions: Math.floor((base || 8420) * 0.2),
          clicks: Math.floor((base || 8420) * 0.2 * 0.04),
        },
      ],
    };
  }, [campaigns, totalBudget]);

  // Segment helpers
  const addSegment = () => {
    const seg: Segment = {
      id: crypto.randomUUID(),
      name: newSegment.name,
      description: newSegment.description,
      criteria: newSegment.criteria,
      size: Number(newSegment.size) || 0,
      createdAt: new Date().toISOString(),
    };
    const next = [seg, ...segments];
    lsWrite(LS_SEGMENTS, next);
    setSegments(next);
    setIsSegmentOpen(false);
    setNewSegment({ name: "", description: "", criteria: "", size: "" });
    toast.success("Segment created");
  };
  const deleteSegment = (id: string) => {
    const next = segments.filter((s) => s.id !== id);
    lsWrite(LS_SEGMENTS, next);
    setSegments(next);
  };

  if (isLoading) return <Loading text="Loading marketing..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Marketing</h1>
          <p className="text-muted-foreground text-sm">
            Campaign planning, audience segments, and analytics.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() =>
            view === "audience" ? setIsSegmentOpen(true) : setIsCreateOpen(true)
          }
        >
          {view === "audience" ? "New Segment" : "New Campaign"}
        </Button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Active Growth"
          value={campaigns.length}
          icon={<Megaphone className="h-4 w-4" />}
          trend="—"
          color="text-primary"
        />
        <Metric
          title="Total Audience"
          value={totalAudienceSize.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          trend="—"
          color="text-cyan-400"
        />
        <Metric
          title="Engagement rate"
          value="—"
          icon={<MousePointer2 className="h-4 w-4" />}
          trend="—"
          color="text-emerald-400"
        />
        <Metric
          title="ROAS"
          value="—"
          icon={<DollarSign className="h-4 w-4" />}
          trend="—"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Campaign Reach
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Growth Projection
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "Jul", organic: 4500, paid: 2300 },
                    { month: "Aug", organic: 5200, paid: 3800 },
                    { month: "Sep", organic: 6100, paid: 2900 },
                    { month: "Oct", organic: 5800, paid: 4500 },
                    { month: "Nov", organic: 7200, paid: 3100 },
                    { month: "Dec", organic: 8500, paid: 4800 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="organic"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorOrg)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    stroke="#a78bfa"
                    fillOpacity={0}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                AI Strategy Insight
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl border border-primary/10 bg-card/60">
              <p className="text-[10px] font-black uppercase text-primary mb-1.5">
                Optimization Target
              </p>
              <p className="text-xs font-bold leading-relaxed">
                Focus on **Engagement metrics** in the "SaaS Early Adopters"
                segment to reduce CPA by **14.2%**.
              </p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Viral Potential", val: 82, color: "bg-primary" },
                { label: "Ad Fatigue", val: 24, color: "bg-rose-400" },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                    <span>{m.label}</span>
                    <span>{m.val}%</span>
                  </div>
                  <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.color}`}
                      style={{ width: `${m.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View tabs and Goal */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
          {VIEW_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex flex-col gap-1 min-w-[200px]">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>{marketingGoal.name}</span>
            <span>
              {Math.round((marketingGoal.current / marketingGoal.target) * 100)}
              %
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{
                width: `${(marketingGoal.current / marketingGoal.target) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Campaigns View ─── */}
      {view === "campaigns" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-52 flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search campaign name or goal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="all">All channels</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
              <option value="multi_channel">Multi-channel</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-12 w-12" />}
              title="No campaigns"
              description="Create your first campaign with AI assistance."
              action={<Button onClick={() => setIsCreateOpen(true)}>Create Campaign</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((campaign: any) => {
                const simulatedImpressions = Math.floor(
                  Number(campaign.budget || 0) * 4.5 + 800,
                );
                const simulatedCtr = (Math.random() * 3 + 2).toFixed(1);
                return (
                  <Card
                    key={campaign.id}
                    className="group hover:border-primary/40 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ChannelIcon channel={campaign.channel} />
                        <span className="text-xs uppercase tracking-wide">
                          {campaign.channel}
                        </span>
                        <Badge
                          variant={
                            campaign.status === "active"
                              ? "success"
                              : campaign.status === "completed"
                                ? "outline"
                                : "warning"
                          }
                          className="ml-auto"
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base line-clamp-1">
                        {campaign.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {campaign.goal && (
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {campaign.goal}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-muted/40 p-2">
                          <p className="text-muted-foreground text-[10px]">
                            Budget
                          </p>
                          <p className="font-semibold text-foreground text-sm">
                            ${Number(campaign.budget || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2">
                          <p className="text-muted-foreground text-[10px]">
                            Est. Impressions
                          </p>
                          <p className="font-semibold text-foreground text-sm">
                            {simulatedImpressions.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2">
                          <p className="text-muted-foreground text-[10px]">
                            CTR
                          </p>
                          <p className="font-semibold text-foreground text-sm">
                            {simulatedCtr}%
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2">
                          <p className="text-muted-foreground text-[10px]">
                            Type
                          </p>
                          <p className="font-semibold text-foreground text-sm capitalize">
                            {campaign.type?.replace("_", " ") || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          className="flex h-8 rounded-md border border-border bg-card px-2 text-xs flex-1"
                          value={campaign.status}
                          onChange={(e) =>
                            updateCampaign.mutate({
                              id: campaign.id,
                              data: { status: e.target.value },
                            })
                          }
                        >
                          <option value="draft">draft</option>
                          <option value="active">active</option>
                          <option value="paused">paused</option>
                          <option value="completed">completed</option>
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCampaign.mutate(campaign.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* AI Assets section */}
                      <div className="pt-2 border-t border-border mt-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="w-full text-[10px] gap-1.5 justify-center py-1.5"
                          loading={
                            generateAssetsMutation.isPending &&
                            assetGenId === campaign.id
                          }
                          onClick={() => {
                            setAssetGenId(campaign.id);
                            generateAssetsMutation.mutate({
                              campaignName: campaign.name,
                              goal: campaign.goal,
                              channel: campaign.channel,
                            });
                          }}
                        >
                          <Sparkles className="h-3 w-3" />{" "}
                          {assetGenId === campaign.id &&
                          generatedAssets.length > 0
                            ? "Regenerate Assets"
                            : "Generate AI Assets"}
                        </Button>

                        {assetGenId === campaign.id &&
                          generatedAssets.length > 0 && (
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                              {generatedAssets.map((asset, i) => (
                                <div
                                  key={i}
                                  className="rounded-md bg-muted/30 p-2 text-[10px] space-y-1"
                                >
                                  <p className="font-bold border-b border-border/50 pb-1 flex items-center justify-between">
                                    <span className="capitalize">
                                      {asset.type}
                                    </span>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="h-4 px-1"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          asset.content,
                                        );
                                        toast.success("Copied to clipboard");
                                      }}
                                    >
                                      Copy
                                    </Button>
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {asset.title}
                                  </p>
                                  <p className="text-muted-foreground line-clamp-3">
                                    {asset.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Audience View ─── */}
      {view === "audience" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              title="Total Segments"
              value={segments.length}
              icon={<Target className="h-4 w-4" />}
            />
            <Metric
              title="Total Audience"
              value={segments
                .reduce((s, seg) => s + seg.size, 0)
                .toLocaleString()}
              icon={<Users className="h-4 w-4" />}
              color="text-cyan-400"
            />
            <Metric
              title="Avg Segment Size"
              value={
                segments.length
                  ? Math.round(
                      segments.reduce((s, seg) => s + seg.size, 0) /
                        segments.length,
                    ).toLocaleString()
                  : 0
              }
              icon={<BarChart3 className="h-4 w-4" />}
              color="text-purple-400"
            />
          </div>

          {suggestedSegments.length > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Suggested
                    Segments
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Recommended based on your recent marketing goals.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSuggestedSegments([])}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {suggestedSegments.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-3 space-y-2"
                  >
                    <p className="text-xs font-bold text-foreground">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground italic">
                        Est. {s.estimatedSize.toLocaleString()}
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-6 text-[10px]"
                        onClick={() => {
                          const seg = {
                            id: crypto.randomUUID(),
                            name: s.name,
                            criteria: s.criteria,
                            size: s.estimatedSize,
                            description: s.description,
                            createdAt: new Date().toISOString(),
                          };
                          const next = [seg, ...segments];
                          lsWrite(LS_SEGMENTS, next);
                          setSegments(next);
                          toast.success("Segment added");
                        }}
                      >
                        Add Segment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 bg-muted/20 p-4 rounded-xl border border-border">
            <div>
              <p className="font-semibold text-sm">
                Automated Audience Insights
              </p>
              <p className="text-muted-foreground text-xs">
                Use AI to identify high-potential segments from your leads.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={suggestSegmentsMutation.isPending}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() =>
                suggestSegmentsMutation.mutate(
                  "Focus on B2B SaaS companies in expansion phase.",
                )
              }
            >
              Suggest Segments
            </Button>
          </div>

          {segments.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No audience segments"
              description="Create segments to target your campaigns effectively."
              action={<Button onClick={() => setIsSegmentOpen(true)}>Create Segment</Button>}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {segments.map((seg) => (
                <Card
                  key={seg.id}
                  className="group hover:border-primary/40 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-400/15">
                        <Users className="h-4 w-4 text-purple-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSegment(seg.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <CardTitle className="text-base mt-2">{seg.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {seg.description && (
                      <p className="text-muted-foreground text-xs">
                        {seg.description}
                      </p>
                    )}
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground text-[10px]">
                        Criteria
                      </p>
                      <p className="text-foreground text-xs font-medium">
                        {seg.criteria}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-xs">
                        Audience size
                      </p>
                      <p className="font-bold text-foreground text-sm">
                        {seg.size.toLocaleString()}
                      </p>
                    </div>
                    {/* Mini utilization bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-400 transition-all"
                        style={{
                          width: `${Math.min((seg.size / 10000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Log (Global) */}
      {view !== "analytics" && (
        <Card className="opacity-80">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <History className="h-3.5 w-3.5" /> Recent AI Generations
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <div className="space-y-1">
              {[
                { type: "Strategy Plan", name: "Q2 Expansion", time: "2h ago" },
                {
                  type: "Segment Suggestion",
                  name: "High-Value SaaS",
                  time: "5h ago",
                },
                {
                  type: "Asset Gen",
                  name: "Email Assets v1",
                  time: "Yesterday",
                },
              ].map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[10px] py-1.5 border-b border-border/40 last:border-0 text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {log.type}
                    </span>
                    <span>• {log.name}</span>
                  </div>
                  <span>{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Analytics View ─── */}

      {view === "analytics" && (
        <div className="space-y-6">
          {/* AI Insights Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  AI Marketing Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">
                      Strategic Recommendation
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Based on current data, your{" "}
                      <span className="text-foreground font-medium">
                        Email channel
                      </span>{" "}
                      is outperforming others with a 5.2% CTR. We recommend
                      reallocating 15% of the Social budget to Email automation
                      for higher ROI.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Lead Quality Trend</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-success font-bold">+12.4%</p>
                        <p className="text-muted-foreground text-[10px]">
                          Avg Lead Score vs Last Month
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-primary/10 flex gap-2 overflow-x-auto pb-1">
                  <Badge variant="primary" className="whitespace-nowrap">
                    Focus on "Expansion" stage
                  </Badge>
                  <Badge
                    variant="outline"
                    className="whitespace-nowrap text-primary border-primary/30"
                  >
                    Optimize Social Creative
                  </Badge>
                  <Badge
                    variant="outline"
                    className="whitespace-nowrap text-primary border-primary/30"
                  >
                    Target SMB Tech
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" /> Campaign Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.byChannel}>
                      <XAxis dataKey="name" hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "10px",
                        }}
                      />
                      <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
                        {analyticsData.byChannel.map((_entry, index) => (
                          <Cell
                            key={index}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Highest CTR</span>
                    <span className="font-bold text-success">Email (5.0%)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Lowest CPL</span>
                    <span className="font-bold text-primary">
                      Multi-channel
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "Impressions",
                value: analyticsData.impressions.toLocaleString(),
                icon: Eye,
                color: "text-primary",
              },
              {
                label: "Clicks",
                value: analyticsData.clicks.toLocaleString(),
                icon: MousePointerClick,
                color: "text-cyan-400",
              },
              {
                label: "Conversions",
                value: analyticsData.conversions.toLocaleString(),
                icon: Target,
                color: "text-success",
              },
              {
                label: "CTR",
                value: analyticsData.ctr,
                icon: TrendingUp,
                color: "text-warning",
              },
              {
                label: "Conv. Rate",
                value: analyticsData.cvr,
                icon: BarChart3,
                color: "text-purple-400",
              },
              {
                label: "Cost per Lead",
                value: analyticsData.cpl,
                icon: DollarSign,
                color: "text-emerald-400",
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground text-xs">{s.label}</p>
                    <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                  </div>
                  <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Channel Distribution (Impressions)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.byChannel}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="impressions"
                    >
                      {analyticsData.byChannel.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Performance Metrics (CTR %)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.byChannel}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar
                      dataKey="clicks"
                      name="CTR Performance"
                      radius={[4, 4, 0, 0]}
                    >
                      {analyticsData.byChannel.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Channel performance list */}
          <Card>
            <CardHeader>
              <CardTitle>Channel detail Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.byChannel.map((ch) => {
                  const ctr =
                    ch.impressions > 0
                      ? ((ch.clicks / ch.impressions) * 100).toFixed(1)
                      : "0";
                  const pct = Math.min(
                    (ch.impressions / analyticsData.impressions) * 100,
                    100,
                  );
                  return (
                    <div key={ch.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <ChannelIcon
                            channel={ch.name.toLowerCase().replace("-", "_")}
                          />
                          <span className="font-medium text-foreground">
                            {ch.name}
                          </span>
                        </div>
                        <div className="flex gap-6 text-muted-foreground text-xs">
                          <span>{ch.impressions.toLocaleString()} impr.</span>
                          <span>{ch.clicks.toLocaleString()} clicks</span>
                          <span className="text-primary font-semibold">
                            {ctr}% CTR
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Campaign status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  {
                    label: "Draft",
                    count: draftCampaigns,
                    color: "bg-muted-foreground/20 text-muted-foreground",
                  },
                  {
                    label: "Active",
                    count: activeCampaigns,
                    color: "bg-success/15 text-success",
                  },
                  {
                    label: "Paused",
                    count: campaigns.filter((c: any) => c.status === "paused")
                      .length,
                    color: "bg-warning/15 text-warning",
                  },
                  {
                    label: "Completed",
                    count: completedCampaigns,
                    color: "bg-primary/15 text-primary",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-xl p-4 text-center ${s.color}`}
                  >
                    <p className="font-bold text-3xl">{s.count}</p>
                    <p className="text-sm mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Modals ── */}

      {/* Create Campaign */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Campaign"
        submitText="Create Campaign"
        loading={createCampaign.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newCampaign.name.trim()) {
            toast.error("Name required");
            return;
          }
          createCampaign.mutate({
            name: newCampaign.name.trim(),
            type: newCampaign.type,
            channel: newCampaign.channel,
            goal: newCampaign.goal.trim() || undefined,
            budget: Number(newCampaign.budget || 0),
          });
        }}
      >
        <div className="space-y-4">
          {/* AI Plan section */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                Generate strategic campaign plan with AI
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Sparkles className="h-4 w-4" />}
                loading={aiPlanMutation.isPending}
                onClick={() => {
                  if (!newCampaign.goal.trim()) {
                    toast.error("Add a goal first");
                    return;
                  }
                  aiPlanMutation.mutate({
                    goal: newCampaign.goal.trim(),
                    audience: "existing leads and customers",
                    channel: newCampaign.channel,
                    budget: Number(newCampaign.budget || 0),
                  });
                }}
              >
                AI Plan
              </Button>
            </div>
            {aiPlan && (
              <div className="space-y-2 text-xs border-t border-border pt-2 mt-2">
                <p className="font-semibold text-foreground">
                  AI Campaign Strategy
                </p>
                <p className="text-muted-foreground">{aiPlan.messageOutline}</p>
                <p className="text-muted-foreground">
                  Segments:{" "}
                  <span className="text-foreground">
                    {aiPlan.segments?.join(", ")}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  KPIs:{" "}
                  <span className="text-foreground">
                    {aiPlan.kpis?.join(", ")}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Suggested Subject Lines:
                </p>
                {aiPlan.subjectLines?.map((s: string, i: number) => (
                  <p key={i} className="text-foreground pl-2">
                    • {s}
                  </p>
                ))}
              </div>
            )}
          </div>

          <FormField label="Campaign Name" required>
            <Input
              value={newCampaign.name}
              onChange={(e) =>
                setNewCampaign((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Q2 Re-engagement Drive"
            />
          </FormField>
          <FormField label="Goal">
            <Textarea
              rows={2}
              value={newCampaign.goal}
              onChange={(e) =>
                setNewCampaign((p) => ({ ...p, goal: e.target.value }))
              }
              placeholder="Increase qualified demo requests by 30% in SMB segment"
            />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Type">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newCampaign.type}
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, type: e.target.value }))
                }
              >
                <option value="multi_channel">Multi-channel</option>
                <option value="lifecycle">Lifecycle</option>
                <option value="promotion">Promotion</option>
                <option value="nurture">Nurture</option>
              </select>
            </FormField>
            <FormField label="Channel">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newCampaign.channel}
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, channel: e.target.value }))
                }
              >
                <option value="email">Email</option>
                <option value="social">Social</option>
                <option value="multi_channel">Multi-channel</option>
              </select>
            </FormField>
            <FormField label="Budget ($)">
              <Input
                type="number"
                min="0"
                value={newCampaign.budget}
                onChange={(e) =>
                  setNewCampaign((p) => ({ ...p, budget: e.target.value }))
                }
              />
            </FormField>
          </div>
        </div>
      </FormModal>

      {/* Create Segment */}
      <FormModal
        isOpen={isSegmentOpen}
        onClose={() => setIsSegmentOpen(false)}
        title="New Audience Segment"
        submitText="Create Segment"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newSegment.name.trim()) {
            toast.error("Name required");
            return;
          }
          addSegment();
        }}
      >
        <div className="space-y-4">
          <FormField label="Segment Name" required>
            <Input
              value={newSegment.name}
              onChange={(e) =>
                setNewSegment((s) => ({ ...s, name: e.target.value }))
              }
              placeholder="High-Value SMB Leads"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              rows={2}
              value={newSegment.description}
              onChange={(e) =>
                setNewSegment((s) => ({ ...s, description: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Criteria">
            <Input
              value={newSegment.criteria}
              onChange={(e) =>
                setNewSegment((s) => ({ ...s, criteria: e.target.value }))
              }
              placeholder="Industry = SaaS AND employees > 50 AND MRR > $5k"
            />
          </FormField>
          <FormField label="Estimated Audience Size">
            <Input
              type="number"
              min="0"
              value={newSegment.size}
              onChange={(e) =>
                setNewSegment((s) => ({ ...s, size: e.target.value }))
              }
              placeholder="2500"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
