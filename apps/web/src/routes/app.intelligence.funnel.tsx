import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, TrendingDown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_FUNNEL = {
  stages: [
    { name: "Visitors", count: 12400, conversion: 100 },
    { name: "Leads", count: 2480, conversion: 20 },
    { name: "Qualified", count: 744, conversion: 6 },
    { name: "Proposals", count: 298, conversion: 2.4 },
    { name: "Closed Won", count: 119, conversion: 0.96 },
  ],
  overallConversion: 0.96,
  avgDealCycle: 46,
};

const STAGE_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"];

export const Route = createFileRoute("/app/intelligence/funnel")({
  component: FunnelPage,
});

function FunnelPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "funnel"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/funnel`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_FUNNEL;
      return res.json();
    },
  });

  const funnel = data ?? MOCK_FUNNEL;
  const maxCount = funnel.stages?.[0]?.count ?? 1;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Funnel Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Visualize conversion across each stage of your pipeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Overall Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{funnel.overallConversion}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Avg Deal Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{funnel.avgDealCycle} days</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Funnel Stages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnel.stages?.map((stage: any, i: number) => {
              const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{stage.count.toLocaleString()} users</span>
                      <span className="font-semibold text-foreground">{stage.conversion}%</span>
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-700 flex items-center pl-3"
                      style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[i] }}
                    >
                      <span className="text-xs text-white font-medium truncate">{stage.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
