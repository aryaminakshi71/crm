/**
 * Product Catalog
 *
 * Browse and manage product catalog with real API integration.
 */

import { Badge, Button, Card, CardContent, Input, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Package,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Grid,
  List,
  Image,
  DollarSign,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { inventoryApi } from "@/lib/api";

export const Route = createFileRoute("/app/inventory/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "products", { search: searchQuery, category: filterCategory, status: filterStatus }],
    queryFn: () =>
      inventoryApi.products.list({
        search: searchQuery || undefined,
        category: filterCategory || undefined,
        status: filterStatus || undefined,
        limit: 100,
      }),
    placeholderData: (prev) => prev,
  });

  const products = data?.data ?? [];
  const total = data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
      setDeleteProductId(null);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "low_stock":
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case "out_of_stock":
      case "inactive":
        return <Badge variant="danger" size="sm">{status === "out_of_stock" ? "Out of Stock" : "Inactive"}</Badge>;
      case "discontinued":
        return <Badge variant="default" size="sm">Discontinued</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getProductStatus = (product: any) => {
    if (product.currentStock === 0) return "out_of_stock";
    if (product.currentStock <= product.minStockLevel) return "low_stock";
    return product.status ?? "active";
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Product Catalog</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${total} products`}
          </p>
        </div>
        <Link to="/app/inventory/products/new">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports">Sports</option>
            <option value="Apparel">Apparel</option>
            <option value="Beauty">Beauty</option>
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={`p-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading products...</div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: any) => {
            const statusKey = getProductStatus(product);
            return (
              <Card key={product.id} className="border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(statusKey)}
                    {product.category && (
                      <span className="text-xs text-muted-foreground">{product.category}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{product.name}</h3>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground mb-3">SKU: {product.sku}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    {product.sellingPrice && (
                      <span className="text-lg font-bold text-foreground">
                        ${Number(product.sellingPrice).toFixed(2)}
                      </span>
                    )}
                    {product.costPrice && (
                      <span className="text-sm text-muted-foreground">
                        Cost: ${Number(product.costPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className={product.currentStock <= product.minStockLevel ? "text-yellow-600" : "text-muted-foreground"}>
                      Stock: {product.currentStock ?? 0}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/app/inventory/products/$id" params={{ id: product.id }} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit className="h-3 w-3" />}>
                        Edit
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteProductId(product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product: any) => {
            const statusKey = getProductStatus(product);
            return (
              <Card key={product.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        {getStatusBadge(statusKey)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.sku && `SKU: ${product.sku}`}
                        {product.category && ` / ${product.category}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {product.sellingPrice && (
                        <p className="font-bold text-foreground">${Number(product.sellingPrice).toFixed(2)}</p>
                      )}
                      {product.costPrice && (
                        <p className="text-xs text-muted-foreground">Cost: ${Number(product.costPrice).toFixed(2)}</p>
                      )}
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className={`font-medium ${product.currentStock <= product.minStockLevel ? "text-yellow-600" : "text-foreground"}`}>
                        {product.currentStock ?? 0} in stock
                      </p>
                      {product.minStockLevel > 0 && (
                        <p className="text-xs text-muted-foreground">Reorder: {product.minStockLevel}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link to="/app/inventory/products/$id" params={{ id: product.id }}>
                        <Button variant="outline" size="sm" leftIcon={<Edit className="h-3 w-3" />}>
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteProductId(product.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProductId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && deleteMutation.mutate(deleteProductId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isLoading && products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter criteria, or add a new product.
          </p>
          <Link to="/app/inventory/products/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
