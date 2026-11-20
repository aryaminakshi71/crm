import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Box,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { nucleoApi } from "@/lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/inventory/_index")({
  validateSearch: z.object({
    view: z.enum(["products", "alerts", "analytics"]).optional(),
    q: z.string().optional().default(""),
    page: z.number().optional().default(1),
  }),
  component: InventoryPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type InventoryView = "products" | "alerts" | "analytics";

const CHART_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
];

// ─── Static mock data for charts (kept as mock) ───────────────────────────────

const stockTrendData = [
  { month: "Oct", inflow: 420, outflow: 310 },
  { month: "Nov", inflow: 380, outflow: 290 },
  { month: "Dec", inflow: 510, outflow: 420 },
  { month: "Jan", inflow: 460, outflow: 370 },
  { month: "Feb", inflow: 530, outflow: 410 },
  { month: "Mar", inflow: 490, outflow: 380 },
];

const categoryDistribution = [
  { name: "Electronics", value: 34 },
  { name: "Apparel", value: 22 },
  { name: "Food & Bev", value: 18 },
  { name: "Hardware", value: 14 },
  { name: "Other", value: 12 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === "active") return "default";
  if (status === "inactive") return "secondary";
  return "destructive";
}

function stockLevel(current: number, min: number) {
  if (current === 0) return "out";
  if (current <= min) return "low";
  return "ok";
}

// ─── Metric card ─────────────────────────────────────────────────────────────

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
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Package className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function InventoryPage() {
  const { view: viewParam, q, page } = useSearch({ from: Route.fullPath });
  const navigate = useNavigate({ from: Route.fullPath });
  const [view, setView] = useState<InventoryView>(viewParam ?? "products");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const setQ = (v: string) => navigate({ search: (prev: any) => ({ ...prev, q: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (prev: any) => ({ ...prev, page: v }) });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    unit: "units",
    costPrice: "",
    sellingPrice: "",
    currentStock: "",
    minStockLevel: "",
    description: "",
  });

  const queryClient = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: statsData } = useQuery({
    queryKey: ["inventory", "stats"],
    queryFn: () => nucleoApi.inventory.stats(),
  });

  const { data: productsData, isLoading: productsLoading, isError: productsError, refetch: productsRefetch } = useQuery({
    queryKey: ["inventory", "products", q, page],
    queryFn: () =>
      nucleoApi.inventory.products.list({
        page,
        limit: PAGE_SIZE,
        search: q || undefined,
      }),
  });

  const { data: alertsData } = useQuery({
    queryKey: ["inventory", "alerts"],
    queryFn: () => nucleoApi.inventory.alerts.list({ limit: 20, resolved: false }),
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createProduct = useMutation({
    mutationFn: (payload: any) => nucleoApi.inventory.products.create(payload),
    onSuccess: () => {
      toast.success("Product created");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsCreateOpen(false);
      setNewProduct({
        name: "",
        sku: "",
        category: "",
        unit: "units",
        costPrice: "",
        sellingPrice: "",
        currentStock: "",
        minStockLevel: "",
        description: "",
      });
    },
    onError: () => toast.error("Failed to create product"),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => nucleoApi.inventory.products.delete(id),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const products = productsData?.data ?? [];
  const productsTotal = (productsData as any)?.total ?? (productsData as any)?.pagination?.total ?? 0;
  const productsTotalPages = Math.ceil(productsTotal / PAGE_SIZE);
  const alerts = alertsData?.data ?? [];
  const totalProducts = statsData?.totalProducts ?? products.length;
  const lowStockCount = statsData?.lowStockCount ?? 0;
  const outOfStockCount = statsData?.outOfStockCount ?? 0;

  const VIEW_TABS: { id: InventoryView; label: string; icon: React.ElementType }[] = [
    { id: "products", label: "Products", icon: Package },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (productsError) return (
    <EmptyState variant="error" title="Something went wrong" description="Failed to load data. Please try again." action={<Button onClick={() => productsRefetch()}>Retry</Button>} />
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteProduct.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Products, stock levels, and reorder alerts
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric
          title="Total Products"
          value={totalProducts}
          icon={<Package className="h-4 w-4" />}
          color="text-cyan-500"
          trend="SKUs tracked"
        />
        <Metric
          title="Low Stock"
          value={lowStockCount}
          icon={<TrendingDown className="h-4 w-4" />}
          color="text-amber-500"
          trend="Need reorder"
        />
        <Metric
          title="Out of Stock"
          value={outOfStockCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-red-500"
          trend="Zero inventory"
        />
        <Metric
          title="Active Alerts"
          value={alertsData?.total ?? 0}
          icon={<Zap className="h-4 w-4" />}
          color="text-violet-500"
          trend="Unresolved"
        />
      </div>
      {/* View tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* ── Products view ── */}
      {view === "products" && (
        <div className="flex flex-col gap-4">
          {/* Stock Levels by Category */}
          {(() => {
            const stockFallback = [
              { category: "Electronics", stock: 1240 },
              { category: "Apparel", stock: 3820 },
              { category: "Hardware", stock: 890 },
              { category: "Software", stock: 215 },
              { category: "Accessories", stock: 2100 },
            ];
            const stockData: { category: string; stock: number }[] = products.length > 0
              ? Object.values(
                  products.reduce((acc: Record<string, { category: string; stock: number }>, p: any) => {
                    const cat = p.category || "Uncategorized";
                    if (!acc[cat]) acc[cat] = { category: cat, stock: 0 };
                    acc[cat].stock += Number(p.currentStock) || 0;
                    return acc;
                  }, {})
                )
              : stockFallback;
            return (
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Stock Levels by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stockData}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          width={90}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: 11,
                          }}
                        />
                        <Bar dataKey="stock" radius={[0, 4, 4, 0]} name="Stock">
                          {stockData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>

          {productsLoading ? (
            <Loading />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="No products yet"

              action={
                <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="min-w-full divide-y divide-border/60 text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    {["Name", "SKU", "Category", "Stock", "Min", "Price", "Status", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-background">
                  {products.map((p: any) => {
                    const level = stockLevel(p.currentStock, p.minStockLevel);
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {p.sku || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {p.category ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              <Tag className="h-2.5 w-2.5" />
                              {p.category}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold ${
                              level === "out"
                                ? "text-red-500"
                                : level === "low"
                                  ? "text-amber-500"
                                  : "text-foreground"
                            }`}
                          >
                            {p.currentStock} {p.unit || "units"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.minStockLevel}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.sellingPrice ? `$${Number(p.sellingPrice).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColor(p.status) as any}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={productsTotalPages} onPageChange={setPage} />
        </div>
      )}
      {/* ── Alerts view ── */}
      {view === "alerts" && (
        <div className="flex flex-col gap-4">
          {alerts.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8" />}
              title="No active alerts"

            />
          ) : (
            <div className="flex flex-col gap-3">
              {alerts.map((alert: any) => (
                <Card key={alert.id} className="border-border/60">
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 mt-0.5">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {alert.type?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.message || "Stock alert triggered"}
                      </p>
                      {alert.currentLevel !== null && alert.threshold !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Current: <strong>{alert.currentLevel}</strong> / Threshold:{" "}
                          <strong>{alert.threshold}</strong>
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ── Analytics view ── */}
      {view === "analytics" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Stock Flow (6 months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stockTrendData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="inflow" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Inflow" />
                  <Bar dataKey="outflow" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Outflow" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Box className="h-4 w-4 text-primary" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {categoryDistribution.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground flex-1">{cat.name}</span>
                    <div className="flex-1 rounded-full bg-muted/40 h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${cat.value}%`,
                          background: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-8 text-right">
                      {cat.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* ── Create product modal ── */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Product"

        onSubmit={() => {
          if (!newProduct.name.trim()) {
            toast.error("Product name is required");
            return;
          }
          createProduct.mutate({
            name: newProduct.name.trim(),
            sku: newProduct.sku || undefined,
            category: newProduct.category || undefined,
            unit: newProduct.unit || "units",
            costPrice: newProduct.costPrice ? Number(newProduct.costPrice) : undefined,
            sellingPrice: newProduct.sellingPrice ? Number(newProduct.sellingPrice) : undefined,
            currentStock: newProduct.currentStock ? Number(newProduct.currentStock) : 0,
            minStockLevel: newProduct.minStockLevel ? Number(newProduct.minStockLevel) : 0,
            description: newProduct.description || undefined,
          });
        }}
        isLoading={createProduct.isPending}
        submitText="Create Product"
      >
        <FormField label="Product Name" required>
          <Input
            placeholder="e.g. Wireless Headphones"
            value={newProduct.name}
            onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="SKU">
            <Input
              placeholder="e.g. WH-001"
              value={newProduct.sku}
              onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))}
            />
          </FormField>
          <FormField label="Category">
            <Input
              placeholder="e.g. Electronics"
              value={newProduct.category}
              onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cost Price">
            <Input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={newProduct.costPrice}
              onChange={(e) => setNewProduct((p) => ({ ...p, costPrice: e.target.value }))}
            />
          </FormField>
          <FormField label="Selling Price">
            <Input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={newProduct.sellingPrice}
              onChange={(e) => setNewProduct((p) => ({ ...p, sellingPrice: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Current Stock">
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={newProduct.currentStock}
              onChange={(e) => setNewProduct((p) => ({ ...p, currentStock: e.target.value }))}
            />
          </FormField>
          <FormField label="Min Stock Level">
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={newProduct.minStockLevel}
              onChange={(e) => setNewProduct((p) => ({ ...p, minStockLevel: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField label="Unit">
          <Input
            placeholder="e.g. units, kg, litres"
            value={newProduct.unit}
            onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  )
}
