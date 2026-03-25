/**
 * Bin/Location Tracking
 *
 * Manage warehouse bin locations and shelf assignments.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Warehouse,
  Package,
  Filter,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/locations")({
  component: LocationsPage,
});

function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");

  const { data: locationsData, isError, refetch} = useQuery({
    queryKey: ["inventory", "locations"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/inventory/locations?page=1&limit=200`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json() as Promise<{ data: any[]; total: number }>;
    },
    placeholderData: (prev) => prev,
  });

  const locations = locationsData?.data ?? [];

  const warehouses = ["all", "Warehouse A", "Warehouse B", "Warehouse C", "Distribution Center"];

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = filterWarehouse === "all" || loc.warehouse === filterWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "warning":
        return <Badge variant="warning" size="sm">Warning</Badge>;
      case "full":
        return <Badge variant="danger" size="sm">Full</Badge>;
      case "empty":
        return <Badge variant="default" size="sm">Empty</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "shelf":
        return <Badge variant="info" size="sm">Shelf</Badge>;
      case "floor":
        return <Badge variant="default" size="sm">Floor</Badge>;
      case "pallet":
        return <Badge variant="default" size="sm">Pallet</Badge>;
      case "cold":
        return <Badge variant="success" size="sm">Cold Storage</Badge>;
      case "conveyor":
        return <Badge variant="warning" size="sm">Conveyor</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
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
          <h2 className="text-lg font-semibold text-foreground">Bin/Location Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Manage warehouse locations and bin assignments
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Add Location
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by location code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
        >
          {warehouses.map((wh) => (
            <option key={wh} value={wh}>
              {wh === "all" ? "All Warehouses" : wh}
            </option>
          ))}
        </select>
      </div>

      {/* Locations Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Warehouse</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Capacity</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Used</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-mono font-medium text-foreground">{loc.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{loc.warehouse}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Zone {loc.zone} / Aisle {loc.aisle}</td>
                    <td className="px-4 py-3">{getTypeBadge(loc.type)}</td>
                    <td className="px-4 py-3 text-center text-sm">{loc.capacity}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={loc.used / loc.capacity > 0.9 ? "text-red-600 font-medium" : "text-foreground"}>
                        {loc.used}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(loc.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Package className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
