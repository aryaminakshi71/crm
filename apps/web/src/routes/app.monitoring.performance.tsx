import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp, Zap, Gauge, Activity } from "lucide-react";

export const Route = createFileRoute("/app/monitoring/performance")({
  component: PerformancePage,
});

function PerformancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/monitoring">
          <Card className="p-1.5 border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Card>
        </Link>
        <div>
          <h2 className="font-bold text-xl text-foreground">Performance</h2>
          <p className="text-muted-foreground text-sm">APM metrics and performance data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">P50 Latency</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0ms</p>
              </div>
              <Gauge className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">P95 Latency</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0ms</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">P99 Latency</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0ms</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Error Rate</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Performance charts will be displayed here.</p>
              <p className="text-sm mt-1">Connect your APM tool to see real data.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
