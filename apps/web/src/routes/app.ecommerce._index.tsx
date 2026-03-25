/**
 * eCommerce Dashboard
 *
 * Overview of store performance and key metrics.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Store,
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Package,
  ArrowRight,
  Plus,
  Star,
  Percent,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};
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

export const Route = createFileRoute("/app/ecommerce/_index")({
  component: EcommerceDashboard,
});

function EcommerceDashboard() {
  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: statsRefetch } = useQuery({
    queryKey: ["ecommerce-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/stats`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["ecommerce-orders-recent"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/orders?limit=4`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const stats = {
    revenue: (statsData as any)?.totalRevenue ?? (statsData as any)?.revenue ?? 0,
    revenueChange: (statsData as any)?.revenueChange ?? 0,
    orders: (statsData as any)?.totalOrders ?? (statsData as any)?.orders ?? 0,
    ordersChange: (statsData as any)?.ordersChange ?? 0,
    customers: (statsData as any)?.totalCustomers ?? (statsData as any)?.customers ?? 0,
    customersChange: (statsData as any)?.customersChange ?? 0,
    conversionRate: (statsData as any)?.conversionRate ?? 0,
    conversionChange: (statsData as any)?.conversionChange ?? 0,
    averageOrder: (statsData as any)?.averageOrder ?? 0,
    cartAbandonment: (statsData as any)?.cartAbandonment ?? 0,
  };
  const recentOrders = (ordersData as any)?.data ?? [];

  const revenueData = [
    { month: "Jan", revenue: 32000, orders: 245 },
    { month: "Feb", revenue: 38000, orders: 289 },
    { month: "Mar", revenue: 42000, orders: 312 },
    { month: "Apr", revenue: 39500, orders: 298 },
    { month: "May", revenue: 45000, orders: 334 },
    { month: "Jun", revenue: 48750, orders: 342 },
  ];

  const salesByCategory = [
    { name: "Electronics", value: 45, color: "#2172cd" },
    { name: "Apparel", value: 25, color: "#8b5cf6" },
    { name: "Home & Garden", value: 15, color: "#22c55e" },
    { name: "Sports", value: 10, color: "#f59e0b" },
    { name: "Other", value: 5, color: "#6b7280" },
  ];

  const topProducts = [
    { id: "1", name: '55" 4K Smart TV', sales: 45, revenue: 22495.55, trend: "up" },
    { id: "2", name: "Laptop 15\" Pro", sales: 32, revenue: 31996.68, trend: "up" },
    { id: "3", name: "3-Seater Sofa", sales: 18, revenue: 17982.00, trend: "down" },
    { id: "4", name: "Mountain Bike", sales: 15, revenue: 8999.85, trend: "up" },
    { id: "5", name: "Winter Jacket", sales: 28, revenue: 4199.72, trend: "up" },
  ];

  if (statsError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => statsRefetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Revenue
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">${stats.revenue.toLocaleString()}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.revenueChange}% from last month
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
                  Orders
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.orders}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.ordersChange}% from last month
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Customers
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.customers}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.customersChange}% from last month
                </p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Conversion Rate
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.conversionRate}%</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.conversionChange}% from last month
                </p>
              </div>
              <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <Eye className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2172cd" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2172cd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2172cd"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
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
              {salesByCategory.map((item) => (
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Products</CardTitle>
              <Link
                to="/app/ecommerce/products"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-bold text-muted-foreground w-6">{idx + 1}</span>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    ${product.revenue.toLocaleString()}
                  </p>
                  {product.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-600 ml-auto" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <Link
                to="/app/ecommerce/orders"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-lg bg-blue-100 p-2">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.customer} / {order.items} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">${order.total.toFixed(2)}</p>
                  <Badge
                    variant={
                      order.status === "delivered"
                        ? "success"
                        : order.status === "shipped"
                        ? "info"
                        : "warning"
                    }
                    size="sm"
                  >
                    {order.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{order.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link to="/app/ecommerce/products/new">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add Product</span>
          </Button>
        </Link>
        <Link to="/app/ecommerce/orders">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-medium">View Orders</span>
          </Button>
        </Link>
        <Link to="/app/ecommerce/discounts">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <Percent className="h-5 w-5" />
            <span className="text-sm font-medium">Create Discount</span>
          </Button>
        </Link>
        <Link to="/app/ecommerce/store">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 w-full">
            <Store className="h-5 w-5" />
            <span className="text-sm font-medium">Customize Store</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
