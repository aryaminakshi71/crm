import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  DollarSign,
  Mail,
  RefreshCw,
  Search,
  TrendingDown,
  Users,
} from "lucide-react";
import { z } from "zod";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { intelligenceApi } from "@/lib/api";

const churnTrend = [
  { month: "Oct", rate: 4.2 }, { month: "Nov", rate: 3.8 }, { month: "Dec", rate: 5.1 },
  { month: "Jan", rate: 4.5 }, { month: "Feb", rate: 3.9 }, { month: "Mar", rate: 3.4 },
];

const riskData = [
  { name: "High Risk", value: 127, color: "#ef4444" },
  { name: "Medium Risk", value: 284, color: "#f59e0b" },
  { name: "Low Risk", value: 891, color: "#22c55e" },
];

const searchSchema = z.object({
  q: z.string().optional(),
  riskLevel: z.enum(["all", "high", "medium", "low"]).optional(),
});

export const Route = createFileRoute("/app/intelligence/churn/_index")({
  validateSearch: searchSchema,
  component: ChurnPage,
});

function getRiskColor(prob: number): string {
  if (prob >= 80) return "bg-red-500/10 text-red-400 border-red-500/30";
  if (prob >= 50) return "bg-orange-500/10 text-orange-400 border-orange-500/30";
  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
}

function getRiskLabel(prob: number): string {
  if (prob >= 80) return "High Risk";
  if (prob >= 50) return "Medium Risk";
  return "Low Risk";
}

function getRiskRowClass(prob: number): string {
  if (prob >= 80) return "bg-red-500/5 hover:bg-red-500/10";
  if (prob >= 50) return "bg-orange-500/5 hover:bg-orange-500/10";
  return "hover:bg-muted/30";
}

function ChurnPage() {
  const { q = "", riskLevel = "all" } = useSearch({ from: "/app/intelligence/churn/_index" });
  const navigate = useNavigate({ from: "/app/intelligence/churn/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setRiskLevel = (v: string) => navigate({ search: (p) => ({ ...p, riskLevel: v === "all" ? undefined : v as any }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "churn"],
    queryFn: () => intelligenceApi.churn.get(),
  });

  const contactMutation = useMutation({
    mutationFn: (customerId: string) =>
      fetch(`/api/v1/contacts/${customerId}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify({ reason: "churn_prevention" }),
      }).then((r) => r.json()),
  });

  const churnData: any = data ?? {};
  const customers: any[] =
    churnData.customers ??
    churnData.data ??
    (Array.isArray(churnData) ? churnData : []);

  const highRisk = customers.filter(
    (c) => (c.churnProbability ?? c.riskScore ?? 0) >= 80,
  );
  const mrrAtRisk = customers.reduce(
    (sum, c) => sum + (c.mrr ?? c.mrrAtRisk ?? 0),
    0,
  );
  const avgProb =
    customers.length > 0
      ? (
          customers.reduce(
            (sum, c) => sum + (c.churnProbability ?? c.riskScore ?? 0),
            0,
          ) / customers.length
        ).toFixed(1)
      : "0";

  const stats = [
    {
      label: "High Risk Customers",
      value: highRisk.length,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      label: "MRR at Risk",
      value: `$${mrrAtRisk.toLocaleString()}`,
      icon: DollarSign,
      color: "text-orange-400",
    },
    {
      label: "Avg Churn Probability",
      value: `${avgProb}%`,
      icon: TrendingDown,
      color: "text-yellow-400",
    },
    {
      label: "Total Monitored",
      value: customers.length,
      icon: Users,
      color: "text-blue-400",
    },
  ];

  const filteredCustomers = customers
    .filter((c) => {
      const prob = c.churnProbability ?? c.riskScore ?? 0;
      const matchesRisk =
        riskLevel === "all" ||
        (riskLevel === "high" && prob >= 80) ||
        (riskLevel === "medium" && prob >= 50 && prob < 80) ||
        (riskLevel === "low" && prob < 50);
      const matchesQ =
        !q ||
        (c.name ?? c.companyName ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(q.toLowerCase());
      return matchesRisk && matchesQ;
    });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load churn data.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Churn Prediction</h1>
          <p className="text-muted-foreground mt-1">
            Identify customers at risk of churning before it happens
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search customers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All risk levels</option>
          <option value="high">High Risk (≥80%)</option>
          <option value="medium">Medium Risk (50–79%)</option>
          <option value="low">Low Risk (&lt;50%)</option>
        </select>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts: Churn Risk Distribution + Churn Rate Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Churn Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      customers.length > 0
                        ? [
                            {
                              name: "High Risk",
                              value: customers.filter((c) => (c.churnProbability ?? c.riskScore ?? 0) >= 80).length,
                              color: "#ef4444",
                            },
                            {
                              name: "Medium Risk",
                              value: customers.filter((c) => {
                                const p = c.churnProbability ?? c.riskScore ?? 0;
                                return p >= 50 && p < 80;
                              }).length,
                              color: "#f59e0b",
                            },
                            {
                              name: "Low Risk",
                              value: customers.filter((c) => (c.churnProbability ?? c.riskScore ?? 0) < 50).length,
                              color: "#22c55e",
                            },
                          ]
                        : riskData
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {(customers.length > 0
                      ? [
                          { color: "#ef4444" },
                          { color: "#f59e0b" },
                          { color: "#22c55e" },
                        ]
                      : riskData
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(v: number) => [v.toLocaleString(), "Customers"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Churn Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={churnTrend}>
                  <defs>
                    <linearGradient id="gradChurn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} stroke="#888" />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    stroke="#888"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(v: number) => [`${v}%`, "Churn Rate"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#ef4444"
                    fill="url(#gradChurn)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ef4444" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">At-Risk Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded bg-muted" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <AlertTriangle className="h-8 w-8" />
              <p className="text-sm">{q || riskLevel !== "all" ? "No customers match your filters." : "No at-risk customers identified."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Churn %</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Level</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Factors</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Last Activity</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">MRR at Risk</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers
                    .sort(
                      (a, b) =>
                        (b.churnProbability ?? b.riskScore ?? 0) -
                        (a.churnProbability ?? a.riskScore ?? 0),
                    )
                    .map((customer) => {
                      const prob =
                        customer.churnProbability ?? customer.riskScore ?? 0;
                      const factors: string[] = Array.isArray(customer.riskFactors)
                        ? customer.riskFactors
                        : customer.riskFactors
                          ? [customer.riskFactors]
                          : [];
                      const lastActivity =
                        customer.lastActivity ?? customer.daysSinceActivity;
                      const mrr = customer.mrr ?? customer.mrrAtRisk ?? 0;
                      return (
                        <tr
                          key={customer.id}
                          className={`border-b border-border/50 transition-colors ${getRiskRowClass(prob)}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {customer.name ?? customer.companyName ?? "Unknown"}
                            </div>
                            {customer.email && (
                              <div className="text-xs text-muted-foreground">
                                {customer.email}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-bold ${
                                prob >= 80
                                  ? "text-red-400"
                                  : prob >= 50
                                    ? "text-orange-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {Number(prob).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={getRiskColor(prob)}>
                              {getRiskLabel(prob)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 max-w-[180px]">
                            {factors.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {factors.slice(0, 2).map((f, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs bg-muted text-muted-foreground"
                                  >
                                    {f}
                                  </Badge>
                                ))}
                                {factors.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{factors.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                            {typeof lastActivity === "number"
                              ? `${lastActivity} days ago`
                              : lastActivity
                                ? new Date(lastActivity).toLocaleDateString()
                                : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {mrr > 0 ? `$${mrr.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                contactMutation.mutate(customer.id)
                              }
                              disabled={contactMutation.isPending}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
