/**
 * Product Detail
 *
 * View and edit product details connected to real API.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Plus,
  Settings,
  DollarSign,
  Image,
  Save,,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { inventoryApi } from "../../lib/api";

export const Route = createFileRoute("/app/inventory/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = useParams({ from: "/app/inventory/products/$id" });
  const [activeTab, setActiveTab] = useState<"details" | "stock" | "history">("details");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const queryClient = useQueryClient();

  const { data: product, isLoading, refetch, isError} = useQuery({
    queryKey: ["inventory", "products", id],
    queryFn: () => inventoryApi.products.get(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.products.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "products", id] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => inventoryApi.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
    },
  });

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Product not found</h3>
        <Link to="/app/inventory/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleStockUpdate = (newStock: number) => {
    updateMutation.mutate({ currentStock: newStock });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/inventory/products">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <Badge variant={product.status === "active" ? "success" : "default"} size="sm">
              {product.status ?? "active"}
            </Badge>
          </div>
          {product.sku && (
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} disabled={updateMutation.isPending}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />} onClick={() => {
                setForm({
                  name: product.name,
                  description: product.description,
                  costPrice: Number(product.costPrice),
                  sellingPrice: Number(product.sellingPrice),
                  minStockLevel: product.minStockLevel,
                });
                setEditing(true);
              }}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => {
                if (confirm("Delete this product?")) deleteMutation.mutate();
              }}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {(["details", "stock", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "details" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Image className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Product Name</label>
                  <Input
                    value={editing ? form.name : product.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">SKU</label>
                  <Input value={product.sku ?? ""} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                  <Input value={product.category ?? ""} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Barcode</label>
                  <Input value={product.barcode ?? ""} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Selling Price</label>
                  <Input
                    type="number"
                    value={editing ? form.sellingPrice : Number(product.sellingPrice ?? 0)}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                    disabled={!editing}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Cost Price</label>
                  <Input
                    type="number"
                    value={editing ? form.costPrice : Number(product.costPrice ?? 0)}
                    onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                    disabled={!editing}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <textarea
                  className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
                  value={editing ? form.description : (product.description ?? "")}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Stock Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Reorder Point</label>
                <Input
                  type="number"
                  value={editing ? form.minStockLevel : (product.minStockLevel ?? 0)}
                  onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })}
                  disabled={!editing}
                />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Stock</span>
                  <span className="font-bold text-lg">{product.currentStock ?? 0}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Unit</span>
                  <span className="font-medium">{product.unit ?? "units"}</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-foreground mb-2">Quick Stock Adjustment</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStockUpdate((product.currentStock ?? 0) + 1)}
                    disabled={updateMutation.isPending}
                  >
                    +1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStockUpdate((product.currentStock ?? 0) + 10)}
                    disabled={updateMutation.isPending}
                  >
                    +10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStockUpdate(Math.max(0, (product.currentStock ?? 0) - 1))}
                    disabled={updateMutation.isPending}
                  >
                    -1
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "stock" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Stock Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-3xl font-bold">{product.currentStock ?? 0}</p>
                <p className="text-xs text-muted-foreground">{product.unit ?? "units"}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Min Stock Level</p>
                <p className="text-3xl font-bold">{product.minStockLevel ?? 0}</p>
                <p className="text-xs text-muted-foreground">reorder point</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-bold capitalize mt-2">{product.status ?? "active"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Product History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Activity history will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
