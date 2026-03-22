/**
 * Shipping Integration
 *
 * Configure shipping rates and carriers.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};
import {
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

const MOCK_SHIPPING_RATES = [
  { id: 1, name: "Standard Shipping", carrier: "UPS", days: "5-7 business days", rate: 9.99, minOrder: 0, maxOrder: 999, enabled: true },
  { id: 2, name: "Express Shipping", carrier: "UPS", days: "2-3 business days", rate: 19.99, minOrder: 0, maxOrder: 999, enabled: true },
  { id: 3, name: "Next Day Air", carrier: "FedEx", days: "1 business day", rate: 39.99, minOrder: 50, maxOrder: 999, enabled: true },
  { id: 4, name: "USPS Priority", carrier: "USPS", days: "2-3 business days", rate: 12.99, minOrder: 0, maxOrder: 70, enabled: true },
  { id: 5, name: "Free Shipping", carrier: "Nucleo One", days: "5-10 business days", rate: 0, minOrder: 100, maxOrder: 999, enabled: true },
];

function ShippingPage() {
  const { data: apiData, isLoading } = useQuery({
    queryKey: ["ecommerce-shipping"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/shipping?limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch shipping");
      return res.json();
    },
  });

  const shippingRates = apiData?.data?.length > 0 ? apiData.data : MOCK_SHIPPING_RATES;

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
        <Button leftIcon={<Plus className="h-4 w-4" />}>
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
            {shippingRates.map((rate) => (
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
