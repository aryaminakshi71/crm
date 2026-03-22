/**
 * Orders
 *
 * View and manage store orders.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/ecommerce/orders")({
  component: OrdersPage,
});

const MOCK_ORDERS = [
  { id: "ORD-2024-342", customer: "Michael Torres", email: "michael@example.com", items: 3, total: 459.99, status: "pending", payment: "paid", date: "Mar 20, 2024", shipping: "Standard" },
  { id: "ORD-2024-341", customer: "Sarah Chen", email: "sarah@example.com", items: 1, total: 999.99, status: "processing", payment: "paid", date: "Mar 20, 2024", shipping: "Express" },
  { id: "ORD-2024-340", customer: "Emily Zhang", email: "emily@example.com", items: 5, total: 234.50, status: "shipped", payment: "paid", date: "Mar 19, 2024", shipping: "Standard" },
  { id: "ORD-2024-339", customer: "David Park", email: "david@example.com", items: 2, total: 129.98, status: "delivered", payment: "paid", date: "Mar 18, 2024", shipping: "Standard" },
  { id: "ORD-2024-338", customer: "Lisa Wang", email: "lisa@example.com", items: 4, total: 89.96, status: "cancelled", payment: "refunded", date: "Mar 17, 2024", shipping: "-" },
  { id: "ORD-2024-337", customer: "Robert Kim", email: "robert@example.com", items: 1, total: 49.99, status: "pending", payment: "pending", date: "Mar 17, 2024", shipping: "Standard" },
];

function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["ecommerce-orders", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`${API_BASE}/ecommerce/orders?${params}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const orders = apiData?.data?.length > 0 ? apiData.data : MOCK_ORDERS;

  const filteredOrders = orders.filter((order: typeof MOCK_ORDERS[0]) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.email ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case "processing":
        return <Badge variant="info" size="sm">Processing</Badge>;
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
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "processing":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const summary = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {summary.total} orders / {summary.pending} pending
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
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
            <p className="text-xs text-blue-600">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{summary.processing}</p>
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
            placeholder="Search by order#, customer..."
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
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="font-mono font-medium text-foreground">{order.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-center text-sm">{order.items}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{order.date}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link to="/app/ecommerce/orders/$id" params={{ id: order.id }}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
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
