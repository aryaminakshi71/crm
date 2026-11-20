/**
 * eCommerce Discounts Index
 *
 * Manage discount codes, coupons, and promotions.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Percent,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ecommerceApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/ecommerce/discounts/_index")({
  validateSearch: searchSchema,
  component: DiscountsIndexPage,
});

interface Discount {
  id: string;
  code?: string;
  type?: "percentage" | "fixed" | "percent" | string;
  value?: number;
  amount?: number;
  usageCount?: number;
  uses?: number;
  usageLimit?: number | null;
  limit?: number;
  expiresAt?: string | null;
  expiry?: string;
  status?: string;
  isActive?: boolean;
  startsAt?: string;
}

const _MOCK_DISCOUNTS: Discount[] = [
  { id: "D1", code: "SUMMER20", type: "percentage", value: 20, usageCount: 142, usageLimit: 500, expiresAt: "2024-08-31", status: "active" },
  { id: "D2", code: "WELCOME10", type: "fixed", value: 10, usageCount: 89, usageLimit: 1000, expiresAt: "2024-12-31", status: "active" },
  { id: "D3", code: "FLASH50", type: "percentage", value: 50, usageCount: 500, usageLimit: 500, expiresAt: "2024-03-15", status: "expired" },
  { id: "D4", code: "LAUNCH25", type: "percentage", value: 25, usageCount: 0, usageLimit: 200, expiresAt: "2024-05-01", status: "scheduled" },
  { id: "D5", code: "VIP15", type: "fixed", value: 15, usageCount: 34, usageLimit: null, expiresAt: null, status: "active" },
];

function getDiscountLabel(d: Discount) {
  const type = d.type ?? "percentage";
  const val = d.value ?? d.amount ?? 0;
  if (type === "percentage" || type === "percent") return `${val}% off`;
  return `$${val} off`;
}
function getUsage(d: Discount) { return d.usageCount ?? d.uses ?? 0; }
function getLimit(d: Discount) { return d.usageLimit ?? d.limit ?? null; }
function getExpiry(d: Discount) {
  const raw = d.expiresAt ?? d.expiry;
  if (!raw) return "No expiry";
  return new Date(raw).toLocaleDateString();
}
function getStatus(d: Discount) {
  if (d.status) return d.status;
  if (d.isActive === true) return "active";
  if (d.isActive === false) return "inactive";
  return "active";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "danger" | "warning" | "info" | "default"> = {
    active: "success",
    expired: "danger",
    scheduled: "info",
    inactive: "warning",
  };
  return <Badge variant={map[status] ?? "default"} size="sm">{status}</Badge>;
}

function DiscountsIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", page = 1 } = useSearch({ from: "/app/ecommerce/discounts/_index" });
  const navigate = useNavigate({ from: "/app/ecommerce/discounts" });

  const searchQuery = q;
  const setSearchQuery = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"percentage" | "fixed">("percentage");
  const [newValue, setNewValue] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-discounts-index", page],
    queryFn: () => ecommerceApi.discounts.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { code: string; type: string; value: number }) =>
      ecommerceApi.discounts.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-discounts-index"] });
      setShowCreate(false);
      setNewCode("");
      setNewValue("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ecommerceApi.discounts.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-discounts-index"] }),
  });

  const discounts: Discount[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = discounts.filter((d) => {
    const q = searchQuery.toLowerCase();
    return !q || (d.code ?? "").toLowerCase().includes(q);
  });

  const activeDiscounts = discounts.filter((d) => getStatus(d) === "active").length;
  const totalUsage = discounts.reduce((sum, d) => sum + getUsage(d), 0);
  const totalRevImpact = discounts.reduce((sum, d) => {
    const val = d.value ?? d.amount ?? 0;
    const uses = getUsage(d);
    const type = d.type ?? "percentage";
    return sum + (type === "fixed" ? val * uses : 0);
  }, 0);

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load discounts. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Discounts</h2>
          <p className="text-sm text-muted-foreground">Manage discount codes and promotions</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Create Discount
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Discounts</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{activeDiscounts}</p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <Tag className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalUsage.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Percent className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue Impact</p>
                <p className="text-2xl font-black text-foreground mt-0.5">${totalRevImpact.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <Percent className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">New Discount Code</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder="Code (e.g. SAVE20)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              />
              <select
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value as "percentage" | "fixed")}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
              <Input
                type="number"
                placeholder={newType === "percentage" ? "Value (e.g. 20)" : "Amount (e.g. 10)"}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newCode || !newValue || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({ code: newCode, type: newType, value: parseFloat(newValue) })
                }
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search discount codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Tag className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No discounts found</p>
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                Create Discount
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Usage</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Limit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Expiry</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((discount) => (
                    <tr key={discount.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-sm tracking-wider">{discount.code}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{getDiscountLabel(discount)}</td>
                      <td className="px-4 py-3 text-center text-sm">{getUsage(discount)}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {getLimit(discount) ?? "Unlimited"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{getExpiry(discount)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={getStatus(discount)} /></td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(discount.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
