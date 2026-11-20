/**
 * Supplier Management
 *
 * Manage vendor/supplier relationships.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Truck,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Package,
  Star,
  Settings,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/suppliers")({
  component: SuppliersPage,
});

function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: suppliersData, isError, refetch} = useQuery({
    queryKey: ["inventory", "suppliers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/inventory/suppliers?page=1&limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json() as Promise<{ data: any[]; total: number }>;
    },
    placeholderData: (prev) => prev,
  });

  const suppliers = suppliersData?.data ?? [];

  const filteredSuppliers = suppliers.filter(
    (sup) =>
      sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    );
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
          <h2 className="text-lg font-semibold text-foreground">Supplier Management</h2>
          <p className="text-sm text-muted-foreground">
            {suppliers.length} suppliers / {suppliers.filter((s: any) => s.status === "active").length} active
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Add Supplier
        </Button>
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
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="border-border/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                    <p className="text-xs text-muted-foreground">{supplier.category}</p>
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
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{supplier.address}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium text-foreground">{supplier.contact}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  {renderStars(supplier.rating)}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="font-bold text-foreground">{supplier.orders}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="font-bold text-foreground">${(supplier.totalSpent / 1000).toFixed(1)}K</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<Package className="h-3 w-3" />}>
                  Orders
                </Button>
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<Edit className="h-3 w-3" />}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
