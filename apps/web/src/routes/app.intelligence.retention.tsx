import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UserCheck, UserMinus, UserPlus } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

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

export const Route = createFileRoute("/app/intelligence/retention")({
  component: RetentionPage,
});

function RetentionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "retention"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/retention`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_RETENTION;
      return res.json();
    },
  });

  const retention = data ?? MOCK_RETENTION;

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
            <p className="text-3xl font-bold">{retention.averageRetention}%</p>
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
              {retention.periods?.[retention.periods.length - 1]?.churned}%
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
              {retention.periods?.[retention.periods.length - 1]?.newCustomers}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Retention Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={retention.periods}>
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v: any, name: string) => [`${v}%`, name === "retained" ? "Retained" : "Churned"]} />
                <Area type="monotone" dataKey="retained" stroke="#10b981" fill="url(#retentionGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="churned" stroke="#f43f5e" fill="url(#churnGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
