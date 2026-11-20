/**
 * Stock Adjustments
 *
 * Make stock corrections and adjustments — connected to real inventory products API.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Search,
  Plus,
  Minus,
  Save,
  Package,
  User,
  Clock,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { inventoryApi } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/adjustments")({
  component: StockAdjustmentsPage,
});

function StockAdjustmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    sku: "",
    quantity: 0,
    reason: "",
  });
  const [localAdjustments, setLocalAdjustments] = useState<any[]>([]);

  const queryClient = useQueryClient();

  const { data: productsData, isLoading: productsLoading, isError, refetch} = useQuery({
    queryKey: ["inventory", "products", { search: searchQuery }],
    queryFn: () => inventoryApi.products.list({ search: searchQuery || undefined, limit: 50 }),
    placeholderData: (prev) => prev,
  });

  const products = productsData?.data ?? [];

  const adjustMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const product = products.find((p: any) => p.id === productId || p.sku === productId);
      if (!product) throw new Error("Product not found");
      const newStock = Math.max(0, (product.currentStock ?? 0) + quantity);
      return inventoryApi.products.update(productId, { currentStock: newStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "stats"] });
    },
  });

  const reasons = [
    "Cycle count",
    "Damaged goods",
    "Lost in transit",
    "Found in storage",
    "Theft/Shrinkage",
    "Quality issue",
    "Return processed",
    "System correction",
    "Other",
  ];

  const handleSubmit = () => {
    if (newAdjustment.sku && newAdjustment.quantity !== 0 && newAdjustment.reason) {
      const product = products.find((p: any) => p.sku === newAdjustment.sku || p.id === newAdjustment.sku);
      if (product) {
        adjustMutation.mutate({ productId: product.id, quantity: newAdjustment.quantity });
      }
      setLocalAdjustments([
        {
          id: Date.now(),
          sku: newAdjustment.sku,
          name: product?.name ?? "Product",
          currentStock: (product?.currentStock ?? 0) + newAdjustment.quantity,
          adjustment: newAdjustment.quantity,
          reason: newAdjustment.reason,
          date: new Date().toLocaleDateString(),
          user: "Current User",
        },
        ...localAdjustments,
      ]);
      setNewAdjustment({ sku: "", quantity: 0, reason: "" });
      setShowForm(false);
    }
  };

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
          <h2 className="text-lg font-semibold text-foreground">Stock Adjustments</h2>
          <p className="text-sm text-muted-foreground">
            Make corrections to inventory quantities
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(!showForm)}>
          New Adjustment
        </Button>
      </div>

      {/* New Adjustment Form */}
      {showForm && (
        <Card className="border-border/60 border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Create Stock Adjustment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Product SKU *</label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={newAdjustment.sku}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, sku: e.target.value })}
                >
                  <option value="">Select product...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.sku ?? p.id}>
                      {p.sku ? `${p.sku} - ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Reason *</label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={newAdjustment.reason}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })}
                >
                  <option value="">Select reason</option>
                  {reasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Adjustment Quantity *</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setNewAdjustment({ ...newAdjustment, quantity: newAdjustment.quantity - 1 })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={newAdjustment.quantity}
                    onChange={(e) => setNewAdjustment({ ...newAdjustment, quantity: parseInt(e.target.value) || 0 })}
                    className="w-24 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setNewAdjustment({ ...newAdjustment, quantity: newAdjustment.quantity + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className={`text-sm font-medium ${newAdjustment.quantity > 0 ? "text-green-600" : newAdjustment.quantity < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                  {newAdjustment.quantity > 0 ? "+" : ""}{newAdjustment.quantity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use negative numbers to decrease stock
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} leftIcon={<Save className="h-4 w-4" />} disabled={adjustMutation.isPending}>
                Submit Adjustment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustments History */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Adjustment History</CardTitle>
        </CardHeader>
        <CardContent>
          {localAdjustments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowLeftRight className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No adjustments recorded yet. Create a new adjustment above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {localAdjustments.map((adj) => (
                <div
                  key={adj.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className={`rounded-full p-2 ${adj.adjustment > 0 ? "bg-green-100" : "bg-red-100"}`}>
                    {adj.adjustment > 0 ? (
                      <Plus className="h-5 w-5 text-green-600" />
                    ) : (
                      <Minus className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{adj.name}</span>
                      <span className="text-sm text-muted-foreground">SKU: {adj.sku}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {adj.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${adj.adjustment > 0 ? "text-green-600" : "text-red-600"}`}>
                      {adj.adjustment > 0 ? "+" : ""}{adj.adjustment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      New stock: {adj.currentStock}
                    </p>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {adj.user}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {adj.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
