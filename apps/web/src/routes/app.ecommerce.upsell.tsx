/**
 * Upsell/Cross-sell Rules
 *
 * Configure upsell and cross-sell product recommendations.
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
  Percent,
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  TrendingUp,
  Package,
} from "lucide-react";

export const Route = createFileRoute("/app/ecommerce/upsell")({
  component: UpsellPage,
});

const MOCK_UPSELL_RULES = [
  { id: 1, name: "TV Accessories Bundle", trigger: "55\" 4K Smart TV added to cart", products: ["HDMI Cable", "TV Stand", "Soundbar"], discount: 15, status: "active", conversions: 234 },
  { id: 2, name: "Laptop Essentials", trigger: "Laptop added to cart", products: ["Laptop Bag", "Mouse", "Keyboard"], discount: 10, status: "active", conversions: 189 },
  { id: 3, name: "Sofa Add-ons", trigger: "Sofa added to cart", products: ["Throw Pillows", "Blanket", "Side Table"], discount: 20, status: "active", conversions: 145 },
  { id: 4, name: "Bike Gear", trigger: "Mountain Bike added to cart", products: ["Helmet", "Gloves", "Bike Lock"], discount: 10, status: "active", conversions: 98 },
  { id: 5, name: "Phone Accessories", trigger: "Phone added to cart", products: ["Case", "Screen Protector", "Charger"], discount: 15, status: "draft", conversions: 0 },
];

function UpsellPage() {
  const { data: apiData, isLoading } = useQuery({
    queryKey: ["ecommerce-upsell"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/upsell?limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch upsell rules");
      return res.json();
    },
  });

  const rules = apiData?.data?.length > 0 ? apiData.data : MOCK_UPSELL_RULES;

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
        <Button leftIcon={<Plus className="h-4 w-4" />}>
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
            <p className="text-2xl font-bold text-green-600">{rules.filter((r) => r.status === "active").length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Conversions</p>
            <p className="text-2xl font-bold">{rules.reduce((sum, r) => sum + r.conversions, 0)}</p>
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
            {rules.map((rule) => (
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
                    {rule.products.map((product) => (
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
