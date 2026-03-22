import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon, DollarSign, Users } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_CHURN = {
  customers: [
    { id: "c-1", name: "Acme Corp", churnProbability: 0.87, lastActivity: "14 days ago", plan: "Pro", mrr: 499 },
    { id: "c-2", name: "Globex Inc", churnProbability: 0.72, lastActivity: "8 days ago", plan: "Starter", mrr: 99 },
    { id: "c-3", name: "Initech Ltd", churnProbability: 0.64, lastActivity: "21 days ago", plan: "Enterprise", mrr: 1299 },
    { id: "c-4", name: "Umbrella Co", churnProbability: 0.51, lastActivity: "5 days ago", plan: "Pro", mrr: 499 },
  ],
  overallChurnRate: 5.8,
  highRiskCount: 4,
  predictedChurnedRevenue: 2396,
};

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
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "churn"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/churn`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_CHURN;
      return res.json();
    },
  });

  const churn = data ?? MOCK_CHURN;

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
            <p className="text-3xl font-bold">{churn.overallChurnRate}%</p>
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
            <p className="text-3xl font-bold">{churn.highRiskCount}</p>
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
            <p className="text-3xl font-bold">${churn.predictedChurnedRevenue?.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

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
              {(churn.customers ?? []).map((customer: any) => (
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
