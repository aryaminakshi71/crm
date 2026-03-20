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
  Cpu,
  DollarSign,
  Mail,
  MousePointerClick,
  Plus,
  Send,
  Target,
  TrendingUp,
  Users,
  Video,
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

const recentCampaigns = [
  { id: "1", name: "Spring Sale 2026", status: "active", sent: 25000, openRate: 34.2, clickRate: 5.8 },
  { id: "2", name: "Product Launch - Series X", status: "active", sent: 18000, openRate: 41.5, clickRate: 8.2 },
  { id: "3", name: "Customer Retention Q1", status: "paused", sent: 32000, openRate: 28.7, clickRate: 4.1 },
  { id: "4", name: "Newsletter Weekly", status: "active", sent: 45000, openRate: 22.1, clickRate: 3.5 },
];

function MarketingDashboard() {
  return (
    <div className="space-y-6">
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
            <Link to="/app/marketing/campaigns">
              <Button size="sm" variant="ghost" rightIcon={<TrendingUp className="h-3 w-3" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.sent.toLocaleString()} sent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-medium">{campaign.openRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Open rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{campaign.clickRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Click rate</p>
                    </div>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link to="/app/marketing/campaigns">
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
        </Link>
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
