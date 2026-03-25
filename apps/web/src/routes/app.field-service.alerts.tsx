import { createFileRoute } from "@tanstack/react-router";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  Filter,
  Search,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { fieldServiceApi } from "@/lib/api";

export const Route = createFileRoute("/app/field-service/alerts")({
  validateSearch: z.object({
    search: z.string().optional(),
    severity: z.string().optional(),
    type: z.string().optional(),
    slaType: z.string().optional(),
  }),
  component: Alerts,
});

const MOCK_ALERTS = [
  { id: 1, type: "sla_breach", severity: "critical", jobId: "JOB-1035", customer: "Downtown Office", issue: "Response time SLA breached", technician: "John Smith", breachedAt: "10:15 AM", currentStatus: "Technician on site", responseTime: "1h 15m", resolutionTime: null, slaType: "response" },
  { id: 2, type: "sla_breach", severity: "warning", jobId: "JOB-1032", customer: "Harbor View Hotel", issue: "Resolution time approaching deadline", technician: "Jane Doe", breachedAt: "9:45 AM", currentStatus: "Parts ordered", deadline: "2:00 PM", timeRemaining: "2h 15m", slaType: "resolution" },
  { id: 3, type: "sla_breach", severity: "warning", jobId: "JOB-1043", customer: "TechStart Inc", issue: "Response SLA at risk", technician: "Mike Wilson", breachedAt: null, currentStatus: "Technician dispatched", deadline: "11:00 AM", timeRemaining: "45m", slaType: "response" },
  { id: 4, type: "customer_complaint", severity: "warning", jobId: "JOB-1028", customer: "Metro Hospital", issue: "Customer reported delay", technician: "Sarah Johnson", breachedAt: null, currentStatus: "In progress", deadline: null, timeRemaining: null, slaType: null },
  { id: 5, type: "sla_breach", severity: "info", jobId: "JOB-1025", customer: "Riverside Apartments", issue: "Resolution time exceeded target", technician: "Tom Brown", breachedAt: "Mar 19, 4:30 PM", currentStatus: "Completed", deadline: "Mar 19, 3:00 PM", resolutionTime: "1h 30m over", slaType: "resolution" },
];

const slaStats = [
  { label: "Response SLA", target: "98%", current: "94%", trend: "-2%", status: "warning" },
  { label: "Resolution SLA", target: "95%", current: "92%", trend: "-1%", status: "warning" },
  { label: "First-Time Fix", target: "85%", current: "88%", trend: "+3%", status: "good" },
  { label: "Customer Satisfaction", target: "90%", current: "94%", trend: "+2%", status: "good" },
];

function Alerts() {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ["field-service", "alerts"],
    queryFn: () => fieldServiceApi.jobs.list(),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (jobId: string) => fieldServiceApi.jobs.update(jobId, { alertStatus: "dismissed" }),
    onSuccess: () => {
      toast.success("Alert dismissed");
      queryClient.invalidateQueries({ queryKey: ["field-service", "alerts"] });
    },
    onError: () => {
      toast.error("Failed to dismiss alert");
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (jobId: string) => fieldServiceApi.jobs.update(jobId, { alertStatus: "resolved", status: "resolved" }),
    onSuccess: () => {
      toast.success("Alert resolved successfully");
      queryClient.invalidateQueries({ queryKey: ["field-service", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["field-service", "jobs"] });
    },
    onError: () => {
      toast.error("Failed to resolve alert");
    },
  });

  if (alertsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => alertsQuery.refetch()}>Retry</Button>
    </div>
  );

  const alerts = (alertsQuery as any).data?.data ?? [];

  if (alertsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">SLA Breach Alerts Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and respond to SLA violations in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="h-4 w-4" />
            Configure Alerts
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Bell className="h-4 w-4" />
            Alert Settings
          </button>
        </div>
      </div>

      {/* SLA Performance */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">SLA Performance Today</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {slaStats.map((stat) => (
              <div key={stat.label} className={`p-4 rounded-lg border ${
                stat.status === "good" ? "border-green-500/30 bg-green-500/5" :
                "border-amber-500/30 bg-amber-500/5"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  {stat.status === "good" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <p className={`text-2xl font-bold ${
                    stat.status === "good" ? "text-green-600" : "text-amber-600"
                  }`}>{stat.current}</p>
                  <p className="text-xs text-muted-foreground mb-1">/ {stat.target}</p>
                </div>
                <p className={`text-xs ${
                  stat.trend.startsWith("+") ? "text-green-500" : "text-red-500"
                }`}>{stat.trend} from target</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alerts..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="sla_breach">SLA Breach</option>
          <option value="customer_complaint">Customer Complaint</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All SLA Types</option>
          <option value="response">Response Time</option>
          <option value="resolution">Resolution Time</option>
        </select>
      </div>

      {/* Active Alerts */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="font-bold text-red-500">Active SLA Breaches</h3>
              <span className="ml-auto text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full">
                {alerts.filter((a: any) => a.type === "sla_breach" && a.severity === "critical").length} Critical
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {alerts.filter((a: any) => a.type === "sla_breach" && a.severity === "critical").map((alert: any) => (
              <div key={alert.id} className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{alert.jobId}</span>
                        <span className="text-sm text-muted-foreground">{alert.customer}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.issue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">
                        {alert.slaType === "response" ? alert.responseTime : alert.timeRemaining}
                      </p>
                      <p className="text-xs text-muted-foreground">{alert.slaType} SLA</p>
                    </div>
                    <button
                      onClick={() => dismissAlertMutation.mutate(String(alert.id))}
                      disabled={dismissAlertMutation.isPending}
                      className="p-1 rounded hover:bg-muted/50 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded bg-muted/30 mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{alert.technician}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Breached at {alert.breachedAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{alert.currentStatus}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Contact tech</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                    Escalate Now
                  </button>
                  <button
                    onClick={() => resolveAlertMutation.mutate(String(alert.id))}
                    disabled={resolveAlertMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warning Alerts */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-500" />
              <h3 className="font-bold text-amber-500">At Risk - SLA Approaching</h3>
              <span className="ml-auto text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">
                {alerts.filter((a: any) => a.severity === "warning").length} Warnings
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {alerts.filter((a: any) => a.severity === "warning").map((alert: any) => (
              <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{alert.jobId}</span>
                      <span className="text-sm text-muted-foreground">{alert.customer}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.issue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-500">{alert.timeRemaining}</p>
                    <p className="text-xs text-muted-foreground">remaining</p>
                  </div>
                  <button
                    onClick={() => resolveAlertMutation.mutate(String(alert.id))}
                    disabled={resolveAlertMutation.isPending}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => dismissAlertMutation.mutate(String(alert.id))}
                    disabled={dismissAlertMutation.isPending}
                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolved Today */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <h3 className="font-bold text-foreground">Resolved Today</h3>
              <span className="ml-auto text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                3 Resolved
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">JOB-1025 - Riverside Apartments</p>
                  <p className="text-xs text-muted-foreground">Resolution SLA exceeded by 1h 30m</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Mar 19, 5:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
