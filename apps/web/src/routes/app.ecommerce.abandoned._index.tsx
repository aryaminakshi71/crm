/**
 * eCommerce Abandoned Carts Index
 *
 * Track and recover abandoned shopping carts.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { DollarSign, Mail, Search, ShoppingCart, TrendingUp } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { ecommerceApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/ecommerce/abandoned/_index")({
  validateSearch: searchSchema,
  component: AbandonedCartsPage,
});

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Less than 1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function recoveryStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "recovered":
      return <Badge className="bg-green-100 text-green-700">Recovered</Badge>;
    case "emailed":
      return <Badge className="bg-blue-100 text-blue-700">Emailed</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-700">Not Contacted</Badge>;
  }
}

function AbandonedCartsPage() {
  const queryClient = useQueryClient();
  const { q = "", status = "all" } = useSearch({ from: "/app/ecommerce/abandoned/_index" });
  const navigate = useNavigate({ from: "/app/ecommerce/abandoned" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v }) });

  const { data, isLoading } = useQuery({
    queryKey: ["ecommerce", "abandoned"],
    queryFn: () => ecommerceApi.abandoned.list(),
  });

  const recoverMutation = useMutation({
    mutationFn: async (cartId: string) => {
      const orgHeader = { "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" };
      const res = await fetch(`/api/v1/ecommerce/abandoned/${cartId}/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...orgHeader },
      });
      if (!res.ok) throw new Error("Failed to send recovery email");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Recovery email sent");
      queryClient.invalidateQueries({ queryKey: ["ecommerce", "abandoned"] });
    },
    onError: () => toast.error("Failed to send recovery email"),
  });

  const allCarts: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const carts = allCarts.filter((c) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesQ = [c.customerEmail, c.email].some((v) => String(v ?? "").toLowerCase().includes(s));
      if (!matchesQ) return false;
    }
    if (status !== "all" && (c.recoveryStatus?.toLowerCase() ?? "not contacted") !== status) return false;
    return true;
  });

  const totalAbandoned = allCarts.length;
  const recoveredCount = carts.filter((c) => c.recoveryStatus?.toLowerCase() === "recovered").length;
  const recoveryRate =
    totalAbandoned > 0 ? Math.round((recoveredCount / totalAbandoned) * 100) : 0;
  const revenueRecovered = carts
    .filter((c) => c.recoveryStatus?.toLowerCase() === "recovered")
    .reduce((acc, c) => acc + Number(c.cartValue ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abandoned Carts</h1>
        <p className="text-muted-foreground mt-1">
          Recover lost revenue from abandoned shopping sessions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Abandoned</p>
                <p className="text-2xl font-bold">{totalAbandoned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Recovery Rate</p>
                <p className="text-2xl font-bold">{recoveryRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue Recovered</p>
                <p className="text-2xl font-bold">
                  ${revenueRecovered.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="recovered">Recovered</option>
          <option value="emailed">Emailed</option>
          <option value="not contacted">Not Contacted</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abandoned Carts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : carts.length === 0 ? (
            <EmptyState
              title="No abandoned carts"
              description="No abandoned carts to recover at this time."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Items</th>
                    <th className="pb-3 pr-4 font-medium">Cart Value</th>
                    <th className="pb-3 pr-4 font-medium">Abandoned</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {carts.map((cart: any) => (
                    <tr key={cart.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">
                        {cart.customerEmail ?? cart.email ?? "Anonymous"}
                      </td>
                      <td className="py-3 pr-4 text-center font-medium">
                        {cart.itemsCount ?? cart.items?.length ?? 0}
                      </td>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        ${Number(cart.cartValue ?? cart.value ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {cart.abandonedAt ? timeAgo(cart.abandonedAt) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {recoveryStatusBadge(cart.recoveryStatus)}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => recoverMutation.mutate(cart.id)}
                          disabled={
                            recoverMutation.isPending ||
                            cart.recoveryStatus?.toLowerCase() === "recovered"
                          }
                          className="gap-1.5"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Send Recovery
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
    </div>
  );
}
