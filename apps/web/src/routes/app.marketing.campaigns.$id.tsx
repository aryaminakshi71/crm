/**
 * Campaign Detail
 *
 * Detailed view of a single marketing campaign with analytics.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Download,
  Mail,
  MailOpen,
  MousePointerClick,
  Pause,
  Play,
  RefreshCw,
  Send,
  Share2,
  TrendingUp,
  Users,
  AlertCircle
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
import { useQuery } from "@tanstack/react-query";
import { marketingApi } from "@/lib/api";

export const Route = createFileRoute("/app/marketing/campaigns/$id")({
  component: CampaignDetail,
});

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

const dailyPerformance = [
  { date: "Mar 1", sent: 5200, delivered: 5180, opened: 1772, clicked: 302 },
  { date: "Mar 2", sent: 4800, delivered: 4780, opened: 1635, clicked: 278 },
  { date: "Mar 3", sent: 5100, delivered: 5070, opened: 1734, clicked: 296 },
  { date: "Mar 4", sent: 5500, delivered: 5470, opened: 1872, clicked: 319 },
  { date: "Mar 5", sent: 4400, delivered: 4380, opened: 1498, clicked: 255 },
  { date: "Mar 6", sent: 0, delivered: 0, opened: 0, clicked: 0 },
  { date: "Mar 7", sent: 0, delivered: 0, opened: 0, clicked: 0 },
  { date: "Mar 8", sent: 5000, delivered: 4970, opened: 1700, clicked: 290 },
  { date: "Mar 9", sent: 5300, delivered: 5270, opened: 1802, clicked: 307 },
  { date: "Mar 10", sent: 4900, delivered: 4870, opened: 1665, clicked: 284 },
];

const deviceDistribution = [
  { name: "Mobile", value: 52, color: "#22d3ee" },
  { name: "Desktop", value: 38, color: "#a78bfa" },
  { name: "Tablet", value: 10, color: "#f472b6" },
];

const locationData = [
  { country: "United States", opens: 8200, conversions: 156 },
  { country: "United Kingdom", opens: 2100, conversions: 42 },
  { country: "Germany", opens: 1800, conversions: 36 },
  { country: "Canada", opens: 1500, conversions: 30 },
  { country: "France", opens: 1200, conversions: 24 },
];

function CampaignDetail() {
  const { id } = Route.useParams();

  const campaignQuery = useQuery({
    queryKey: ["marketing", "campaigns", id],
    queryFn: () => marketingApi.campaigns.get(id),
    placeholderData: (prev) => prev,
    retry: false,
  });
  if (campaignQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => campaignQuery.refetch()}>Retry</Button>
    </div>
  );

  const campaign = campaignQuery.data ?? {};

  if (campaignQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
        <div className="h-72 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => history.back()}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xl text-foreground">{campaign.name}</h2>
              <Badge variant="success">{campaign.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)} campaign started {new Date(campaign.startDate).toLocaleDateString()}
              {campaign.endDate && ` - ending ${new Date(campaign.endDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>
            Share
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Copy className="h-4 w-4" />}>
            Duplicate
          </Button>
          {campaign.status === "active" ? (
            <Button variant="outline" size="sm" leftIcon={<Pause className="h-4 w-4" />}>
              Pause
            </Button>
          ) : (
            <Button variant="primary" size="sm" leftIcon={<Play className="h-4 w-4" />}>
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <MetricCard title="Sent" value={campaign.sent.toLocaleString()} icon={<Send className="h-4 w-4" />} color="text-primary" />
        <MetricCard title="Delivered" value={campaign.delivered.toLocaleString()} icon={<CheckCircle className="h-4 w-4" />} color="text-emerald-400" />
        <MetricCard title="Open Rate" value={`${campaign.openRate}%`} icon={<MailOpen className="h-4 w-4" />} color="text-violet-400" />
        <MetricCard title="Click Rate" value={`${campaign.clickRate}%`} icon={<MousePointerClick className="h-4 w-4" />} color="text-amber-400" />
        <MetricCard title="Conversions" value={campaign.conversions.toString()} icon={<TrendingUp className="h-4 w-4" />} color="text-rose-400" />
        <MetricCard title="Revenue" value={`$${(campaign.revenue / 1000).toFixed(1)}K`} icon={<DollarSign className="h-4 w-4" />} color="text-emerald-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Daily Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPerformance}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#22d3ee" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="opened" stroke="#a78bfa" fillOpacity={1} fill="url(#colorOpened)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {deviceDistribution.map((entry, index) => (
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
            <div className="mt-4 space-y-2">
              {deviceDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Top Locations by Opens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationData.map((location, index) => (
                <div key={location.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm">{location.country}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{location.opens.toLocaleString()} opens</span>
                    <span className="text-xs font-medium text-emerald-400">{location.conversions} conv.</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bounce & Unsubscribes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Bounce Rate</span>
                  <span className="text-sm font-bold text-amber-400">{campaign.bounceRate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${campaign.bounceRate * 10}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Unsubscribe Rate</span>
                  <span className="text-sm font-bold text-rose-400">{campaign.unsubscribeRate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-rose-400" style={{ width: `${campaign.unsubscribeRate * 10}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Click-to-Open Rate</span>
                  <span className="text-sm font-bold text-primary">{((campaign.clickRate / campaign.openRate) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${(campaign.clickRate / campaign.openRate) * 100}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
