/**
 * Stock Levels
 *
 * View current stock levels across all warehouses.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  Search,
  Filter,
  Download,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Warehouse,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/inventory/stock")({
  component: StockLevelsPage,
});

function StockLevelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");

  const stockItems = [
    { sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', warehouse: "Warehouse A", location: "A-12-3", stock: 50, reserved: 5, available: 45, reorderPoint: 20, status: "healthy" },
    { sku: "ELEC-LAP-15", name: "Laptop 15\" Pro", warehouse: "Warehouse A", location: "A-08-1", stock: 39, reserved: 2, available: 37, reorderPoint: 15, status: "healthy" },
    { sku: "HOME-SOF-3S", name: "3-Seater Sofa", warehouse: "Warehouse B", location: "B-05-2", stock: 45, reserved: 0, available: 45, reorderPoint: 10, status: "healthy" },
    { sku: "SPORT-BIKE-MTN", name: "Mountain Bike", warehouse: "Warehouse B", location: "B-12-1", stock: 23, reserved: 3, available: 20, reorderPoint: 5, status: "healthy" },
    { sku: "ELEC-HEAD-无线", name: "Wireless Headphones", warehouse: "Warehouse A", location: "A-15-2", stock: 8, reserved: 2, available: 6, reorderPoint: 25, status: "low_stock" },
    { sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", warehouse: "Warehouse C", location: "C-02-1", stock: 156, reserved: 12, available: 144, reorderPoint: 30, status: "healthy" },
    { sku: "HOME-LAMP-LED", name: "LED Desk Lamp", warehouse: "Distribution Center", location: "DC-01-3", stock: 0, reserved: 0, available: 0, reorderPoint: 20, status: "out_of_stock" },
    { sku: "BEAU-SKR-SPF50", name: "SPF 50 Sunscreen", warehouse: "Warehouse C", location: "C-08-2", stock: 234, reserved: 8, available: 226, reorderPoint: 50, status: "healthy" },
  ];

  const warehouses = ["all", "Warehouse A", "Warehouse B", "Warehouse C", "Distribution Center"];

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = filterWarehouse === "all" || item.warehouse === filterWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const summary = {
    totalItems: stockItems.reduce((sum, i) => sum + i.stock, 0),
    totalReserved: stockItems.reduce((sum, i) => sum + i.reserved, 0),
    totalAvailable: stockItems.reduce((sum, i) => sum + i.available, 0),
    lowStock: stockItems.filter((i) => i.status === "low_stock").length,
    outOfStock: stockItems.filter((i) => i.status === "out_of_stock").length,
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Stock</p>
            <p className="text-2xl font-bold">{summary.totalItems.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Reserved</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.totalReserved.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalAvailable.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.lowStock}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{summary.outOfStock}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by SKU or product name..."
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

      {/* Stock Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Warehouse</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Reserved</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Available</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.sku} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.warehouse}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{item.location}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{item.stock}</td>
                    <td className="px-4 py-3 text-right text-yellow-600">{item.reserved}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{item.available}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
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
