/**
 * Inventory Overview Dashboard
 *
 * Dashboard showing inventory stats, alerts, and recent activity.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Boxes,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Warehouse,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/inventory/_index")({
  component: InventoryOverview,
});

function InventoryOverview() {
  const stats = {
    totalProducts: 1247,
    totalValue: 2450000,
    lowStockItems: 23,
    outOfStockItems: 5,
    pendingOrders: 12,
    itemsInTransit: 156,
  };

  const stockTrendData = [
    { month: "Jan", inStock: 45000, lowStock: 2000, outOfStock: 500 },
    { month: "Feb", inStock: 48000, lowStock: 1800, outOfStock: 400 },
    { month: "Mar", inStock: 52000, lowStock: 2200, outOfStock: 300 },
    { month: "Apr", inStock: 49000, lowStock: 2500, outOfStock: 600 },
    { month: "May", inStock: 55000, lowStock: 1900, outOfStock: 200 },
    { month: "Jun", inStock: 58000, lowStock: 1500, outOfStock: 100 },
  ];

  const categoryBreakdown = [
    { name: "Electronics", value: 35, color: "#2172cd" },
    { name: "Apparel", value: 25, color: "#8b5cf6" },
    { name: "Home & Garden", value: 18, color: "#22c55e" },
    { name: "Sports", value: 12, color: "#f59e0b" },
    { name: "Other", value: 10, color: "#6b7280" },
  ];

  const warehouseUtilization = [
    { name: "Warehouse A", utilization: 85, capacity: 10000, used: 8500 },
    { name: "Warehouse B", utilization: 72, capacity: 15000, used: 10800 },
    { name: "Warehouse C", utilization: 91, capacity: 8000, used: 7280 },
    { name: "Distribution Center", utilization: 65, capacity: 20000, used: 13000 },
  ];

  const recentAlerts = [
    {
      id: "1",
      type: "low_stock",
      product: "iPhone 15 Pro Case",
      sku: "IPH-15-PRO-CASE-BLK",
      currentStock: 12,
      reorderPoint: 50,
      warehouse: "Warehouse A",
      time: "2 hours ago",
    },
    {
      id: "2",
      type: "out_of_stock",
      product: "Wireless Earbuds",
      sku: "AUDIO-WE-2024-WHT",
      currentStock: 0,
      reorderPoint: 100,
      warehouse: "Warehouse B",
      time: "5 hours ago",
    },
    {
      id: "3",
      type: "expiring",
      product: "Organic Face Cream",
      sku: "BEAU-OFC-50ML",
      currentStock: 45,
      reorderPoint: 20,
      warehouse: "Warehouse C",
      time: "1 day ago",
    },
    {
      id: "4",
      type: "reorder",
      product: "Running Shoes Size 10",
      sku: "SPORT-RS-10-BLU",
      currentStock: 8,
      reorderPoint: 25,
      warehouse: "Warehouse A",
      time: "1 day ago",
    },
  ];

  const topProducts = [
    { sku: "ELEC-4KTV-55", name: "55\" 4K Smart TV", stock: 124, value: 62000 },
    { sku: "ELEC-LAP-15", name: "Laptop 15\" Pro", stock: 89, value: 89000 },
    { sku: "HOME-SOF-3S", name: "3-Seater Sofa", stock: 45, value: 45000 },
    { sku: "SPORT-BIKE-MTN", name: "Mountain Bike", stock: 23, value: 27600 },
    { sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", stock: 156, value: 23400 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Total Products
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% from last month
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Inventory Value
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">${(stats.totalValue / 1000000).toFixed(1)}M</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8.2% from last month
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Low Stock Items
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.lowStockItems}</p>
                <p className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Needs attention
                </p>
              </div>
              <div className="rounded-xl bg-yellow-100 p-2.5 text-yellow-600">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Out of Stock
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.outOfStockItems}</p>
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Critical
                </p>
              </div>
              <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stock Trend */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Stock Levels (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockTrendData}>
                  <defs>
                    <linearGradient id="colorInStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLowStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutOfStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inStock"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInStock)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowStock"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLowStock)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outOfStock"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOutOfStock)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Utilization */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Warehouse Utilization</CardTitle>
            <Link
              to="/app/inventory/warehouses"
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {warehouseUtilization.map((warehouse) => (
              <div key={warehouse.name} className="p-3 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{warehouse.name}</span>
                  <Badge
                    variant={warehouse.utilization > 90 ? "danger" : warehouse.utilization > 75 ? "warning" : "success"}
                    size="sm"
                  >
                    {warehouse.utilization}%
                  </Badge>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${
                      warehouse.utilization > 90 ? "bg-red-500" : warehouse.utilization > 75 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${warehouse.utilization}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Alerts */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Stock Alerts</CardTitle>
              <Link
                to="/app/inventory/alerts"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {alert.type === "out_of_stock" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : alert.type === "low_stock" ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{alert.product}</p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {alert.sku} / {alert.warehouse}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${alert.currentStock === 0 ? "text-red-600" : "text-yellow-600"}`}>
                    {alert.currentStock} left
                  </p>
                  <p className="text-xs text-muted-foreground">Reorder: {alert.reorderPoint}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Highest Value Products</CardTitle>
              <Link
                to="/app/inventory/products"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((product) => (
              <div
                key={product.sku}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    ${product.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link to="/app/inventory/products/new">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add Product</span>
          </Button>
        </Link>
        <Link to="/app/inventory/adjustments">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <Activity className="h-5 w-5" />
            <span className="text-sm font-medium">Stock Adjustment</span>
          </Button>
        </Link>
        <Link to="/app/inventory/transfers">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <Warehouse className="h-5 w-5" />
            <span className="text-sm font-medium">Transfer Stock</span>
          </Button>
        </Link>
        <Link to="/app/inventory/purchase-orders">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Create PO</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
