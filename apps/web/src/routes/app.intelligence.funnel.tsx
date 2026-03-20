import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Target,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/funnel")({
  component: Funnel,
});

const funnelStages = [
  { name: "Website Visitors", value: 45000, percentage: 100, dropoff: null },
  { name: "Product Page Views", value: 18000, percentage: 40, dropoff: "-60%" },
  { name: "Add to Cart", value: 5400, percentage: 12, dropoff: "-75%" },
  { name: "Checkout Started", value: 3240, percentage: 7.2, dropoff: "-40%" },
  { name: "Purchase Complete", value: 1710, percentage: 3.8, dropoff: "-47%" },
];

function Funnel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Funnel Visualization</h2>
          <p className="text-sm text-muted-foreground">
            Analyze conversion rates through your sales funnel
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">3.8%</p>
            <p className="text-xs text-muted-foreground">Overall Conversion</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">1,710</p>
            <p className="text-xs text-muted-foreground">Total Conversions</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">+0.4%</p>
            <p className="text-xs text-muted-foreground">Conversion vs Last Week</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <ArrowRight className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">62%</p>
            <p className="text-xs text-muted-foreground">Cart Abandonment</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-6">Sales Funnel</h3>
          <div className="space-y-4">
            {funnelStages.map((stage, idx) => (
              <div key={stage.name} className="relative">
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 bg-primary rounded-r-lg flex items-center justify-start pl-4"
                    style={{ width: `${stage.percentage}%`, minWidth: "120px" }}
                  >
                    <span className="text-white font-medium whitespace-nowrap">{stage.value.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{stage.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{stage.percentage}%</span>
                      {stage.dropoff && (
                        <span className="text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                          {stage.dropoff} drop
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {idx < funnelStages.length - 1 && (
                  <div className="flex items-center justify-end mr-4">
                    <div className="w-0 h-6 border-l-2 border-dashed border-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Analysis */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Stage Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <p className="font-medium text-amber-500 mb-2">Biggest Drop-off: Product Page Views</p>
              <p className="text-sm text-muted-foreground">
                60% of visitors leave after viewing products. Consider improving product images or adding customer reviews.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
              <p className="font-medium text-green-500 mb-2">Best Performer: Checkout Started</p>
              <p className="text-sm text-muted-foreground">
                Only 40% dropoff at checkout - your checkout flow is performing well above industry average.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
