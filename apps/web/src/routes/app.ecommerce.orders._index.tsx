/**
 * eCommerce Orders Index
 *
 * Browse, filter, and manage all store orders.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  DollarSign,
  Eye,
  MoreHorizontal,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ecommerceApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

export const Route = createFileRoute("/app/ecommerce/orders/_index")({
  validateSearch: z.object({
    q: z.string().optional().default(""),
    status: z.string().optional().default("all"),
    page: z.number().optional().default(1),
  }),
  component: OrdersIndexPage,
});

interface Order {
  id: string;
  orderNumber?: string;
  customer?: string;
  customerName?: string;
  email?: string;
  itemsCount?: number;
  items?: number | unknown[];
  total?: number;
  totalAmount?: number;
  paymentStatus?: string;
  payment?: string;
  fulfillmentStatus?: string;
  status?: string;
  date?: string;
  createdAt?: string;
}

const _MOCK_ORDERS: Order[] = [
  { id: "ORD-2024-342", customer: "Michael Torres", email: "michael@example.com", items: 3, total: 459.99, status: "processing", payment: "paid", date: "Mar 20, 2024" },
  { id: "ORD-2024-341", customer: "Sarah Chen", email: "sarah@example.com", items: 1, total: 999.99, status: "shipped", payment: "paid", date: "Mar 20, 2024" },
  { id: "ORD-2024-340", customer: "Emily Zhang", email: "emily@example.com", items: 5, total: 234.50, status: "delivered", payment: "paid", date: "Mar 19, 2024" },
  { id: "ORD-2024-339", customer: "David Park", email: "david@example.com", items: 2, total: 129.98, status: "pending", payment: "pending", date: "Mar 18, 2024" },
  { id: "ORD-2024-338", customer: "Lisa Wang", email: "lisa@example.com", items: 4, total: 89.96, status: "cancelled", payment: "refunded", date: "Mar 17, 2024" },
  { id: "ORD-2024-337", customer: "Robert Kim", email: "robert@example.com", items: 1, total: 49.99, status: "pending", payment: "pending", date: "Mar 17, 2024" },
];

function getOrderId(o: Order) { return o.id ?? o.orderNumber ?? "—"; }
function getCustomer(o: Order) { return o.customer ?? o.customerName ?? "Unknown"; }
function getTotal(o: Order) { return o.total ?? o.totalAmount ?? 0; }
function getStatus(o: Order) { return o.fulfillmentStatus ?? o.status ?? "pending"; }
function getPayment(o: Order) { return o.paymentStatus ?? o.payment ?? "pending"; }
function getItemsCount(o: Order) {
  const items = o.itemsCount ?? o.items;
  if (typeof items === "number") return items;
  if (Array.isArray(items)) return items.length;
  return 0;
}
function getDate(o: Order) {
  if (o.date) return o.date;
  if (o.createdAt) return new Date(o.createdAt).toLocaleDateString();
  return "—";
}

function exportToCsv(filename: string, rows: string[][], headers: string[]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "warning" | "info" | "success" | "danger" | "default"> = {
    pending: "warning",
    processing: "info",
    shipped: "info",
    delivered: "success",
    cancelled: "danger",
  };
  return <Badge variant={map[status] ?? "default"} size="sm">{status}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "danger" | "default"> = {
    paid: "success",
    pending: "warning",
    refunded: "danger",
    failed: "danger",
  };
  return <Badge variant={map[status] ?? "default"} size="sm">{status}</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
    case "processing": return <Package className="h-4 w-4 text-blue-600" />;
    case "shipped": return <Truck className="h-4 w-4 text-blue-600" />;
    case "delivered": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "cancelled": return <XCircle className="h-4 w-4 text-red-600" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

const PAGE_SIZE = 50;

function OrdersIndexPage() {
  const { q: searchQuery, status: filterStatus, page } = useSearch({ from: Route.id });
  const navigate = useNavigate({ from: Route.fullPath });
  const setSearchQuery = (v: string) => navigate({ search: (prev: any) => ({ ...prev, q: v, page: 1 }) });
  const setFilterStatus = (v: string) => navigate({ search: (prev: any) => ({ ...prev, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (prev: any) => ({ ...prev, page: v }) });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-orders-index", filterStatus, page],
    queryFn: () =>
      ecommerceApi.orders.list({
        page,
        limit: PAGE_SIZE,
        ...(filterStatus !== "all" ? { status: filterStatus } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const markShipped = useMutation({
    mutationFn: (id: string) =>
      ecommerceApi.orders.update(id, { status: "shipped", fulfillmentStatus: "shipped" }),
    onError: (e: Error) => toast.error(e.message || "Failed to update order"),
  });

  const orders: Order[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      getOrderId(o).toLowerCase().includes(q) ||
      getCustomer(o).toLowerCase().includes(q) ||
      (o.email ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || getStatus(o) === filterStatus;
    return matchSearch && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id));
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(filtered.map((o) => o.id)));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  function handleBulkExport() {
    const selected = filtered.filter((o) => selectedIds.has(o.id));
    const headers = ["Order #", "Customer", "Status", "Items", "Total", "Date"];
    const rows = selected.map((o) => [
      getOrderId(o),
      getCustomer(o),
      getStatus(o),
      String(getItemsCount(o)),
      `$${getTotal(o).toFixed(2)}`,
      getDate(o),
    ]);
    exportToCsv("orders.csv", rows, headers);
    toast.success(`Exported ${selected.length} order${selected.length !== 1 ? "s" : ""}`);
  }

  async function handleBulkMarkShipped() {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;
    for (const id of ids) {
      try {
        await markShipped.mutateAsync(id);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    qc.invalidateQueries({ queryKey: ["ecommerce-orders-index"] });
    setSelectedIds(new Set());
    if (successCount > 0) toast.success(`Marked ${successCount} order${successCount !== 1 ? "s" : ""} as shipped`);
    if (errorCount > 0) toast.error(`Failed to update ${errorCount} order${errorCount !== 1 ? "s" : ""}`);
  }

  const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const ordersToday = orders.filter((o) => getDate(o) === todayStr).length;
  const revenueToday = orders
    .filter((o) => getDate(o) === todayStr)
    .reduce((sum, o) => sum + getTotal(o), 0);
  const pendingFulfillment = orders.filter((o) => ["pending", "processing"].includes(getStatus(o))).length;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load orders. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => {
          const headers = ["Order #", "Customer", "Status", "Items", "Total", "Date"];
          const rows = filtered.map((o) => [
            getOrderId(o),
            getCustomer(o),
            getStatus(o),
            String(getItemsCount(o)),
            `$${getTotal(o).toFixed(2)}`,
            getDate(o),
          ]);
          exportToCsv("orders.csv", rows, headers);
          toast.success(`Exported ${filtered.length} order${filtered.length !== 1 ? "s" : ""}`);
        }}>
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orders Today</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{ordersToday}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue Today</p>
                <p className="text-2xl font-black text-foreground mt-0.5">${revenueToday.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Fulfillment</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{pendingFulfillment}</p>
              </div>
              <div className="rounded-xl bg-yellow-100 p-2.5 text-yellow-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by order #, customer, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkMarkShipped}>
            <Truck className="h-4 w-4 mr-1.5" />Mark as Shipped
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                        aria-label="Select all orders"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Payment</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Fulfillment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                          aria-label={`Select order ${getOrderId(order)}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={getStatus(order)} />
                          <span className="font-mono text-sm font-medium">{getOrderId(order)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{getCustomer(order)}</p>
                        {order.email && <p className="text-xs text-muted-foreground">{order.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{getItemsCount(order)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">${getTotal(order).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center"><PaymentBadge status={getPayment(order)} /></td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={getStatus(order)} /></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{getDate(order)}</td>
                      <td className="px-4 py-3">
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
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
