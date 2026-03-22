/**
 * Checkout Settings
 *
 * Configure checkout process and payment options.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  Save,
  Settings,
  Lock,
  Shield,
  Truck,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/ecommerce/checkout")({
  component: CheckoutSettingsPage,
});

function CheckoutSettingsPage() {
  const createOrderMutation = useMutation({
    mutationFn: async (orderPayload: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Checkout Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure checkout process and payment options
          </p>
        </div>
        <Button leftIcon={<Save className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Checkout Options */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Checkout Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Guest Checkout</p>
                <p className="text-sm text-muted-foreground">Allow checkout without account</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Account Creation</p>
                <p className="text-sm text-muted-foreground">Offer account creation after purchase</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Express Checkout</p>
                <p className="text-sm text-muted-foreground">Apple Pay, Google Pay, etc.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Order Confirmation Email</p>
                <p className="text-sm text-muted-foreground">Send confirmation after purchase</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
              <Button variant="outline" size="sm">Add Payment Method</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Credit/Debit Cards", icon: CreditCard, enabled: true },
              { name: "PayPal", icon: CreditCard, enabled: true },
              { name: "Apple Pay", icon: CreditCard, enabled: true },
              { name: "Google Pay", icon: CreditCard, enabled: false },
              { name: "Bank Transfer", icon: CreditCard, enabled: false },
            ].map((method) => (
              <div key={method.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <method.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{method.name}</span>
                </div>
                <input type="checkbox" defaultChecked={method.enabled} className="rounded" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Checkout Form Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Email", required: true },
              { name: "First Name", required: true },
              { name: "Last Name", required: true },
              { name: "Company", required: false },
              { name: "Phone", required: true },
              { name: "Address", required: true },
              { name: "City", required: true },
              { name: "State/Province", required: true },
              { name: "ZIP/Postal Code", required: true },
              { name: "Country", required: true },
              { name: "Order Notes", required: false },
            ].map((field) => (
              <div key={field.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{field.name}</span>
                  {field.required && <span className="text-red-500">*</span>}
                </div>
                <div className="flex items-center gap-2">
                  <select className="h-8 rounded border border-input bg-background px-2 text-sm">
                    <option>Required</option>
                    <option>Optional</option>
                    <option>Hidden</option>
                  </select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Security & Trust</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">SSL Certificate</p>
                <p className="text-sm text-muted-foreground">Secure checkout with SSL</p>
              </div>
              <Badge variant="success" size="sm">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">PCI Compliance</p>
                <p className="text-sm text-muted-foreground">Payment card industry standards</p>
              </div>
              <Badge variant="success" size="sm">Compliant</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Fraud Protection</p>
                <p className="text-sm text-muted-foreground">Built-in fraud detection</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium text-foreground">Your checkout is secure</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We use industry-standard encryption to protect your personal information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
