import { createFileRoute } from "@tanstack/react-router";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus as PlusIcon,
  Truck,
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/field-service/parts")({
  component: Parts,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const _MOCK_PARTS = [
  { id: 1, sku: "COMP-001", name: "Compressor Scroll", category: "HVAC", qty: 12, minStock: 5, price: 450, location: "Warehouse A", lastRestocked: "Mar 15, 2026" },
  { id: 2, sku: "REF-410A", name: "Refrigerant R-410A", category: "HVAC", qty: 24, minStock: 10, price: 120, location: "Warehouse A", lastRestocked: "Mar 18, 2026" },
  { id: 3, sku: "FILT-2025", name: "HVAC Filter 20x25x1", category: "HVAC", qty: 45, minStock: 20, price: 25, location: "Warehouse A", lastRestocked: "Mar 10, 2026" },
  { id: 4, sku: "CAP-455", name: "Capacitor 45/5", category: "Electrical", qty: 18, minStock: 10, price: 35, location: "Warehouse B", lastRestocked: "Mar 12, 2026" },
  { id: 5, sku: "MOTOR-001", name: "Blower Motor", category: "HVAC", qty: 4, minStock: 5, price: 280, location: "Warehouse A", lastRestocked: "Feb 28, 2026" },
  { id: 6, sku: "PIPE-CU", name: "Copper Pipe 1/2\"", category: "Plumbing", qty: 100, minStock: 50, price: 8, location: "Warehouse B", lastRestocked: "Mar 14, 2026" },
  { id: 7, sku: "VALVE-001", name: "Expansion Valve", category: "HVAC", qty: 8, minStock: 5, price: 95, location: "Warehouse A", lastRestocked: "Mar 8, 2026" },
  { id: 8, sku: "THERM-001", name: "Smart Thermostat", category: "HVAC", qty: 2, minStock: 5, price: 185, location: "Warehouse A", lastRestocked: "Mar 1, 2026" },
];

const categories = ["All", "HVAC", "Electrical", "Plumbing", "Generators"];
const locations = ["All", "Warehouse A", "Warehouse B", "Technician Vans"];

function Parts() {
  const partsQuery = useQuery({
    queryKey: ["field-service", "parts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/field-service/jobs?limit=200`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch parts");
      return res.json();
    },
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (partsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => partsQuery.refetch()}>Retry</Button>
    </div>
  );

  const parts = (partsQuery as any)?.data?.data ?? [];

  const lowStockParts = parts.filter((p: any) => p.qty <= p.minStock);

  if (partsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/40 rounded animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Parts & Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage parts, track inventory, and control stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Truck className="h-4 w-4" />
            Restock
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Part
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-500">Low Stock Alert</h3>
              <span className="ml-auto text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">
                {lowStockParts.length} items
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {lowStockParts.map((part: any) => (
                <div key={part.id} className="p-3 rounded-lg bg-amber-500/10">
                  <p className="font-medium text-sm">{part.name}</p>
                  <p className="text-xs text-muted-foreground">{part.sku}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-amber-500">{part.qty} left</span>
                    <span className="text-xs text-muted-foreground">Min: {part.minStock}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{parts.length}</p>
            <p className="text-xs text-muted-foreground">Total Parts</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{lowStockParts.length}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">$28.4K</p>
            <p className="text-xs text-muted-foreground">Inventory Value</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">Mar 18</p>
            <p className="text-xs text-muted-foreground">Last Restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search parts..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Parts Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Part Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part: any) => (
                <tr key={part.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">{part.sku}</td>
                  <td className="px-4 py-3 text-sm font-medium">{part.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{part.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1 rounded hover:bg-muted transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className={`text-sm font-medium ${
                        part.qty <= part.minStock ? "text-amber-500" : "text-foreground"
                      }`}>{part.qty}</span>
                      <button className="p-1 rounded hover:bg-muted transition-colors">
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">${part.price}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{part.location}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      part.qty <= part.minStock ? "bg-amber-500/10 text-amber-500" :
                      part.qty <= 0 ? "bg-red-500/10 text-red-500" :
                      "bg-green-500/10 text-green-500"
                    }`}>
                      {part.qty <= part.minStock ? "Low Stock" :
                       part.qty <= 0 ? "Out of Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="px-3 py-1 text-xs rounded border border-border hover:bg-muted transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-xs rounded border border-border hover:bg-muted transition-colors">
                        Restock
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
