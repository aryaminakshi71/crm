/**
 * Reorder Point Alerts
 *
 * View and manage stock alerts and reorder notifications — data from real API.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShoppingCart,
  Clock,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { inventoryApi } from "../lib/api";

export const Route = createFileRoute("/app/inventory/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", "alerts", { resolved: false }],
    queryFn: () => inventoryApi.alerts.list({ limit: 100, resolved: false }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.alerts.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
    },
  });

  const alerts = data?.data ?? [];

  const filteredAlerts = alerts.filter((alert: any) => {
    const productName = (alert.productName ?? alert.product ?? "").toLowerCase();
    const sku = (alert.sku ?? "").toLowerCase();
    const matchesSearch =
      productName.includes(searchQuery.toLowerCase()) ||
      sku.includes(searchQuery.toLowerCase());
    const alertType = alert.alertType ?? alert.type ?? "";
    const matchesType = filterType === "all" || alertType === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "out_of_stock":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "low_stock":
        return <Bell className="h-5 w-5 text-yellow-600" />;
      case "expiring":
        return <Clock className="h-5 w-5 text-orange-600" />;
      case "overstock":
        return <Package className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "out_of_stock":
        return <Badge variant="danger" size="sm">Out of Stock</Badge>;
      case "low_stock":
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case "expiring":
        return <Badge variant="default" size="sm">Expiring Soon</Badge>;
      case "overstock":
        return <Badge variant="info" size="sm">Overstock</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  const outOfStockCount = alerts.filter((a: any) => (a.alertType ?? a.type) === "out_of_stock").length;
  const lowStockCount = alerts.filter((a: any) => (a.alertType ?? a.type) === "low_stock").length;
  const expiringCount = alerts.filter((a: any) => (a.alertType ?? a.type) === "expiring").length;
  const overstockCount = alerts.filter((a: any) => (a.alertType ?? a.type) === "overstock").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Reorder Alerts</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${alerts.length} alerts`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
            Alert Settings
          </Button>
          <Link to="/app/inventory/purchase-orders">
            <Button size="sm" leftIcon={<ShoppingCart className="h-4 w-4" />}>
              Create PO
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "…" : outOfStockCount}</p>
                <p className="text-xs text-red-600/80">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{isLoading ? "…" : lowStockCount}</p>
                <p className="text-xs text-yellow-600/80">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{isLoading ? "…" : expiringCount}</p>
                <p className="text-xs text-orange-600/80">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{isLoading ? "…" : overstockCount}</p>
                <p className="text-xs text-muted-foreground">Overstock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="expiring">Expiring Soon</option>
          <option value="overstock">Overstock</option>
        </select>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading alerts...</div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No alerts found</h3>
              <p className="text-sm text-muted-foreground">All stock levels are healthy.</p>
            </div>
          ) : (
            filteredAlerts.map((alert: any) => {
              const alertType = alert.alertType ?? alert.type ?? "unknown";
              const productName = alert.productName ?? alert.product ?? "Unknown product";
              return (
                <Card key={alert.id} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getTypeIcon(alertType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-foreground">{productName}</h3>
                          {getTypeBadge(alertType)}
                        </div>
                        {alert.sku && (
                          <p className="text-sm text-muted-foreground mb-2">SKU: {alert.sku}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {alert.currentStock !== undefined && (
                            <span>Current: <strong className={alert.currentStock === 0 ? "text-red-600" : "text-yellow-600"}>{alert.currentStock}</strong></span>
                          )}
                          {alert.threshold !== undefined && (
                            <span>Reorder Point: <strong>{alert.threshold}</strong></span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link to="/app/inventory/purchase-orders">
                          <Button size="sm" leftIcon={<ShoppingCart className="h-3 w-3" />}>
                            Create PO
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
