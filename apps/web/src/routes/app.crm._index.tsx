/**
 * CRM Overview Dashboard
 *
 * Pipeline stats, recent activities, and key metrics.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, LoadingSkeleton } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  UserPlus,
  AlertCircle,
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

export const Route = createFileRoute("/app/crm/_index")({
  component: CrmOverview,
});

function CrmOverview() {
  const navigate = useNavigate();

  // Mock data for stats
  const stats = {
    totalLeads: 1247,
    newLeadsThisWeek: 89,
    leadsChange: 12.5,
    activeDeals: 156,
    dealsValue: 2450000,
    dealsChange: 8.2,
    wonDealsThisMonth: 23,
    wonValue: 892000,
    wonChange: 15.3,
    conversionRate: 3.2,
    conversionChange: 0.4,
  };

  const pipelineData = [
    { name: "Lead", value: 450, color: "#818cf8" },
    { name: "Qualified", value: 280, color: "#a78bfa" },
    { name: "Proposal", value: 150, color: "#22d3ee" },
    { name: "Negotiation", value: 80, color: "#fbbf24" },
    { name: "Closed", value: 45, color: "#22c55e" },
  ];

  const revenueData = [
    { month: "Jan", revenue: 65000, target: 60000 },
    { month: "Feb", revenue: 72000, target: 70000 },
    { month: "Mar", revenue: 68000, target: 75000 },
    { month: "Apr", revenue: 85000, target: 80000 },
    { month: "May", revenue: 92000, target: 85000 },
    { month: "Jun", revenue: 98000, target: 90000 },
  ];

  const recentActivities = [
    {
      id: "1",
      type: "deal_won",
      title: "Deal closed with Acme Corp",
      value: "$45,000",
      time: "2 hours ago",
      user: "Sarah Chen",
    },
    {
      id: "2",
      type: "lead_created",
      title: "New lead from website",
      name: "Michael Torres",
      time: "4 hours ago",
      user: "System",
    },
    {
      id: "3",
      type: "email_sent",
      title: "Sequence email sent",
      name: "Jennifer Wu",
      time: "5 hours ago",
      user: "Sales Team",
    },
    {
      id: "4",
      type: "call_completed",
      title: "Discovery call completed",
      name: "Robert Kim",
      time: "6 hours ago",
      user: "David Park",
    },
    {
      id: "5",
      type: "meeting_scheduled",
      title: "Demo scheduled",
      name: "Lisa Wang",
      time: "8 hours ago",
      user: "Emily Zhang",
    },
  ];

  const topDeals = [
    { id: "1", name: "Acme Corp Enterprise", value: 125000, stage: "Negotiation", probability: 75 },
    { id: "2", name: "TechStart Solutions", value: 89000, stage: "Proposal", probability: 60 },
    { id: "3", name: "Global Industries", value: 67000, stage: "Qualified", probability: 40 },
    { id: "4", name: "DataFlow Inc", value: 54000, stage: "Negotiation", probability: 80 },
    { id: "5", name: "CloudSystems Ltd", value: 42000, stage: "Proposal", probability: 55 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Total Leads
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.totalLeads.toLocaleString()}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.leadsChange}% from last week
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Active Deals
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.activeDeals}</p>
                <p className="text-foreground text-xs mt-1">
                  ${(stats.dealsValue / 1000000).toFixed(1)}M pipeline
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Won This Month
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.wonDealsThisMonth}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${(stats.wonValue / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Conversion Rate
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.conversionRate}%</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.conversionChange}% from last month
                </p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2172cd" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2172cd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2172cd"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Breakdown */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pipeline Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pipelineData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Link
                to="/app/crm/activities"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="rounded-full bg-muted p-2 mt-0.5">
                  {activity.type === "deal_won" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {activity.type === "lead_created" && <UserPlus className="h-4 w-4 text-blue-600" />}
                  {activity.type === "email_sent" && <Mail className="h-4 w-4 text-purple-600" />}
                  {activity.type === "call_completed" && <Phone className="h-4 w-4 text-orange-600" />}
                  {activity.type === "meeting_scheduled" && <Clock className="h-4 w-4 text-pink-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  {activity.name && (
                    <p className="text-xs text-muted-foreground">{activity.name}</p>
                  )}
                  {activity.value && (
                    <p className="text-xs text-green-600 font-medium">{activity.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time} · {activity.user}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Deals */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Deals</CardTitle>
              <Link
                to="/app/crm/deals"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDeals.map((deal) => (
              <Link
                key={deal.id}
                to={`/app/crm/deals/${deal.id}` as string}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                  <p className="text-xs text-muted-foreground">{deal.stage}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    ${(deal.value / 1000).toFixed(0)}K
                  </p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate({ to: "/app/crm/contacts", search: { action: "create" } })}
        >
          <UserPlus className="h-5 w-5" />
          <span className="text-sm font-medium">Add Contact</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate({ to: "/app/crm/leads", search: { action: "create" } })}
        >
          <Target className="h-5 w-5" />
          <span className="text-sm font-medium">New Lead</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate({ to: "/app/crm/deals", search: { action: "create" } })}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-sm font-medium">Create Deal</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate({ to: "/app/crm/sequences", search: { action: "create" } })}
        >
          <Mail className="h-5 w-5" />
          <span className="text-sm font-medium">Email Sequence</span>
        </Button>
      </div>
    </div>
  );
}
