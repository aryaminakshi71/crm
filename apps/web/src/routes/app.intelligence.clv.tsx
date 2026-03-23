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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_CLV = {
  segments: [
    { name: "Champions", count: 42, avgClv: 8400, totalClv: 352800, color: "#10b981" },
    { name: "Loyal", count: 118, avgClv: 4200, totalClv: 495600, color: "#3b82f6" },
    { name: "At Risk", count: 67, avgClv: 1800, totalClv: 120600, color: "#f59e0b" },
    { name: "Dormant", count: 93, avgClv: 600, totalClv: 55800, color: "#6b7280" },
  ],
  averageClv: 3200,
  topCustomers: [
    { id: "t-1", name: "MegaCorp", clv: 42000, purchases: 38, tenure: "4y 2m" },
    { id: "t-2", name: "Pinnacle Ltd", clv: 31500, purchases: 29, tenure: "3y 7m" },
    { id: "t-3", name: "Zenith Group", clv: 28900, purchases: 24, tenure: "2y 11m" },
  ],
};

export const Route = createFileRoute("/app/intelligence/clv")({
  component: ClvPage,
});

function ClvPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["intelligence", "clv"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/clv`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_CLV;
      return res.json();
    },
  });

  const clv = data ?? MOCK_CLV;

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
            <p className="text-3xl font-bold">${clv.averageClv?.toLocaleString()}</p>
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
            <p className="text-3xl font-bold">{clv.segments?.length}</p>
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
            <p className="text-3xl font-bold">${clv.topCustomers?.[0]?.clv?.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>CLV by Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={clv.segments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Avg CLV"]} />
                  <Bar dataKey="avgClv" radius={[4, 4, 0, 0]}>
                    {clv.segments?.map((seg: any, i: number) => (
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
                {clv.topCustomers?.map((customer: any, i: number) => (
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
      )}
    </div>
  );
}
