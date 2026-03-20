/**
 * Reorder Point Alerts
 *
 * View and manage stock alerts and reorder notifications.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShoppingCart,
  Clock,
  Settings,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/inventory/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const alerts = [
    { id: "1", type: "out_of_stock", product: "Wireless Earbuds", sku: "AUDIO-WE-2024-WHT", currentStock: 0, reorderPoint: 100, warehouse: "Warehouse B", suggestedOrder: 200, priority: "critical", createdAt: "5 hours ago" },
    { id: "2", type: "low_stock", product: "Wireless Headphones Pro", sku: "ELEC-HEAD-无线", currentStock: 8, reorderPoint: 25, warehouse: "Warehouse A", suggestedOrder: 100, priority: "high", createdAt: "2 hours ago" },
    { id: "3", type: "low_stock", product: "iPhone 15 Pro Case", sku: "IPH-15-PRO-CASE-BLK", currentStock: 12, reorderPoint: 50, warehouse: "Warehouse A", suggestedOrder: 100, priority: "high", createdAt: "2 hours ago" },
    { id: "4", type: "expiring", product: "Organic Face Cream", sku: "BEAU-OFC-50ML", currentStock: 45, reorderPoint: 20, warehouse: "Warehouse C", suggestedOrder: 100, priority: "medium", createdAt: "1 day ago", expiresIn: "15 days" },
    { id: "5", type: "reorder", product: "Running Shoes Size 10", sku: "SPORT-RS-10-BLU", currentStock: 8, reorderPoint: 25, warehouse: "Warehouse A", suggestedOrder: 50, priority: "high", createdAt: "1 day ago" },
    { id: "6", type: "overstock", product: "USB-C Cables", sku: "ELEC-USB-C-1M", currentStock: 500, reorderPoint: 50, warehouse: "Warehouse B", suggestedOrder: 0, priority: "low", createdAt: "2 days ago" },
    { id: "7", type: "low_stock", product: "LED Desk Lamp", sku: "HOME-LAMP-LED", currentStock: 15, reorderPoint: 20, warehouse: "Distribution Center", suggestedOrder: 50, priority: "medium", createdAt: "3 days ago" },
  ];

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || alert.type === filterType;
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case "high":
        return <Badge variant="warning" size="sm">High</Badge>;
      case "medium":
        return <Badge variant="default" size="sm">Medium</Badge>;
      case "low":
        return <Badge variant="default" size="sm">Low</Badge>;
      default:
        return <Badge variant="default" size="sm">{priority}</Badge>;
    }
  };

  const criticalCount = alerts.filter((a) => a.priority === "critical").length;
  const highCount = alerts.filter((a) => a.priority === "high").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Reorder Alerts</h2>
          <p className="text-sm text-muted-foreground">
            {alerts.length} alerts / {criticalCount} critical / {highCount} high priority
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
                <p className="text-2xl font-bold text-red-600">{alerts.filter((a) => a.type === "out_of_stock").length}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{alerts.filter((a) => a.type === "low_stock").length}</p>
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
                <p className="text-2xl font-bold text-orange-600">{alerts.filter((a) => a.type === "expiring").length}</p>
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
                <p className="text-2xl font-bold text-green-600">{alerts.filter((a) => a.type === "overstock").length}</p>
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
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className={`border-border/60 ${
            alert.priority === "critical" ? "border-red-200" :
            alert.priority === "high" ? "border-yellow-200" : ""
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getTypeIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground">{alert.product}</h3>
                    {getTypeBadge(alert.type)}
                    {getPriorityBadge(alert.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">SKU: {alert.sku} / {alert.warehouse}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span>Current: <strong className={alert.currentStock === 0 ? "text-red-600" : "text-yellow-600"}>{alert.currentStock}</strong></span>
                    <span>Reorder Point: <strong>{alert.reorderPoint}</strong></span>
                    {alert.expiresIn && <span>Expires in: <strong className="text-orange-600">{alert.expiresIn}</strong></span>}
                    <span>Suggested Order: <strong>{alert.suggestedOrder > 0 ? alert.suggestedOrder : "None"}</strong></span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {alert.suggestedOrder > 0 && (
                    <Link to="/app/inventory/purchase-orders">
                      <Button size="sm" leftIcon={<ShoppingCart className="h-3 w-3" />}>
                        Create PO
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm">
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
