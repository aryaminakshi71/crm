/**
 * Warehouse Management
 *
 * Manage warehouses and distribution centers.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Warehouse,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Package,
  Users,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/warehouses")({
  component: WarehousesPage,
});

const MOCK_WAREHOUSES = [
  { id: "wh1", name: "Warehouse A", code: "WHA", address: "123 Industrial Blvd, Los Angeles, CA 90001", manager: "John Martinez", type: "primary", capacity: 10000, used: 8500, products: 342, status: "active" },
  { id: "wh2", name: "Warehouse B", code: "WHB", address: "456 Commerce Way, Phoenix, AZ 85001", manager: "Sarah Kim", type: "secondary", capacity: 15000, used: 10800, products: 567, status: "active" },
  { id: "wh3", name: "Warehouse C", code: "WHC", address: "789 Logistics Dr, Denver, CO 80201", manager: "Michael Chen", type: "cold_storage", capacity: 8000, used: 7280, products: 189, status: "active" },
  { id: "wh4", name: "Distribution Center", code: "DC01", address: "321 Hub Street, Dallas, TX 75201", manager: "Emily Johnson", type: "distribution", capacity: 20000, used: 13000, products: 892, status: "active" },
  { id: "wh5", name: "Returns Center", code: "RC01", address: "654 Returns Blvd, Chicago, IL 60601", manager: "David Lee", type: "returns", capacity: 5000, used: 1200, products: 45, status: "active" },
];

function WarehousesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: warehousesData } = useQuery({
    queryKey: ["inventory", "warehouses"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/inventory/warehouses?page=1&limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch warehouses");
      return res.json() as Promise<{ data: typeof MOCK_WAREHOUSES; total: number }>;
    },
  });

  const warehouses = warehousesData?.data?.length ? warehousesData.data : MOCK_WAREHOUSES;

  const filteredWarehouses = warehouses.filter(
    (wh) =>
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "primary":
        return <Badge variant="info" size="sm">Primary</Badge>;
      case "secondary":
        return <Badge variant="default" size="sm">Secondary</Badge>;
      case "cold_storage":
        return <Badge variant="success" size="sm">Cold Storage</Badge>;
      case "distribution":
        return <Badge variant="warning" size="sm">Distribution</Badge>;
      case "returns":
        return <Badge variant="default" size="sm">Returns</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Warehouses</h2>
          <p className="text-sm text-muted-foreground">
            {warehousesData?.total ?? warehouses.length} locations
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Add Warehouse
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search warehouses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Warehouses Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.map((warehouse) => {
          const utilizationPercent = (warehouse.used / warehouse.capacity) * 100;
          const isWarning = utilizationPercent > 85;
          const isCritical = utilizationPercent > 95;

          return (
            <Card key={warehouse.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Warehouse className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{warehouse.name}</h3>
                      <p className="text-xs text-muted-foreground">Code: {warehouse.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(warehouse.type)}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{warehouse.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{warehouse.manager}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{warehouse.products} products</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className={`font-medium ${isCritical ? "text-red-600" : isWarning ? "text-yellow-600" : "text-foreground"}`}>
                      {warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {utilizationPercent.toFixed(1)}% utilized
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" leftIcon={<Settings className="h-3 w-3" />}>
                    Settings
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" leftIcon={<MapPin className="h-3 w-3" />}>
                    Locations
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
