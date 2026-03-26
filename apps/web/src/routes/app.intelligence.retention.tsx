import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, UserCheck, UserMinus, UserPlus } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { intelligenceApi } from "@/lib/api";

const MOCK_RETENTION = {
  periods: [
    { period: "Jan 2025", retained: 89.2, churned: 10.8, newCustomers: 42 },
    { period: "Feb 2025", retained: 91.4, churned: 8.6, newCustomers: 38 },
    { period: "Mar 2025", retained: 88.7, churned: 11.3, newCustomers: 55 },
    { period: "Apr 2025", retained: 92.1, churned: 7.9, newCustomers: 61 },
    { period: "May 2025", retained: 90.5, churned: 9.5, newCustomers: 49 },
  ],
  averageRetention: 90.4,
  trend: "stable",
};

// Cohort retention curves — % of original cohort remaining at each month
const COHORT_CURVES = [
  { month: "M0",  jan: 100, feb: 100, mar: 100, apr: 100, may: 100 },
  { month: "M1",  jan: 78,  feb: 81,  mar: 76,  apr: 83,  may: 80 },
  { month: "M2",  jan: 62,  feb: 67,  mar: 61,  apr: 71,  may: 65 },
  { month: "M3",  jan: 54,  feb: 59,  mar: null, apr: 64,  may: null },
  { month: "M4",  jan: 48,  feb: null, mar: null, apr: null, may: null },
];

// Extended retention with new-customer overlay
const EXTENDED_PERIODS = [
  { period: "Aug '24", retained: 87.4, churned: 12.6, newCustomers: 34 },
  { period: "Sep '24", retained: 89.1, churned: 10.9, newCustomers: 39 },
  { period: "Oct '24", retained: 90.8, churned: 9.2,  newCustomers: 47 },
  { period: "Nov '24", retained: 88.3, churned: 11.7, newCustomers: 41 },
  { period: "Dec '24", retained: 85.6, churned: 14.4, newCustomers: 36 },
  { period: "Jan '25", retained: 89.2, churned: 10.8, newCustomers: 42 },
  { period: "Feb '25", retained: 91.4, churned: 8.6,  newCustomers: 38 },
  { period: "Mar '25", retained: 88.7, churned: 11.3, newCustomers: 55 },
  { period: "Apr '25", retained: 92.1, churned: 7.9,  newCustomers: 61 },
  { period: "May '25", retained: 90.5, churned: 9.5,  newCustomers: 49 },
];

const COHORT_COLORS: Record<string, string> = {
  jan: "#6366f1",
  feb: "#10b981",
  mar: "#f59e0b",
  apr: "#3b82f6",
  may: "#ec4899",
};

const COHORT_LABELS: Record<string, string> = {
  jan: "Jan '25",
  feb: "Feb '25",
  mar: "Mar '25",
  apr: "Apr '25",
  may: "May '25",
};

export const Route = createFileRoute("/app/intelligence/retention")({
  component: RetentionPage,
});

function RetentionPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "retention"],
    queryFn: () => intelligenceApi.retention.get(),
    placeholderData: (prev) => prev,
    refetchInterval: 30000,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const retention = data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Retention Metrics</h1>
        <p className="text-muted-foreground mt-1">
          Monitor how well you retain customers over time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Avg Retention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(retention as any).averageRetention}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserMinus className="h-4 w-4" />
              Latest Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(retention as any).periods?.[(retention as any).periods.length - 1]?.churned}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(retention as any).periods?.[(retention as any).periods.length - 1]?.newCustomers}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <>
          {/* Existing: Retention + Churn area chart (extended 10 months) */}
          <Card>
            <CardHeader>
              <CardTitle>Retained vs Churned — 10-Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={EXTENDED_PERIODS}>
                  <defs>
                    <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v: any, name: string) => [`${v}%`, name === "retained" ? "Retained" : "Churned"]} />
                  <Area type="monotone" dataKey="retained" stroke="#10b981" fill="url(#retentionGrad)" strokeWidth={2} name="Retained" />
                  <Area type="monotone" dataKey="churned" stroke="#f43f5e" fill="url(#churnGrad)" strokeWidth={2} name="Churned" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* New: Cohort retention curves by cohort */}
          <Card>
            <CardHeader>
              <CardTitle>Retention Curves by Cohort</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                % of original cohort still active at each month since acquisition.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={COHORT_CURVES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                    formatter={(v: any, name: string) => [v !== null ? `${v}%` : "N/A", COHORT_LABELS[name] ?? name]}
                  />
                  {Object.entries(COHORT_COLORS).map(([key, color]) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls={false}
                      name={key}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-5 mt-3">
                {Object.entries(COHORT_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-muted-foreground">{COHORT_LABELS[key]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* New customers overlay */}
          <Card>
            <CardHeader>
              <CardTitle>New Customer Acquisition — Monthly</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={EXTENDED_PERIODS}>
                  <defs>
                    <linearGradient id="newCustGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                    formatter={(v: any) => [v, "New Customers"]}
                  />
                  <Area type="monotone" dataKey="newCustomers" stroke="#6366f1" fill="url(#newCustGrad)" strokeWidth={2} name="New Customers" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
