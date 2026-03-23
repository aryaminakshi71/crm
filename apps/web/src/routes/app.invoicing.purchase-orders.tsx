/**
 * Purchase Orders
 *
 * Manage purchase orders for vendors.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Truck,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/purchase-orders")({
  component: PurchaseOrders,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendor: string;
  vendorEmail: string;
  items: number;
  total: number;
  status: "draft" | "sent" | "acknowledged" | "received" | "cancelled";
  createdAt: string;
  expectedDelivery: string;
};

const mockPurchaseOrders: PurchaseOrder[] = [
  { id: "1", poNumber: "PO-2026-001", vendor: "AWS", vendorEmail: "orders@aws.amazon.com", items: 3, total: 15000, status: "received", createdAt: "2026-03-01", expectedDelivery: "2026-03-10" },
  { id: "2", poNumber: "PO-2026-002", vendor: "Google Cloud", vendorEmail: "orders@google.com", items: 2, total: 8000, status: "acknowledged", createdAt: "2026-03-05", expectedDelivery: "2026-03-15" },
  { id: "3", poNumber: "PO-2026-003", vendor: "Staples", vendorEmail: "orders@staples.com", items: 5, total: 1200, status: "sent", createdAt: "2026-03-10", expectedDelivery: "2026-03-18" },
  { id: "4", poNumber: "PO-2026-004", vendor: "Tech Supplies Inc", vendorEmail: "orders@techsupplies.com", items: 8, total: 4500, status: "draft", createdAt: "2026-03-15", expectedDelivery: "2026-03-25" },
  { id: "5", poNumber: "PO-2026-005", vendor: "Office Depot", vendorEmail: "orders@officedepot.com", items: 4, total: 850, status: "cancelled", createdAt: "2026-03-08", expectedDelivery: "2026-03-20" },
];

function PurchaseOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const purchaseOrdersQuery = useQuery({
    queryKey: ["invoicing/purchase-orders"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/purchase-orders`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
  });
  if (purchaseOrdersQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => purchaseOrdersQuery.refetch()}>Retry</Button>
    </div>
  );
  const purchaseOrders: PurchaseOrder[] = purchaseOrdersQuery.data?.data?.length ? purchaseOrdersQuery.data.data : mockPurchaseOrders;

  const filteredOrders = purchaseOrders.filter((po) => {
    if (statusFilter !== "all" && po.status !== statusFilter) return false;
    if (!search.trim()) return true;
    return (
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.vendor.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusBadge = (status: PurchaseOrder["status"]) => {
    const variants: Record<PurchaseOrder["status"], "outline" | "primary" | "success" | "warning" | "danger"> = {
      draft: "outline",
      sent: "primary",
      acknowledged: "success",
      received: "success",
      cancelled: "danger",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getStatusIcon = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "draft": return <FileText className="h-4 w-4" />;
      case "sent": return <Send className="h-4 w-4" />;
      case "acknowledged": return <CheckCircle className="h-4 w-4" />;
      case "received": return <Truck className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
    }
  };

  const totalValue = purchaseOrders.filter(po => po.status !== "cancelled").reduce((sum, po) => sum + po.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground">Manage purchase orders for vendors</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>
          New Purchase Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Open POs" value={purchaseOrders.filter(po => po.status === "sent" || po.status === "acknowledged").length + ""} />
        <StatCard title="Draft POs" value={purchaseOrders.filter(po => po.status === "draft").length + ""} />
        <StatCard title="Received This Month" value="$15K" />
        <StatCard title="Total PO Value" value={`$${(totalValue / 1000).toFixed(1)}K`} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search purchase orders..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* PO List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">PO Number</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Items</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Expected</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po) => (
                <tr key={po.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-sm">{po.poNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{po.vendor}</p>
                      <p className="text-xs text-muted-foreground">{po.vendorEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{po.items}</td>
                  <td className="px-4 py-3 text-sm font-medium">${po.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(po.status)}
                      {getStatusBadge(po.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(po.expectedDelivery).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {po.status === "draft" && (
                        <Button variant="ghost" size="sm">Edit</Button>
                      )}
                      {po.status === "sent" && (
                        <Button variant="ghost" size="sm">Remind</Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order"
        submitText="Create PO"
        onSubmit={(e) => {
          e.preventDefault();
          setIsCreateModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <FormField label="Vendor" required>
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option>Select vendor</option>
              <option>AWS</option>
              <option>Google Cloud</option>
              <option>Staples</option>
              <option>Tech Supplies Inc</option>
            </select>
          </FormField>
          <FormField label="Expected Delivery Date" required>
            <Input type="date" required />
          </FormField>
          <FormField label="Notes">
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              placeholder="Add any notes or special instructions..."
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
