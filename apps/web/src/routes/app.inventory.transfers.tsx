/**
 * Stock Transfers
 *
 * Transfer stock between warehouses.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Search,
  Plus,
  ArrowRight,
  Package,
  Warehouse,
  Clock,
  CheckCircle2,
  Truck,
  Settings,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/transfers")({
  component: StockTransfersPage,
});

const MOCK_TRANSFERS = [
  { id: "TRF-2024-001", sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', fromWarehouse: "Warehouse A", toWarehouse: "Warehouse B", quantity: 10, status: "in_transit", createdAt: "Mar 15, 2024", expectedAt: "Mar 18, 2024" },
  { id: "TRF-2024-002", sku: "ELEC-LAP-15", name: 'Laptop 15" Pro', fromWarehouse: "Warehouse A", toWarehouse: "Distribution Center", quantity: 5, status: "completed", createdAt: "Mar 14, 2024", completedAt: "Mar 16, 2024" },
  { id: "TRF-2024-003", sku: "HOME-SOF-3S", name: "3-Seater Sofa", fromWarehouse: "Warehouse B", toWarehouse: "Warehouse C", quantity: 3, status: "in_transit", createdAt: "Mar 13, 2024", expectedAt: "Mar 20, 2024" },
  { id: "TRF-2024-004", sku: "SPORT-BIKE-MTN", name: "Mountain Bike", fromWarehouse: "Warehouse B", toWarehouse: "Warehouse A", quantity: 2, status: "pending", createdAt: "Mar 18, 2024", expectedAt: "Mar 25, 2024" },
  { id: "TRF-2024-005", sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", fromWarehouse: "Warehouse C", toWarehouse: "Distribution Center", quantity: 20, status: "completed", createdAt: "Mar 10, 2024", completedAt: "Mar 12, 2024" },
  { id: "TRF-2024-006", sku: "ELEC-HEAD-WL", name: "Wireless Headphones", fromWarehouse: "Distribution Center", toWarehouse: "Warehouse A", quantity: 15, status: "in_transit", createdAt: "Mar 16, 2024", expectedAt: "Mar 19, 2024" },
];

function StockTransfersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: transfersData, isError, refetch} = useQuery({
    queryKey: ["inventory", "transfers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/inventory/transfers?page=1&limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch transfers");
      return res.json() as Promise<{ data: typeof MOCK_TRANSFERS; total: number }>;
    },
  });

  const transfers = transfersData?.data?.length ? transfersData.data : MOCK_TRANSFERS;

  const filteredTransfers = transfers.filter((trf) => {
    const matchesSearch =
      trf.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trf.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trf.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || trf.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case "in_transit":
        return <Badge variant="info" size="sm">In Transit</Badge>;
      case "completed":
        return <Badge variant="success" size="sm">Completed</Badge>;
      case "cancelled":
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "in_transit":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const summary = {
    total: transfersData?.total ?? transfers.length,
    pending: transfers.filter((t: typeof MOCK_TRANSFERS[0]) => t.status === "pending").length,
    inTransit: transfers.filter((t: typeof MOCK_TRANSFERS[0]) => t.status === "in_transit").length,
    completed: transfers.filter((t: typeof MOCK_TRANSFERS[0]) => t.status === "completed").length,
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
          <h2 className="text-lg font-semibold text-foreground">Stock Transfers</h2>
          <p className="text-sm text-muted-foreground">
            Transfer inventory between warehouses
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          New Transfer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Transfers</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600">In Transit</p>
            <p className="text-2xl font-bold text-blue-600">{summary.inTransit}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
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
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Transfers List */}
      <div className="space-y-3">
        {filteredTransfers.map((transfer) => (
          <Card key={transfer.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="mt-1">{getStatusIcon(transfer.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-medium text-foreground">{transfer.id}</span>
                    {getStatusBadge(transfer.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{transfer.name}</span>
                    <span className="text-sm text-muted-foreground">SKU: {transfer.sku}</span>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="text-sm font-medium text-foreground">{transfer.fromWarehouse}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">To</p>
                    <p className="text-sm font-medium text-foreground">{transfer.toWarehouse}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{transfer.quantity}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>

                <div className="text-right min-w-[120px]">
                  <p className="text-sm text-muted-foreground">
                    {transfer.status === "completed" ? `Completed: ${transfer.completedAt}` : `Expected: ${transfer.expectedAt}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Created: {transfer.createdAt}</p>
                </div>

                <div className="flex gap-1">
                  {transfer.status === "pending" && (
                    <Button variant="outline" size="sm">
                      Ship
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
