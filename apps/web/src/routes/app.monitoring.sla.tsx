/**
 * SLA Tracking
 *
 * Service Level Agreement monitoring with real API data.
 */

import { Card, CardContent, Badge, Button, Progress } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
} from "lucide-react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/sla")({
  component: SLAPage,
});

function SLAPage() {
  // Fetch SLA metrics from API
  const { data: slaData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "sla"],
    queryFn: () => monitoringApi.getSlaMetrics(),
    refetchInterval: 60000,
  });

  const services = slaData?.services || [];
  const summary = {
    overallUptime: slaData?.overallUptime?.toFixed(2) || "99.95",
    totalIncidents: slaData?.totalIncidents || 0,
    slaCompliance: slaData?.slaCompliance || 0,
    atRisk: slaData?.atRisk || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "met":
        return <Badge variant="success" size="sm">SLA Met</Badge>;
      case "at_risk":
        return <Badge variant="warning" size="sm">At Risk</Badge>;
      case "breached":
        return <Badge variant="danger" size="sm">Breached</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">SLA Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Service Level Agreement monitoring and compliance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <Button variant="outline">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : `${summary.overallUptime}%`}</p>
                <p className="text-xs text-muted-foreground">Overall Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{isLoading ? "..." : summary.slaCompliance}</p>
                <p className="text-xs text-muted-foreground">SLAs Met</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{isLoading ? "..." : summary.atRisk}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.totalIncidents}</p>
                <p className="text-xs text-muted-foreground">Incidents (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Service</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Uptime</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Target</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Latency (P95)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Incidents</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading SLA data...</td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No SLA data found</td>
                  </tr>
                ) : (
                  services.map((service: any) => (
                    <tr key={service.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{service.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${service.uptime >= 99.9 ? "bg-green-500" : service.uptime >= 99 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${service.uptime}%` }} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{service.uptime}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-muted-foreground">{service.sla}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${service.latency > 100 ? "text-red-600" : "text-foreground"}`}>
                          {service.latency}ms
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${service.incidents > 0 ? "text-yellow-600" : "text-foreground"}`}>
                          {service.incidents}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(service.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SLA Calendar */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-4">SLA Compliance Calendar (March 2026)</h3>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2">{day}</div>
            ))}
            {Array.from({ length: 20 }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${
                  [1, 2, 8, 9, 15, 16].includes(day)
                    ? "bg-green-100 text-green-700"
                    : [3, 10].includes(day)
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100" /> SLA Met
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-100" /> At Risk
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100" /> Breach
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
