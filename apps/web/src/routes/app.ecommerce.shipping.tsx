/**
 * Shipping Integration
 *
 * Configure shipping rates and carriers.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};
import {
  AlertCircle,
  Truck,
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/app/ecommerce/shipping")({
  component: ShippingPage,
});

function ShippingPage() {
  const queryClient = useQueryClient();

  const createShippingMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/ecommerce/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-shipping"] }),
  });

  const deleteShippingMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(`${API_BASE}/v1/ecommerce/shipping/${id}`, {
        method: "DELETE",
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-shipping"] }),
  });

  const { data: apiData, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-shipping"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/shipping?limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch shipping");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const shippingRates = (apiData as any)?.data ?? [];

  const carriers = [
    { id: "ups", name: "UPS", logo: "UPS", enabled: true },
    { id: "fedex", name: "FedEx", logo: "FedEx", enabled: true },
    { id: "usps", name: "USPS", logo: "USPS", enabled: true },
    { id: "dhl", name: "DHL", logo: "DHL", enabled: false },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Shipping Integration</h2>
          <p className="text-sm text-muted-foreground">
            Configure shipping carriers and rates
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => createShippingMutation.mutate({ name: "New Rate", carrier: "", rate: 0 })} disabled={createShippingMutation.isPending}>
          Add Shipping Rate
        </Button>
      </div>

      {/* Carriers */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Shipping Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {carriers.map((carrier) => (
              <div key={carrier.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">{carrier.name}</span>
                </div>
                <input type="checkbox" defaultChecked={carrier.enabled} className="rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Rates */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Shipping Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shippingRates.map((rate: any) => (
              <div key={rate.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{rate.name}</p>
                    {rate.rate === 0 && (
                      <Badge variant="success" size="sm">Free</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rate.carrier} / {rate.days}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {rate.rate === 0 ? "Free" : `$${rate.rate.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min order: ${rate.minOrder}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={rate.enabled} className="rounded" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteShippingMutation.mutate(rate.id)} disabled={deleteShippingMutation.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Shipping Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Show Estimated Delivery Date</p>
              <p className="text-sm text-muted-foreground">Display estimated delivery on product pages</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Allow Multiple Shipping Addresses</p>
              <p className="text-sm text-muted-foreground">Allow different addresses for different items</p>
            </div>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Shipping Insurance</p>
              <p className="text-sm text-muted-foreground">Offer shipping insurance to customers</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
