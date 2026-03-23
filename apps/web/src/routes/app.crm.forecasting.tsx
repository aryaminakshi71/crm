import { Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign, Target, TrendingUp,
  AlertCircle
} from "lucide-react";
import { useMemo } from "react";
import { dealsApi } from "../lib/api";

export const Route = createFileRoute("/app/crm/forecasting")({
  component: CrmForecastingPage,
});

const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const STAGE_PROBABILITY: Record<string, number> = {
  lead: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};
const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

function CrmForecastingPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["crm-deals-forecast"],
    queryFn: () => dealsApi.list({ page: 1, limit: 200 }),
  });

  const deals = (data?.data as any[]) ?? [];

  const stats = useMemo(() => {
    const totalPipeline = deals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
    const weightedForecast = deals.reduce((s: number, d: any) => {
      const prob = d.probability ?? STAGE_PROBABILITY[d.stage] ?? 0;
      return s + (Number(d.value || 0) * prob) / 100;
    }, 0);
    const wonRevenue = deals
      .filter((d: any) => d.stage === "won")
      .reduce((s: number, d: any) => s + Number(d.value || 0), 0);
    const activePipeline = deals
      .filter((d: any) => !["won", "lost"].includes(d.stage))
      .reduce((s: number, d: any) => s + Number(d.value || 0), 0);

    const byStage = DEAL_STAGES.map((stage) => {
      const stageDeals = deals.filter((d: any) => d.stage === stage);
      const value = stageDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
      const weighted = value * (STAGE_PROBABILITY[stage] ?? 0) / 100;
      return { stage, label: STAGE_LABELS[stage], count: stageDeals.length, value, weighted };
    });

    return { totalPipeline, weightedForecast, wonRevenue, activePipeline, byStage };
  }, [deals]);

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Forecasting</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Revenue Forecasting</h1>
        <p className="text-muted-foreground text-sm">
          Weighted pipeline forecast derived from live deal data.
        </p>
      </div>

      {isLoading ? (
        <Loading text="Loading forecast..." />
      ) : (
        <>
          {/* Top metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Pipeline", value: `$${stats.totalPipeline.toLocaleString()}`, icon: <Target className="h-4 w-4" /> },
              { label: "Weighted Forecast", value: `$${Math.round(stats.weightedForecast).toLocaleString()}`, icon: <TrendingUp className="h-4 w-4 text-primary" /> },
              { label: "Won Revenue", value: `$${stats.wonRevenue.toLocaleString()}`, icon: <DollarSign className="h-4 w-4 text-success" /> },
              { label: "Active Pipeline", value: `$${stats.activePipeline.toLocaleString()}`, icon: <Target className="h-4 w-4 text-amber-400" /> },
            ].map((s) => (
              <Card key={s.label} className="border-border/60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                    <p className="font-black text-xl text-foreground">{s.value}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground">{s.icon}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stage breakdown */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {stats.byStage
                  .filter((s) => s.count > 0)
                  .map((s) => {
                    const maxVal = Math.max(...stats.byStage.map((b) => b.value), 1);
                    const pct = (s.value / maxVal) * 100;
                    return (
                      <div key={s.stage} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{s.label}</span>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>{s.count} deal{s.count !== 1 ? "s" : ""}</span>
                            <span className="font-semibold">${s.value.toLocaleString()}</span>
                            <span className="text-primary font-semibold">
                              ${Math.round(s.weighted).toLocaleString()} weighted
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all duration-700"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
