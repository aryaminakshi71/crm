/**
 * Stock Levels
 *
 * View current stock levels — data from real inventory products API.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Download,
  Package,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { inventoryApi } from "../lib/api";

export const Route = createFileRoute("/app/inventory/stock")({
  component: StockLevelsPage,
});

function StockLevelsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["inventory", "products", "stock"],
    queryFn: () => inventoryApi.products.list({ limit: 200 }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["inventory", "stats"],
    queryFn: () => inventoryApi.stats(),
  });

  const allProducts = data?.data ?? [];

  const filteredItems = allProducts.filter((p: any) => {
    const matchesSearch =
      (p.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatus = (product: any) => {
    if (!product.currentStock || product.currentStock === 0) return "out_of_stock";
    if (product.currentStock <= product.minStockLevel) return "low_stock";
    return "healthy";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="success" size="sm">Healthy</Badge>;
      case "low_stock":
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case "out_of_stock":
        return <Badge variant="danger" size="sm">Out of Stock</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const totalItems = allProducts.reduce((sum: number, i: any) => sum + (i.currentStock ?? 0), 0);
  const lowStock = allProducts.filter((i: any) => getStatus(i) === "low_stock").length;
  const outOfStock = allProducts.filter((i: any) => getStatus(i) === "out_of_stock").length;

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Stock Levels</h2>
          <p className="text-sm text-muted-foreground">
            Real-time inventory across all locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Stock</p>
            <p className="text-2xl font-bold">{isLoading ? "…" : totalItems.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{statsData?.totalProducts ?? (isLoading ? "…" : allProducts.length)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{isLoading ? "…" : (statsData?.lowStockCount ?? lowStock)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{isLoading ? "…" : (statsData?.outOfStockCount ?? outOfStock)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by SKU or product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stock Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Min Level</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading stock levels...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item: any) => {
                    const status = getStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{item.sku ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.category ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{item.currentStock ?? 0}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.minStockLevel ?? 0}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(status)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
