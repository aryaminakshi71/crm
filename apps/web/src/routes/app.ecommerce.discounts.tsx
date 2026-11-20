/**
 * Discount Codes
 *
 * Manage discount codes and promotions.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AlertCircle,
  Percent,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Calendar,
  Package,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ecommerceApi } from "@/lib/api";

export const Route = createFileRoute("/app/ecommerce/discounts")({
  component: DiscountsPage,
});

function DiscountsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const createDiscountMutation = useMutation({
    mutationFn: async (data: { code: string; type: string; value: number; minOrder: number }) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/v1/ecommerce/discounts`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create discount");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce", "discounts"] }),
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/v1/ecommerce/discounts/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete discount");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce", "discounts"] }),
  });

  const { data: apiData, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-discounts"],
    queryFn: () => ecommerceApi.discounts.list(),
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const discounts = (apiData as any)?.data ?? [];

  const filteredDiscounts = discounts.filter(
    (d: any) =>
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "percentage":
        return <Badge variant="info" size="sm">Percentage</Badge>;
      case "fixed":
        return <Badge variant="default" size="sm">Fixed Amount</Badge>;
      case "shipping":
        return <Badge variant="success" size="sm">Free Shipping</Badge>;
      default:
        return <Badge variant="default" size="sm">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "scheduled":
        return <Badge variant="warning" size="sm">Scheduled</Badge>;
      case "expired":
        return <Badge variant="default" size="sm">Expired</Badge>;
      case "disabled":
        return <Badge variant="danger" size="sm">Disabled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Discount Codes</h2>
          <p className="text-sm text-muted-foreground">
            {discounts.filter((d: any) => d.status === "active").length} active discounts
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          loading={createDiscountMutation.isPending}
          onClick={() => {
            const code = window.prompt("Discount code (e.g. SAVE10):");
            if (!code) return;
            createDiscountMutation.mutate({ code, type: "percentage", value: 10, minOrder: 0 });
          }}
        >
          Create Discount
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search discounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Discounts List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Minimum</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Usage</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Expires</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDiscounts.map((discount: any) => (
                  <tr key={discount.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <span className="font-mono font-bold text-foreground">{discount.code}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(discount.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{discount.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-foreground">
                        {discount.type === "shipping" ? "Free Shipping" : discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
                      </span>
                      {discount.maxDiscount && (
                        <p className="text-xs text-muted-foreground">Max: ${discount.maxDiscount}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{getTypeBadge(discount.type)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {discount.minOrder > 0 ? `$${discount.minOrder}` : "None"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-foreground">{discount.usage}</span>
                      {discount.limit && (
                        <span className="text-muted-foreground"> / {discount.limit}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(discount.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {discount.expiresAt || "Never"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          loading={deleteDiscountMutation.isPending}
                          onClick={() => deleteDiscountMutation.mutate(discount.id)}
                        >
                          <Trash2 className="h-3 w-3" />
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
