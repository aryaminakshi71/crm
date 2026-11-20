import { Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, DollarSign, Users,
  AlertCircle
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { intelligenceApi } from "@/lib/api";

// CLV distribution over time (12-month area chart)
const CLV_DISTRIBUTION_TREND = [
  { month: "Apr", champions: 7200, loyal: 3800, atRisk: 1600, dormant: 550 },
  { month: "May", champions: 7500, loyal: 3900, atRisk: 1650, dormant: 560 },
  { month: "Jun", champions: 7700, loyal: 3950, atRisk: 1700, dormant: 570 },
  { month: "Jul", champions: 7900, loyal: 4000, atRisk: 1720, dormant: 575 },
  { month: "Aug", champions: 8000, loyal: 4050, atRisk: 1740, dormant: 580 },
  { month: "Sep", champions: 8100, loyal: 4080, atRisk: 1760, dormant: 585 },
  { month: "Oct", champions: 8150, loyal: 4100, atRisk: 1780, dormant: 590 },
  { month: "Nov", champions: 8200, loyal: 4120, atRisk: 1790, dormant: 595 },
  { month: "Dec", champions: 8250, loyal: 4140, atRisk: 1800, dormant: 598 },
  { month: "Jan", champions: 8300, loyal: 4160, atRisk: 1800, dormant: 600 },
  { month: "Feb", champions: 8350, loyal: 4180, atRisk: 1800, dormant: 600 },
  { month: "Mar", champions: 8400, loyal: 4200, atRisk: 1800, dormant: 600 },
];

// Scatter plot: tenure (months) vs CLV, sized by purchase count
const CLV_SCATTER_DATA = [
  { tenure: 4, clv: 1200, purchases: 5, segment: "At Risk" },
  { tenure: 6, clv: 1800, purchases: 8, segment: "At Risk" },
  { tenure: 8, clv: 2200, purchases: 10, segment: "Loyal" },
  { tenure: 10, clv: 2900, purchases: 13, segment: "Loyal" },
  { tenure: 12, clv: 3400, purchases: 16, segment: "Loyal" },
  { tenure: 15, clv: 4100, purchases: 19, segment: "Loyal" },
  { tenure: 18, clv: 5200, purchases: 23, segment: "Champions" },
  { tenure: 22, clv: 6400, purchases: 29, segment: "Champions" },
  { tenure: 26, clv: 7800, purchases: 33, segment: "Champions" },
  { tenure: 30, clv: 9200, purchases: 37, segment: "Champions" },
  { tenure: 36, clv: 11000, purchases: 42, segment: "Champions" },
  { tenure: 40, clv: 14000, purchases: 51, segment: "Champions" },
  { tenure: 2, clv: 400, purchases: 2, segment: "Dormant" },
  { tenure: 5, clv: 600, purchases: 3, segment: "Dormant" },
  { tenure: 9, clv: 700, purchases: 4, segment: "Dormant" },
];

const SEGMENT_COLORS: Record<string, string> = {
  Champions: "#10b981",
  Loyal: "#3b82f6",
  "At Risk": "#f59e0b",
  Dormant: "#6b7280",
};

export const Route = createFileRoute("/app/intelligence/clv")({
  component: ClvPage,
});

function ClvPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["intelligence", "clv"],
    queryFn: () => intelligenceApi.clv.get(),
    placeholderData: (prev) => prev,
    refetchInterval: 30000,
  });

  const clv = data ?? [];

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Lifetime Value</h1>
        <p className="text-muted-foreground mt-1">
          Understand the long-term value of your customer segments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Average CLV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(clv as any).averageClv?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(clv as any).segments?.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Top Customer CLV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(clv as any).topCustomers?.[0]?.clv?.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <>
          {/* Row 1: existing bar + top customers */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Avg CLV by Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={(clv as any).segments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Avg CLV"]} />
                    <Bar dataKey="avgClv" radius={[4, 4, 0, 0]}>
                      {(clv as any).segments?.map((seg: any, i: number) => (
                        <Cell key={i} fill={seg.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(clv as any).topCustomers?.map((customer: any, i: number) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.purchases} purchases · {customer.tenure}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600">${customer.clv.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: AreaChart CLV distribution over time */}
          <Card>
            <CardHeader>
              <CardTitle>CLV Distribution by Segment — 12-Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={CLV_DISTRIBUTION_TREND}>
                  <defs>
                    {[
                      { id: "champGrad", color: "#10b981" },
                      { id: "loyalGrad", color: "#3b82f6" },
                      { id: "atRiskGrad", color: "#f59e0b" },
                      { id: "dormantGrad", color: "#6b7280" },
                    ].map(({ id, color }) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                    formatter={(v: any, name: string) => [`$${Number(v).toLocaleString()}`, name]}
                  />
                  <Area type="monotone" dataKey="champions" stroke="#10b981" fill="url(#champGrad)" strokeWidth={2} name="Champions" />
                  <Area type="monotone" dataKey="loyal" stroke="#3b82f6" fill="url(#loyalGrad)" strokeWidth={2} name="Loyal" />
                  <Area type="monotone" dataKey="atRisk" stroke="#f59e0b" fill="url(#atRiskGrad)" strokeWidth={2} name="At Risk" />
                  <Area type="monotone" dataKey="dormant" stroke="#6b7280" fill="url(#dormantGrad)" strokeWidth={1.5} name="Dormant" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-5 mt-3">
                {[
                  { label: "Champions", color: "#10b981" },
                  { label: "Loyal", color: "#3b82f6" },
                  { label: "At Risk", color: "#f59e0b" },
                  { label: "Dormant", color: "#6b7280" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Row 3: Scatter plot — tenure vs CLV */}
          <Card>
            <CardHeader>
              <CardTitle>Tenure vs CLV Scatter (bubble = purchase count)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis
                    type="number"
                    dataKey="tenure"
                    name="Tenure (months)"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Tenure (months)", position: "insideBottom", offset: -4, fontSize: 11, fill: "#888" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="clv"
                    name="CLV"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <ZAxis type="number" dataKey="purchases" range={[40, 300]} name="Purchases" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                    formatter={(v: any, name: string) => [
                      name === "CLV" ? `$${Number(v).toLocaleString()}` : v,
                      name,
                    ]}
                  />
                  {Object.entries(SEGMENT_COLORS).map(([segment, color]) => (
                    <Scatter
                      key={segment}
                      name={segment}
                      data={CLV_SCATTER_DATA.filter((d) => d.segment === segment)}
                      fill={color}
                      fillOpacity={0.8}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-5 mt-3">
                {Object.entries(SEGMENT_COLORS).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
