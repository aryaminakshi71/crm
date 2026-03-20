/**
 * Cart Settings
 *
 * Configure shopping cart settings.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShoppingCart,
  Save,
  Settings,
  Bell,
  DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/app/ecommerce/cart")({
  component: CartSettingsPage,
});

function CartSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cart Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure shopping cart behavior and appearance
          </p>
        </div>
        <Button leftIcon={<Save className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cart Behavior */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Cart Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Show Cart Drawer</p>
                <p className="text-sm text-muted-foreground">Slide-out drawer when item is added</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Guest Checkout</p>
                <p className="text-sm text-muted-foreground">Allow checkout without account</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Allow Note Field</p>
                <p className="text-sm text-muted-foreground">Let customers add order notes</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Show Continue Shopping</p>
                <p className="text-sm text-muted-foreground">Display continue shopping button</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Cart Page */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Cart Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Show Product Images</p>
                <p className="text-sm text-muted-foreground">Display product thumbnails</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Show Item Details</p>
                <p className="text-sm text-muted-foreground">SKU, variant, price breakdown</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Show Order Summary</p>
                <p className="text-sm text-muted-foreground">Subtotal, taxes, shipping total</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Quantity Selector</p>
                <p className="text-sm text-muted-foreground">Allow quantity adjustments in cart</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Limits & Restrictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Minimum Order Amount</label>
              <Input type="number" placeholder="0.00" leftIcon={<DollarSign className="h-4 w-4" />} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Maximum Items per Order</label>
              <Input type="number" placeholder="0 (unlimited)" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Maximum Quantity per Item</label>
              <Input type="number" placeholder="0 (unlimited)" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when stock is low</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Cart Recovery Emails</p>
                <p className="text-sm text-muted-foreground">Abandoned cart reminders</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Price Change Alerts</p>
                <p className="text-sm text-muted-foreground">Notify if price changes</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
