/**
 * Purchase Orders
 *
 * Manage purchase orders for inventory replenishment.
 * Supports full status workflow: draft → submitted → approved → received.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  Settings,
  Download,
  AlertCircle,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { inventoryApi } from "@/lib/api";

const searchSchema = z.object({
  search: z.string().optional().default(""),
  status: z.string().optional().default("all"),
});

export const Route = createFileRoute("/app/inventory/purchase-orders")({
  validateSearch: searchSchema,
  component: PurchaseOrdersPage,
});


const SUPPLIER_CHART_DATA = [
  { supplier: "TechSupply Co.", value: 25220 },
  { supplier: "Global Electronics", value: 12950 },
  { supplier: "Fashion Forward", value: 12300 },
  { supplier: "HomeStyle", value: 5600 },
  { supplier: "Sports Gear", value: 7800 },
];

type PO = any & { deliveredAt?: string; reason?: string };

const STATUS_WORKFLOW: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["approved", "cancelled"],
  pending: ["approved", "cancelled"],
  approved: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function PurchaseOrdersPage() {
  const { search, status: filterStatus } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchQuery, setSearchQuery] = useState(search ?? "");
  const [statusFilter, setStatusFilter] = useState(filterStatus ?? "all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPO, setNewPO] = useState({ supplier: "", items: "", total: "", expectedAt: "" });

  const queryClient = useQueryClient();

  const { data: purchaseOrdersData, isError, refetch } = useQuery({
    queryKey: ["inventory", "purchase-orders"],
    queryFn: () => inventoryApi.purchaseOrders.list({ limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const purchaseOrders: PO[] = purchaseOrdersData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.purchaseOrders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "purchase-orders"] });
      toast.success("Purchase order created");
      setShowCreateForm(false);
      setNewPO({ supplier: "", items: "", total: "", expectedAt: "" });
    },
    onError: () => toast.error("Failed to create purchase order"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      inventoryApi.purchaseOrders.updateStatus(id, status),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "purchase-orders"] });
      toast.success(`Order moved to ${status}`);
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="default" size="sm">Draft</Badge>;
      case "submitted":
      case "pending": return <Badge variant="warning" size="sm">Pending</Badge>;
      case "approved": return <Badge variant="info" size="sm">Approved</Badge>;
      case "shipped": return <Badge variant="info" size="sm">Shipped</Badge>;
      case "delivered": return <Badge variant="success" size="sm">Delivered</Badge>;
      case "cancelled": return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default: return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "cancelled": return <XCircle className="h-5 w-5 text-red-600" />;
      case "shipped": return <Truck className="h-5 w-5 text-blue-600" />;
      case "pending":
      case "submitted":
      case "approved": return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const summary = {
    total: purchaseOrdersData?.total ?? purchaseOrders.length,
    pending: purchaseOrders.filter((po) => ["pending", "submitted"].includes(po.status)).length,
    shipped: purchaseOrders.filter((po) => po.status === "shipped").length,
    delivered: purchaseOrders.filter((po) => po.status === "delivered").length,
  };

  const chartData =
    purchaseOrdersData?.data?.length
      ? Object.entries(
          purchaseOrders.reduce((acc: Record<string, number>, po) => {
            acc[po.supplier] = (acc[po.supplier] ?? 0) + (po.total ?? 0);
            return acc;
          }, {}),
        ).map(([supplier, value]) => ({ supplier: supplier.split(" ").slice(0, 2).join(" "), value }))
      : SUPPLIER_CHART_DATA;

  if (isError)
    return (
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
          <h2 className="text-lg font-semibold text-foreground">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground">
            {summary.total} orders · {summary.pending} pending · {summary.shipped} in transit
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateForm(true)}>
          Create PO
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">New Purchase Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Supplier</label>
                <Input
                  placeholder="Supplier name"
                  value={newPO.supplier}
                  onChange={(e) => setNewPO((p) => ({ ...p, supplier: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Items</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newPO.items}
                  onChange={(e) => setNewPO((p) => ({ ...p, items: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Total ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newPO.total}
                  onChange={(e) => setNewPO((p) => ({ ...p, total: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Expected Date</label>
                <Input
                  type="date"
                  value={newPO.expectedAt}
                  onChange={(e) => setNewPO((p) => ({ ...p, expectedAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button
                size="sm"
                disabled={!newPO.supplier || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    supplier: newPO.supplier,
                    items: parseInt(newPO.items) || 0,
                    total: parseFloat(newPO.total) || 0,
                    expectedAt: newPO.expectedAt,
                    status: "draft",
                  })
                }
              >
                {createMutation.isPending ? "Creating..." : "Create Draft"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600">Shipped</p>
            <p className="text-2xl font-bold text-blue-600">{summary.shipped}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-green-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{summary.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* PO Value by Supplier Chart */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">PO Value by Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="supplier" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO# or supplier..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              navigate({ search: (prev: any) => ({ ...prev, search: e.target.value }) });
            }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              navigate({ search: (prev: any) => ({ ...prev, status: e.target.value }) });
            }}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">PO Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Expected</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po) => {
                    const nextStatuses = STATUS_WORKFLOW[po.status] ?? [];
                    return (
                      <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(po.status)}
                            <span className="font-mono font-medium text-foreground">{po.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{po.supplier}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(po.status)}</td>
                        <td className="px-4 py-3 text-center text-sm">{po.items}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          ${(po.total ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{po.createdAt}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {(po as any).deliveredAt ? (po as any).deliveredAt : po.expectedAt}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {nextStatuses.map((ns) => (
                              <Button
                                key={ns}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs capitalize"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: po.id, status: ns })}
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                {ns}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
