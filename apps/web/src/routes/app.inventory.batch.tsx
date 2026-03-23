/**
 * Batch Tracking
 *
 * Track items by batch/lot number.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Layers,
  Search,
  Plus,
  Filter,
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  Download,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/batch")({
  component: BatchTrackingPage,
});

const MOCK_BATCHES = [
  { batch: "BATCH-2024-001", sku: "BEAU-OFC-50ML", name: "Organic Face Cream", quantity: 100, sold: 55, remaining: 45, manufactureDate: "Jan 15, 2024", expiryDate: "Apr 15, 2024", warehouse: "Warehouse C", location: "C-08-2", status: "active" },
  { batch: "BATCH-2024-002", sku: "BEAU-SKR-SPF50", name: "SPF 50 Sunscreen", quantity: 200, sold: 120, remaining: 80, manufactureDate: "Feb 1, 2024", expiryDate: "Feb 1, 2026", warehouse: "Warehouse C", location: "C-08-1", status: "active" },
  { batch: "BATCH-2024-003", sku: "HOME-LAMP-LED", name: "LED Desk Lamp", quantity: 50, sold: 35, remaining: 15, manufactureDate: "Dec 10, 2023", expiryDate: "Dec 10, 2026", warehouse: "Distribution Center", location: "DC-01-3", status: "warning" },
  { batch: "BATCH-2023-089", sku: "ELEC-HEAD-WL", name: "Wireless Headphones", quantity: 30, sold: 22, remaining: 8, manufactureDate: "Sep 5, 2023", expiryDate: "Sep 5, 2025", warehouse: "Warehouse A", location: "A-15-2", status: "expiring_soon" },
  { batch: "BATCH-2024-004", sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", quantity: 80, sold: 24, remaining: 56, manufactureDate: "Feb 20, 2024", expiryDate: "Feb 20, 2028", warehouse: "Warehouse C", location: "C-02-1", status: "active" },
  { batch: "BATCH-2023-045", sku: "SPORT-RS-10-BLU", name: "Running Shoes Size 10", quantity: 40, sold: 32, remaining: 8, manufactureDate: "Jun 15, 2023", expiryDate: "Jun 15, 2025", warehouse: "Warehouse A", location: "A-10-2", status: "expiring_soon" },
];

function BatchTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: batchData, isError, refetch} = useQuery({
    queryKey: ["inventory", "batch"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/inventory/batch?page=1&limit=200`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json() as Promise<{ data: typeof MOCK_BATCHES; total: number }>;
    },
  });

  const batches = batchData?.data?.length ? batchData.data : MOCK_BATCHES;

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || batch.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "warning":
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case "expiring_soon":
        return <Badge variant="danger" size="sm">Expiring Soon</Badge>;
      case "expired":
        return <Badge variant="default" size="sm">Expired</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
          <h2 className="text-lg font-semibold text-foreground">Batch Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Track items by batch/lot number
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Create Batch
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by batch#, SKU, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="warning">Low Stock</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Batches Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Batch Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Quantity</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Remaining</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Manufacture Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Expiry Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBatches.map((batch) => {
                  const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
                  return (
                    <tr key={batch.batch} className={`hover:bg-muted/30 transition-colors ${
                      batch.status === "expiring_soon" ? "bg-red-50/50" : ""
                    }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <span className="font-mono font-medium text-foreground">{batch.batch}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{batch.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {batch.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{batch.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${batch.remaining <= 10 ? "text-red-600" : "text-foreground"}`}>
                          {batch.remaining}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(batch.status)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{batch.manufactureDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={`text-sm ${daysUntilExpiry <= 30 ? "text-red-600 font-medium" : "text-foreground"}`}>
                            {batch.expiryDate}
                          </span>
                          {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                            <Badge variant="danger" size="sm">{daysUntilExpiry} days left</Badge>
                          )}
                          {daysUntilExpiry <= 0 && (
                            <Badge variant="default" size="sm">Expired</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{batch.location}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
