/**
 * Dropshipping
 *
 * Manage dropshipping suppliers and settings.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Truck,
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { ecommerceApi } from "@/lib/api";

export const Route = createFileRoute("/app/ecommerce/dropship")({
  component: DropshippingPage,
});

function DropshippingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const createDropshipMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/v1/ecommerce/dropship`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-dropship-shipping"] }),
  });

  const deleteDropshipMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/v1/ecommerce/dropship/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-dropship-shipping"] }),
  });

  const { data: apiData, isLoading, isError, refetch} = useQuery({
    queryKey: ["ecommerce-dropship-shipping"],
    queryFn: () => ecommerceApi.dropship.list(),
    placeholderData: (prev) => prev,
  });

  const suppliers = (apiData as any)?.data ?? [];

  const filteredSuppliers = suppliers.filter(
    (s: any) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s: any) => s.status === "active").length,
    totalProducts: suppliers.reduce((sum: number, s: any) => sum + (s.productCount ?? 0), 0),
    totalOrders: suppliers.reduce((sum: number, s: any) => sum + (s.totalOrders ?? 0), 0),
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
          <h2 className="text-lg font-semibold text-foreground">Dropshipping</h2>
          <p className="text-sm text-muted-foreground">
            Manage dropshipping suppliers and product sourcing
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => createDropshipMutation.mutate({ name: "New Supplier", email: "", country: "" })} disabled={createDropshipMutation.isPending}>
          Add Supplier
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.totalSuppliers}</p>
                <p className="text-xs text-muted-foreground">Total Suppliers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{summary.activeSuppliers}</p>
                <p className="text-xs text-muted-foreground">Active Suppliers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{summary.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Dropship Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowRight className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{summary.totalOrders.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier: any) => (
          <Card key={supplier.id} className={`border-border/60 ${supplier.status === "inactive" ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {supplier.country}
                    </p>
                  </div>
                </div>
                <Badge variant={supplier.status === "active" ? "success" : "default"} size="sm">
                  {supplier.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{supplier.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-foreground">{supplier.productCount}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-foreground">{supplier.rating}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-foreground">{supplier.leadTime}</p>
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-foreground">
                    {supplier.shippingCost === 0 ? "Free" : `$${supplier.shippingCost.toFixed(2)}`}
                  </span>
                  <span className="text-xs text-muted-foreground">shipping</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDropshipMutation.mutate(supplier.id)} disabled={deleteDropshipMutation.isPending}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Dropshipping Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto Order Fulfillment</p>
              <p className="text-sm text-muted-foreground">Automatically send orders to suppliers</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Sync Inventory</p>
              <p className="text-sm text-muted-foreground">Keep stock levels updated from suppliers</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Price Markup</p>
              <p className="text-sm text-muted-foreground">Default markup percentage on cost</p>
            </div>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
              <option>10%</option>
              <option>20%</option>
              <option selected>30%</option>
              <option>50%</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
