import { Card, CardContent, CardHeader, CardTitle, Badge } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock, Eye } from "lucide-react";

export const Route = createFileRoute("/app/monitoring/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const metrics = [
    { label: "Active Users", value: "0", change: "+0%", icon: Users, color: "text-blue-600" },
    { label: "Page Views", value: "0", change: "+0%", icon: Eye, color: "text-purple-600" },
    { label: "Session Duration", value: "0m", change: "+0%", icon: Clock, color: "text-green-600" },
    { label: "Conversion Rate", value: "0%", change: "+0%", icon: TrendingUp, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/monitoring">
          <Card className="p-1.5 border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Card>
        </Link>
        <div>
          <h2 className="font-bold text-xl text-foreground">Analytics</h2>
          <p className="text-muted-foreground text-sm">PostHog analytics integration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      {metric.label}
                    </p>
                    <p className="font-black text-2xl text-foreground mt-0.5">{metric.value}</p>
                    <Badge className="mt-1" variant="outline">{metric.change}</Badge>
                  </div>
                  <Icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> User Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Analytics charts will be displayed here.</p>
              <p className="text-sm mt-1">Connect PostHog to see real data.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
