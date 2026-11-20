import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertTriangle,
  Bell,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { inventoryApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  severity: z.enum(["critical", "warning", ""]).optional(),
});

export const Route = createFileRoute("/app/inventory/alerts/_index")({
  validateSearch: searchSchema,
  component: AlertsPage,
});

type Severity = "critical" | "warning" | "";

function severityVariant(severity: string) {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "warning";
  return "secondary";
}

function severityOrder(s: string) {
  if (s === "critical") return 0;
  if (s === "warning") return 1;
  return 2;
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}>
            {icon || <Bell className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPage() {
  const { q = "", severity: severityFilterRaw = "" } = useSearch({ from: "/app/inventory/alerts/_index" });
  const severityFilter = severityFilterRaw as Severity;
  const navigate = useNavigate({ from: "/app/inventory/alerts" });

  const { data: alertsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "alerts"],
    queryFn: () => inventoryApi.alerts.list({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["inventory", "products", "alerts"],
    queryFn: () => inventoryApi.products.list({ page: 1, limit: 50 }),
  });

  const products = (productsData as any)?.data ?? [];

  // Build alert rows from API alerts + derive from products with low/no stock
  const apiAlerts: any[] = (alertsData as any)?.data ?? [];

  const productAlerts: any[] = products
    .filter((p: any) => (p.currentStock ?? 0) <= (p.minStockLevel ?? 0))
    .map((p: any) => ({
      id: `prod-alert-${p.id}`,
      type: (p.currentStock ?? 0) === 0 ? "out_of_stock" : "low_stock",
      product: p.name,
      warehouse: p.warehouse || "Main",
      currentStock: p.currentStock ?? 0,
      threshold: p.minStockLevel ?? 0,
      severity: (p.currentStock ?? 0) === 0 ? "critical" : "warning",
      createdAt: p.updatedAt || p.createdAt,
    }));

  const allAlerts = [
    ...apiAlerts.map((a: any) => ({
      id: a.id,
      type: a.type || "stock_alert",
      product: a.productName || a.product || "Unknown",
      warehouse: a.warehouse || "Main",
      currentStock: a.currentLevel ?? a.currentStock ?? 0,
      threshold: a.threshold ?? 0,
      severity: a.severity || (a.type === "out_of_stock" ? "critical" : "warning"),
      createdAt: a.createdAt,
    })),
    ...productAlerts,
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));

  const filtered = allAlerts
    .filter((a) => !severityFilter || a.severity === severityFilter)
    .filter((a) =>
      !q ||
      a.product?.toLowerCase().includes(q.toLowerCase()) ||
      a.warehouse?.toLowerCase().includes(q.toLowerCase()) ||
      a.type?.toLowerCase().includes(q.toLowerCase()),
    );

  const criticalCount = allAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = allAlerts.filter((a) => a.severity === "warning").length;

  if (isError) {
    return (
      <EmptyState
        variant="error"
        title="Something went wrong"

        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Inventory Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Low stock, out-of-stock, and reorder notifications
          </p>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Metric
          title="Critical Alerts"
          value={criticalCount}
          icon={<ShieldAlert className="h-4 w-4" />}
          color="text-red-500"
          trend="Immediate action needed"
        />
        <Metric
          title="Warnings"
          value={warningCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-amber-500"
          trend="Monitor closely"
        />
      </div>
      {/* Search + Severity filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
            className="pl-9 h-8 w-56 text-sm"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
          {[
            { value: "" as Severity, label: "All" },
            { value: "critical" as Severity, label: "Critical" },
            { value: "warning" as Severity, label: "Warning" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, severity: t.value || undefined }) })
              }
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                severityFilter === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Alert list */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="No alerts"

        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((alert: any) => (
            <Card
              key={alert.id}
              className={`border-border/60 ${
                alert.severity === "critical" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-500"
              }`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={`rounded-lg p-2 mt-0.5 flex-shrink-0 ${
                    alert.severity === "critical"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {alert.severity === "critical" ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">
                      {alert.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <Badge variant={severityVariant(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{alert.product}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      Warehouse:{" "}
                      <span className="font-semibold text-foreground">{alert.warehouse}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Current:{" "}
                      <span
                        className={`font-bold ${
                          alert.currentStock === 0 ? "text-red-500" : "text-amber-500"
                        }`}
                      >
                        {alert.currentStock}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Threshold:{" "}
                      <span className="font-semibold text-foreground">{alert.threshold}</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : "—"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
