import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, AlertOctagon, DollarSign, Mail, Phone, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

// Churn by segment bar chart data
const CHURN_BY_SEGMENT = [
  { segment: "Starter",    churnRate: 9.4, count: 38, color: "#6366f1" },
  { segment: "Pro",        churnRate: 5.8, count: 21, color: "#3b82f6" },
  { segment: "Business",   churnRate: 3.2, count: 9,  color: "#10b981" },
  { segment: "Enterprise", churnRate: 1.1, count: 3,  color: "#f59e0b" },
];

// Churn by reason
const CHURN_BY_REASON = [
  { reason: "Price",         count: 34, color: "#f43f5e" },
  { reason: "Competitor",    count: 22, color: "#f97316" },
  { reason: "Lack of Use",   count: 19, color: "#eab308" },
  { reason: "Missing Feature", count: 14, color: "#6366f1" },
  { reason: "Support",       count: 8,  color: "#8b5cf6" },
  { reason: "Other",         count: 5,  color: "#6b7280" },
];

// 12-month churn rate trend
const CHURN_TREND = [
  { month: "Apr '24", rate: 7.2 },
  { month: "May '24", rate: 6.9 },
  { month: "Jun '24", rate: 7.5 },
  { month: "Jul '24", rate: 6.8 },
  { month: "Aug '24", rate: 6.4 },
  { month: "Sep '24", rate: 6.1 },
  { month: "Oct '24", rate: 5.9 },
  { month: "Nov '24", rate: 6.3 },
  { month: "Dec '24", rate: 6.7 },
  { month: "Jan '25", rate: 6.0 },
  { month: "Feb '25", rate: 5.9 },
  { month: "Mar '25", rate: 5.8 },
];

export const Route = createFileRoute("/app/intelligence/churn")({
  component: ChurnPage,
});

function riskBadge(prob: number) {
  if (prob >= 0.8) return "destructive";
  if (prob >= 0.6) return "secondary";
  return "outline";
}

function riskLabel(prob: number) {
  if (prob >= 0.8) return "Critical";
  if (prob >= 0.6) return "High";
  return "Medium";
}

function ChurnPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "churn"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/churn`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return null;
      return res.json();
    },
    placeholderData: (prev) => prev,
    refetchInterval: 30000,
  });

  const churn = data ?? [];

  const outreachMutation = useMutation({
    mutationFn: async ({ customerId, channel }: { customerId: string; channel: "email" | "call" }) => {
      const res = await fetch(`${API_BASE}/v1/intelligence/churn/${customerId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ channel }),
      });
      if (!res.ok) throw new Error("Failed to schedule outreach");
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.channel === "email" ? "Email" : "Call"} outreach scheduled`);
      queryClient.invalidateQueries({ queryKey: ["intelligence", "churn"] });
    },
    onError: () => toast.error("Failed to schedule outreach"),
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Churn Prediction</h1>
        <p className="text-muted-foreground mt-1">
          Identify customers at risk of churning before they leave.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" />
              Overall Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(churn as any).overallChurnRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              High Risk Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(churn as any).highRiskCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              At-Risk MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(churn as any).predictedChurnedRevenue?.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Churn rate by segment */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Rate by Plan Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={CHURN_BY_SEGMENT} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.15)" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 12]} />
                <YAxis type="category" dataKey="segment" tick={{ fontSize: 12 }} width={72} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                  formatter={(v: any) => [`${v}%`, "Churn Rate"]}
                />
                <Bar dataKey="churnRate" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="churnRate" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                  {CHURN_BY_SEGMENT.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn by reason */}
        <Card>
          <CardHeader>
            <CardTitle>Churn by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={CHURN_BY_REASON}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                  formatter={(v: any) => [v, "Churned Customers"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {CHURN_BY_REASON.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 12-month churn trend line */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Churn Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={CHURN_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[4, 10]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                formatter={(v: any) => [`${v}%`, "Churn Rate"]}
              />
              <Line type="monotone" dataKey="rate" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: "#f43f5e" }} name="Churn Rate" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* At-risk customers with outreach actions */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>At-Risk Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((churn as any).customers ?? []).map((customer: any) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.plan} · Last active: {customer.lastActivity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">${customer.mrr}/mo</span>
                    <Badge variant={riskBadge(customer.churnProbability) as any}>
                      {riskLabel(customer.churnProbability)} ({Math.round(customer.churnProbability * 100)}%)
                    </Badge>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={outreachMutation.isPending}
                        onClick={() => outreachMutation.mutate({ customerId: customer.id, channel: "email" })}
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={outreachMutation.isPending}
                        onClick={() => outreachMutation.mutate({ customerId: customer.id, channel: "call" })}
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
