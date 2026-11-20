/**
 * eCommerce Customers Index
 *
 * View and manage store customers, LTV, and order history.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  DollarSign,
  Search,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { z } from "zod";
import { ecommerceApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/ecommerce/customers/_index")({
  validateSearch: searchSchema,
  component: CustomersIndexPage,
});

interface Customer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  ordersCount?: number;
  totalOrders?: number;
  totalSpent?: number;
  lifetimeValue?: number;
  lastOrderDate?: string;
  lastOrder?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  joinedAt?: string;
}

const _MOCK_CUSTOMERS: Customer[] = [
  { id: "C1", name: "Michael Torres", email: "michael@example.com", ordersCount: 12, totalSpent: 2349.50, lastOrderDate: "Mar 20, 2024", status: "active" },
  { id: "C2", name: "Sarah Chen", email: "sarah@example.com", ordersCount: 8, totalSpent: 1899.99, lastOrderDate: "Mar 18, 2024", status: "active" },
  { id: "C3", name: "Emily Zhang", email: "emily@example.com", ordersCount: 3, totalSpent: 459.75, lastOrderDate: "Mar 10, 2024", status: "active" },
  { id: "C4", name: "David Park", email: "david@example.com", ordersCount: 1, totalSpent: 129.98, lastOrderDate: "Feb 28, 2024", status: "inactive" },
  { id: "C5", name: "Lisa Wang", email: "lisa@example.com", ordersCount: 15, totalSpent: 5200.00, lastOrderDate: "Mar 19, 2024", status: "active" },
  { id: "C6", name: "Robert Kim", email: "robert@example.com", ordersCount: 0, totalSpent: 0, lastOrderDate: "—", status: "new" },
];

function getName(c: Customer) {
  if (c.name) return c.name;
  const parts = [c.firstName, c.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown";
}
function getOrders(c: Customer) { return c.ordersCount ?? c.totalOrders ?? 0; }
function getSpent(c: Customer) { return c.totalSpent ?? c.lifetimeValue ?? 0; }
function getLastOrder(c: Customer) {
  if (c.lastOrderDate) return c.lastOrderDate;
  if (c.lastOrder) return c.lastOrder;
  return "—";
}
function getStatus(c: Customer) {
  if (c.status) return c.status;
  if (c.isActive === true) return "active";
  if (c.isActive === false) return "inactive";
  return "active";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "default" | "info"> = {
    active: "success",
    inactive: "warning",
    new: "info",
  };
  return <Badge variant={map[status] ?? "default"} size="sm">{status}</Badge>;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function CustomersIndexPage() {
  const { q = "", status: filterStatus = "all", page = 1 } = useSearch({ from: "/app/ecommerce/customers/_index" });
  const navigate = useNavigate({ from: "/app/ecommerce/customers" });

  const searchQuery = q;
  const setSearchQuery = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val, page: 1 }) });
  const setFilterStatus = (val: string) => navigate({ search: (prev) => ({ ...prev, status: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-customers-index", page],
    queryFn: () => ecommerceApi.customers.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const customers: Customer[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      getName(c).toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || getStatus(c) === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCustomers = customers.length;
  const now = new Date();
  const thisMonth = customers.filter((c) => {
    const date = c.createdAt ?? c.joinedAt;
    if (!date) return false;
    const d = new Date(date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const avgLTV =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + getSpent(c), 0) / customers.length
      : 0;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load customers. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Customers</h2>
        <p className="text-sm text-muted-foreground">{totalCustomers} customers total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalCustomers}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New This Month</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{thisMonth}</p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg LTV</p>
                <p className="text-2xl font-black text-foreground mt-0.5">${avgLTV.toFixed(0)}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
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
          <option value="all">All Customers</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="new">New</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Total Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Last Order</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(getName(customer))}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{getName(customer)}</p>
                            <p className="text-xs text-muted-foreground">{customer.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{getOrders(customer)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">${getSpent(customer).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{getLastOrder(customer)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={getStatus(customer)} /></td>
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
