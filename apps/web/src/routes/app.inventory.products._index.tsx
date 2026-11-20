import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertTriangle,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inventoryApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/app/inventory/products/_index")({
  validateSearch: searchSchema,
  component: ProductsPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stockLevel(current: number, min: number) {
  if (current === 0) return "out";
  if (current <= min) return "low";
  return "ok";
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
            {icon || <Package className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function ProductsPage() {
  const { q: search = "", category: categoryFilter = "" } = useSearch({ from: "/app/inventory/products/_index" });
  const navigate = useNavigate({ from: "/app/inventory/products" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setCategoryFilter = (v: string) => navigate({ search: (p) => ({ ...p, category: v }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "products", search, categoryFilter],
    queryFn: () =>
      inventoryApi.products.list({
        page: 1,
        limit: 50,
        search: search || undefined,
        category: categoryFilter || undefined,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["inventory", "stats"],
    queryFn: () => inventoryApi.stats(),
  });

  const createProduct = useMutation({
    mutationFn: (payload: any) => inventoryApi.products.create(payload),
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
    mutationFn: (id: string) => inventoryApi.products.delete(id),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const products = (productsData as any)?.data ?? [];
  const totalProducts = statsData?.totalProducts ?? products.length;
  const lowStockCount =
    statsData?.lowStockCount ??
    products.filter((p: any) => stockLevel(p.currentStock, p.minStockLevel) === "low").length;
  const outOfStockCount =
    statsData?.outOfStockCount ??
    products.filter((p: any) => stockLevel(p.currentStock, p.minStockLevel) === "out").length;

  // Unique categories for filter
  const categories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));

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
            <Package className="h-6 w-6 text-primary" />
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All SKUs, stock levels, and reorder points
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No products found"

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
                {["Product", "SKU", "Category", "Stock", "Reorder Pt.", "Price", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background">
              {products.map((p: any) => {
                const level = stockLevel(p.currentStock ?? 0, p.minStockLevel ?? 0);
                const initials = (p.name ?? "?")
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase();
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-foreground">{p.name}</span>
                      </div>
                    </td>
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
                              : "text-emerald-500"
                        }`}
                      >
                        {p.currentStock ?? 0} {p.unit || "units"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {p.minStockLevel ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {p.sellingPrice ? `$${Number(p.sellingPrice).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          level === "out"
                            ? "danger"
                            : level === "low"
                              ? "warning"
                              : "success"
                        }
                      >
                        {level === "out" ? "Out of Stock" : level === "low" ? "Low Stock" : "In Stock"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteProduct.mutate(p.id)}
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

      {/* Create modal */}
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
          <FormField label="Reorder Point">
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
  );
}
