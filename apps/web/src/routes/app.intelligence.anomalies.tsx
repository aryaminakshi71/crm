import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Bell,
  CheckCircle2,
  Filter,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/anomalies")({
  component: Anomalies,
});

const anomalies = [
  { id: 1, type: "revenue", severity: "high", metric: "Monthly Revenue", expected: "$95,000", actual: "$118,000", deviation: "+24%", reason: "Enterprise deal closed early", detectedAt: "Mar 20, 2026 9:15 AM", status: "investigating" },
  { id: 2, type: "churn", severity: "medium", metric: "Churn Rate", expected: "2.5%", actual: "3.8%", deviation: "+52%", reason: "Premium tier customers churning", detectedAt: "Mar 19, 2026 3:30 PM", status: "new" },
  { id: 3, type: "conversion", severity: "low", metric: "Checkout Conversion", expected: "4.2%", actual: "3.1%", deviation: "-26%", reason: "Mobile checkout page issue", detectedAt: "Mar 18, 2026 11:00 AM", status: "resolved" },
  { id: 4, type: "support", severity: "medium", metric: "Avg Response Time", expected: "2 hrs", actual: "4.5 hrs", deviation: "+125%", reason: "High volume of tickets", detectedAt: "Mar 17, 2026 2:45 PM", status: "investigating" },
  { id: 5, type: "acquisition", severity: "low", metric: "Customer Acquisition", expected: "450", actual: "612", deviation: "+36%", reason: "Viral marketing campaign", detectedAt: "Mar 16, 2026 10:00 AM", status: "resolved" },
];

const stats = [
  { label: "Total Anomalies", value: anomalies.length, icon: AlertTriangle },
  { label: "High Severity", value: anomalies.filter(a => a.severity === "high").length, icon: AlertTriangle },
  { label: "Under Investigation", value: anomalies.filter(a => a.status === "investigating").length, icon: Clock },
  { label: "Resolved", value: anomalies.filter(a => a.status === "resolved").length, icon: CheckCircle2 },
];

function Anomalies() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Anomaly Detection</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered detection of unusual patterns and metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Anomalies List */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Detected Anomalies</h3>
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`p-4 rounded-lg border ${
                  anomaly.severity === "high" ? "border-red-500/30 bg-red-500/5" :
                  anomaly.severity === "medium" ? "border-amber-500/30 bg-amber-500/5" :
                  "border-border/40"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      anomaly.severity === "high" ? "bg-red-500/20" :
                      anomaly.severity === "medium" ? "bg-amber-500/20" :
                      "bg-muted"
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        anomaly.severity === "high" ? "text-red-500" :
                        anomaly.severity === "medium" ? "text-amber-500" :
                        "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">{anomaly.metric}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          anomaly.severity === "high" ? "bg-red-500/10 text-red-500" :
                          anomaly.severity === "medium" ? "bg-amber-500/10 text-amber-500" :
                          "bg-muted/10 text-muted-foreground"
                        }`}>
                          {anomaly.severity}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          anomaly.status === "resolved" ? "bg-green-500/10 text-green-500" :
                          anomaly.status === "investigating" ? "bg-blue-500/10 text-blue-500" :
                          "bg-purple-500/10 text-purple-500"
                        }`}>
                          {anomaly.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{anomaly.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      anomaly.deviation.startsWith("+") ? "text-green-600" : "text-red-600"
                    }`}>
                      {anomaly.deviation}
                    </p>
                    <p className="text-xs text-muted-foreground">deviation</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-3 rounded bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="text-sm font-medium">{anomaly.expected}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Actual</p>
                    <p className="text-sm font-medium">{anomaly.actual}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Detected</p>
                    <p className="text-sm font-medium">{anomaly.detectedAt}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                    Investigate
                  </button>
                  {anomaly.status !== "resolved" && (
                    <button className="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
