/**
 * Upsell/Cross-sell Rules
 *
 * Configure upsell and cross-sell product recommendations.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Percent,
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  TrendingUp,
  Package,
  AlertCircle
} from "lucide-react";
import { ecommerceApi } from "@/lib/api";

export const Route = createFileRoute("/app/ecommerce/upsell")({
  component: UpsellPage,
});

function UpsellPage() {
  const queryClient = useQueryClient();

  const createUpsellMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/v1/ecommerce/upsell`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-upsell"] }),
  });

  const deleteUpsellMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/v1/ecommerce/upsell/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-upsell"] }),
  });

  const { data: apiData, isLoading, isError, refetch} = useQuery({
    queryKey: ["ecommerce-upsell"],
    queryFn: () => ecommerceApi.upsell.list(),
    placeholderData: (prev) => prev,
  });

  const rules = (apiData as any)?.data ?? [];

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
          <h2 className="text-lg font-semibold text-foreground">Upsell & Cross-sell Rules</h2>
          <p className="text-sm text-muted-foreground">
            Configure product recommendations and bundles
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => createUpsellMutation.mutate({ name: "New Rule", trigger: "", products: [], discount: 0 })} disabled={createUpsellMutation.isPending}>
          Create Rule
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Rules</p>
            <p className="text-2xl font-bold">{rules.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-green-600">Active</p>
            <p className="text-2xl font-bold text-green-600">{rules.filter((r: any) => r.status === "active").length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Conversions</p>
            <p className="text-2xl font-bold">{rules.reduce((sum: any, r: any) => sum + r.conversions, 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg. Conversion Rate</p>
            <p className="text-2xl font-bold">4.2%</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {rules.map((rule: any) => (
              <div key={rule.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{rule.name}</p>
                    <Badge variant={rule.status === "active" ? "success" : "default"} size="sm">
                      {rule.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Trigger: {rule.trigger}</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.products.map((product: any) => (
                      <Badge key={product} variant="outline" size="sm">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-lg font-bold text-green-600">{rule.discount}%</p>
                  <p className="text-xs text-muted-foreground">Discount</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-lg font-bold text-foreground">{rule.conversions}</p>
                  <p className="text-xs text-muted-foreground">Conversions</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteUpsellMutation.mutate(rule.id)} disabled={deleteUpsellMutation.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Upsell Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Enable Upsells</p>
              <p className="text-sm text-muted-foreground">Show upsell recommendations in cart</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Show on Product Pages</p>
              <p className="text-sm text-muted-foreground">Display frequently bought together</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Post-Purchase Upsells</p>
              <p className="text-sm text-muted-foreground">Show offers after checkout</p>
            </div>
            <input type="checkbox" className="rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
