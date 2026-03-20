/**
 * Purchase Orders
 *
 * Manage purchase orders for inventory replenishment.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/inventory/purchase-orders")({
  component: PurchaseOrdersPage,
});

function PurchaseOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const purchaseOrders = [
    { id: "PO-2024-001", supplier: "TechSupply Co.", status: "pending", items: 5, total: 15420.00, createdAt: "Mar 15, 2024", expectedAt: "Mar 22, 2024" },
    { id: "PO-2024-002", supplier: "Global Electronics", status: "approved", items: 3, total: 8750.00, createdAt: "Mar 14, 2024", expectedAt: "Mar 21, 2024" },
    { id: "PO-2024-003", supplier: "Fashion Forward Inc.", status: "shipped", items: 8, total: 12300.00, createdAt: "Mar 10, 2024", expectedAt: "Mar 17, 2024" },
    { id: "PO-2024-004", supplier: "HomeStyle Wholesale", status: "delivered", items: 2, total: 5600.00, createdAt: "Mar 5, 2024", deliveredAt: "Mar 12, 2024" },
    { id: "PO-2024-005", supplier: "Sports Gear Direct", status: "cancelled", items: 4, total: 7800.00, createdAt: "Mar 1, 2024", reason: "Supplier out of stock" },
    { id: "PO-2024-006", supplier: "TechSupply Co.", status: "draft", items: 6, total: 9800.00, createdAt: "Mar 18, 2024", expectedAt: "Mar 25, 2024" },
  ];

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || po.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="default" size="sm">Draft</Badge>;
      case "pending":
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case "approved":
        return <Badge variant="info" size="sm">Approved</Badge>;
      case "shipped":
        return <Badge variant="info" size="sm">Shipped</Badge>;
      case "delivered":
        return <Badge variant="success" size="sm">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "pending":
      case "approved":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const summary = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter((po) => po.status === "pending").length,
    shipped: purchaseOrders.filter((po) => po.status === "shipped").length,
    delivered: purchaseOrders.filter((po) => po.status === "delivered").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground">
            {summary.total} orders / {summary.pending} pending / {summary.shipped} in transit
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Create PO
        </Button>
      </div>

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

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO# or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((po) => (
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
                    <td className="px-4 py-3 text-right font-medium text-foreground">${po.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{po.createdAt}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {po.deliveredAt ? po.deliveredAt : po.expectedAt}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3 w-3" />
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
