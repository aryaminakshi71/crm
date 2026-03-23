/**
 * CRM Overview Dashboard
 *
 * Pipeline stats, recent activities, and key metrics.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, LoadingSkeleton } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { dashboardApi, dealsApi } from "@/lib/api";
import { toast } from "sonner";
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
  CalendarClock,
  Flame,
  Star,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { useState } from "react";
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
  const queryClient = useQueryClient();

  // Mutation: create a new deal
  const createDealMutation = useMutation({
    mutationFn: (data: { name: string; value: number; stage?: string; notes?: string }) =>
      dealsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created successfully");
      navigate({ to: "/app/crm/deals" });
    },
    onError: () => toast.error("Failed to create deal"),
  });

  // Mutation: update deal stage
  const updateDealMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      dealsApi.update(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal stage updated");
    },
    onError: () => toast.error("Failed to update deal stage"),
  });

  // Fetch dashboard stats from real API
  const { data: dashboardStats, isLoading: statsLoading, isError: statsError, refetch: statsRefetch } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.getStats(),
  });

  // Fetch chart data from real API
  const { data: chartsData } = useQuery({
    queryKey: ["dashboard", "charts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/charts", {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Map API response to display values with safe fallbacks
  const stats = {
    totalLeads: dashboardStats?.totalContacts ?? 1247,
    newLeadsThisWeek: 89,
    leadsChange: dashboardStats?.contactsChange ?? 12.5,
    activeDeals: dashboardStats?.activeDeals ?? 156,
    dealsValue: 2450000,
    dealsChange: dashboardStats?.dealsChange ?? 8.2,
    wonDealsThisMonth: 23,
    wonValue: dashboardStats?.revenue ?? 892000,
    wonChange: dashboardStats?.revenueChange ?? 15.3,
    conversionRate: dashboardStats?.conversionRate ?? 3.2,
    conversionChange: dashboardStats?.conversionChange ?? 0.4,
  };

  // Static fallback pipeline data
  const PIPELINE_FALLBACK = [
    { name: "Lead", value: 450, color: "#818cf8" },
    { name: "Qualified", value: 280, color: "#a78bfa" },
    { name: "Proposal", value: 150, color: "#22d3ee" },
    { name: "Negotiation", value: 80, color: "#fbbf24" },
    { name: "Closed", value: 45, color: "#22c55e" },
  ];

  // Static fallback revenue data
  const REVENUE_FALLBACK = [
    { month: "Jan", revenue: 65000, target: 60000 },
    { month: "Feb", revenue: 72000, target: 70000 },
    { month: "Mar", revenue: 68000, target: 75000 },
    { month: "Apr", revenue: 85000, target: 80000 },
    { month: "May", revenue: 92000, target: 85000 },
    { month: "Jun", revenue: 98000, target: 90000 },
  ];

  // Use real data with fallback to existing mock
  const pipelineData = chartsData?.pipeline?.length ? chartsData.pipeline : PIPELINE_FALLBACK;
  const revenueData = chartsData?.revenue?.length ? chartsData.revenue : REVENUE_FALLBACK;

  // Use API recent activities, fall back to empty array (shown only when loaded)
  const recentActivities = (dashboardStats?.recentActivities ?? []).map((a: { id: string; type: string; message: string; time: string }) => ({
    id: a.id,
    type: a.type,
    title: a.message,
    time: a.time,
    user: "",
  }));

  const topDeals = [
    { id: "1", name: "Acme Corp Enterprise", value: 125000, stage: "Negotiation", probability: 75, owner: "SC", closeDate: "Mar 28" },
    { id: "2", name: "TechStart Solutions", value: 89000, stage: "Proposal", probability: 60, owner: "DP", closeDate: "Apr 5" },
    { id: "3", name: "Global Industries", value: 67000, stage: "Qualified", probability: 40, owner: "EZ", closeDate: "Apr 12" },
    { id: "4", name: "DataFlow Inc", value: 54000, stage: "Negotiation", probability: 80, owner: "SC", closeDate: "Mar 25" },
    { id: "5", name: "CloudSystems Ltd", value: 42000, stage: "Proposal", probability: 55, owner: "JL", closeDate: "Apr 8" },
  ];

  const todaysFocus = [
    { type: "call", label: "Discovery call with Lisa Wang", time: "10:00 AM", urgent: true },
    { type: "email", label: "Follow-up: Acme Corp proposal", time: "11:30 AM", urgent: true },
    { type: "deal", label: "DataFlow Inc — closing today", time: "End of day", urgent: true },
    { type: "meeting", label: "Demo with CloudSystems Ltd", time: "2:00 PM", urgent: false },
    { type: "task", label: "Update Q1 pipeline forecast", time: "EOD", urgent: false },
  ];

  const [logActivity, setLogActivity] = useState(false);
  const [activityType, setActivityType] = useState("call");

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (statsError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => statsRefetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Today's Focus Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-400">Today's Focus</span>
          <span className="ml-auto text-xs text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-2">
          {todaysFocus.map((item, i) => (
            <div key={i} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${item.urgent ? "border-amber-500/30 bg-amber-500/10" : "border-border bg-muted/20"}`}>
              {item.type === "call" && <Phone className="h-3 w-3 text-amber-400 shrink-0" />}
              {item.type === "email" && <Mail className="h-3 w-3 text-blue-400 shrink-0" />}
              {item.type === "deal" && <Star className="h-3 w-3 text-emerald-400 shrink-0" />}
              {item.type === "meeting" && <CalendarClock className="h-3 w-3 text-purple-400 shrink-0" />}
              {item.type === "task" && <CheckCircle2 className="h-3 w-3 text-muted-foreground shrink-0" />}
              <span className="text-foreground/80">{item.label}</span>
              <span className="text-muted-foreground ml-1 shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

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
                    {pipelineData.map((entry: { color: string }, index: number) => (
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
              {pipelineData.map((item: { name: string; value: number; color: string }) => (
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
            {recentActivities.map((activity: { id: string; type: string; title: string; time: string; user: string; name?: string; value?: string }) => (
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
          <CardContent className="space-y-2">
            {topDeals.map((deal) => (
              <Link
                key={deal.id}
                to={`/app/crm/deals/${deal.id}` as string}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 border border-transparent hover:border-border/60 transition-all group"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {deal.owner}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{deal.stage}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <CalendarClock className="h-2.5 w-2.5" /> {deal.closeDate}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${deal.probability >= 70 ? "bg-emerald-500" : deal.probability >= 50 ? "bg-amber-400" : "bg-blue-400"}`} style={{ width: `${deal.probability}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">{deal.probability}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    ${(deal.value / 1000).toFixed(0)}K
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          disabled={createDealMutation.isPending}
          onClick={() => {
            const name = prompt("Deal name:");
            const valueStr = prompt("Deal value ($):");
            if (name && valueStr) {
              const value = parseFloat(valueStr);
              if (!isNaN(value)) {
                createDealMutation.mutate({ name, value, stage: "lead" });
              }
            }
          }}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-sm font-medium">
            {createDealMutation.isPending ? "Creating..." : "Create Deal"}
          </span>
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
