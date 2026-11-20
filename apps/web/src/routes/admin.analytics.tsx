import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Users, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

const MOCK_MRR_TREND = [
  { month: "Oct '25", mrr: 28400 },
  { month: "Nov '25", mrr: 31200 },
  { month: "Dec '25", mrr: 34800 },
  { month: "Jan '26", mrr: 38100 },
  { month: "Feb '26", mrr: 42600 },
  { month: "Mar '26", mrr: 45680 },
];

const MOCK_NEW_ORGS = [
  { month: "Oct '25", orgs: 8 },
  { month: "Nov '25", orgs: 12 },
  { month: "Dec '25", orgs: 7 },
  { month: "Jan '26", orgs: 15 },
  { month: "Feb '26", orgs: 19 },
  { month: "Mar '26", orgs: 11 },
];

const MOCK_ACTIVE_USERS = [
  { month: "Oct '25", users: 412 },
  { month: "Nov '25", users: 489 },
  { month: "Dec '25", users: 521 },
  { month: "Jan '26", users: 598 },
  { month: "Feb '26", users: 634 },
  { month: "Mar '26", users: 671 },
];

const MOCK_KEY_METRICS = {
  mrrGrowth: 7.2,
  churnRate: 1.8,
  npsScore: 62,
  trialConversion: 34,
};

function MetricCard({
  label,
  value,
  suffix,
  trend,
  trendUp,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  trend?: string;
  trendUp?: boolean;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
              {label}
            </p>
            <p className={`font-black text-3xl mt-1 ${color}`}>
              {value}
              {suffix && (
                <span className="text-base font-semibold ml-0.5">{suffix}</span>
              )}
            </p>
            {trend && (
              <div
                className={`flex items-center gap-1 mt-1 text-xs ${trendUp ? "text-green-600" : "text-red-600"}`}
              >
                {trendUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend}
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace("text-", "bg-")}/10`}>
            <Icon className={`h-6 w-6 ${color} opacity-60`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminAnalyticsPage() {
  const { data: apiData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) return null;
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const mrrTrend = (apiData as any)?.mrrTrend ?? [];
  const newOrgs = (apiData as any)?.newOrgs ?? [];
  const activeUsers = (apiData as any)?.activeUsers ?? [];
  const keyMetrics = (apiData as any)?.keyMetrics ?? {};

  const currentMRR = mrrTrend[mrrTrend.length - 1]?.mrr ?? 0;
  const prevMRR = mrrTrend[mrrTrend.length - 2]?.mrr ?? 0;
  const mrrDelta = prevMRR > 0 ? (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-2xl text-foreground flex items-center gap-2">
          <BarChart3 className="h-7 w-7" />
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          Platform-wide growth metrics and business intelligence
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="MRR Growth"
          value={keyMetrics.mrrGrowth}
          suffix="%"
          trend="vs last month"
          trendUp={keyMetrics.mrrGrowth > 0}
          icon={TrendingUp}
          color="text-emerald-600"
        />
        <MetricCard
          label="Churn Rate"
          value={keyMetrics.churnRate}
          suffix="%"
          trend="monthly churn"
          trendUp={false}
          icon={TrendingDown}
          color="text-red-600"
        />
        <MetricCard
          label="NPS Score"
          value={keyMetrics.npsScore}
          trend="promoters vs detractors"
          trendUp={keyMetrics.npsScore > 50}
          icon={Users}
          color="text-blue-600"
        />
        <MetricCard
          label="Trial Conversion"
          value={keyMetrics.trialConversion}
          suffix="%"
          trend="trial to paid"
          trendUp={keyMetrics.trialConversion > 25}
          icon={BarChart3}
          color="text-purple-600"
        />
      </div>

      {/* MRR Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>MRR Trend</CardTitle>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600">
                ${currentMRR.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                +{mrrDelta}% from last month
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mrrTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "MRR"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#mrrGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Orgs */}
        <Card>
          <CardHeader>
            <CardTitle>New Organizations per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newOrgs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: any) => [v, "New Orgs"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="orgs" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Users Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Active Users Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={activeUsers} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: any) => [v, "Active Users"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
