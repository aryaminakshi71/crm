/**
 * Cart Settings
 *
 * Configure shopping cart settings with persistent state via org settings.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShoppingCart,
  Save,
  Settings,
  Bell,
  DollarSign,
  Plus,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

const SESSION_KEY = "ecommerce_cart_items";

export const Route = createFileRoute("/app/ecommerce/cart")({
  component: CartSettingsPage,
});

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
}

interface CartSettings {
  showCartDrawer: boolean;
  enableGuestCheckout: boolean;
  allowNoteField: boolean;
  showContinueShopping: boolean;
  showProductImages: boolean;
  showItemDetails: boolean;
  showOrderSummary: boolean;
  enableQuantitySelector: boolean;
  minimumOrderAmount: string;
  maximumItemsPerOrder: string;
  maximumQuantityPerItem: string;
  lowStockAlerts: boolean;
  cartRecoveryEmails: boolean;
  priceChangeAlerts: boolean;
}

const DEFAULT_SETTINGS: CartSettings = {
  showCartDrawer: true,
  enableGuestCheckout: true,
  allowNoteField: true,
  showContinueShopping: true,
  showProductImages: true,
  showItemDetails: true,
  showOrderSummary: true,
  enableQuantitySelector: true,
  minimumOrderAmount: "",
  maximumItemsPerOrder: "",
  maximumQuantityPerItem: "",
  lowStockAlerts: true,
  cartRecoveryEmails: true,
  priceChangeAlerts: false,
};

function CartSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<CartSettings>(DEFAULT_SETTINGS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"settings" | "cart">("settings");

  // Load cart items from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setCartItems(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  // Persist cart items to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Load existing org settings
  const { data: orgSettings } = useQuery({
    queryKey: ["org-settings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/settings/organization`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (orgSettings?.preferences?.ecommerceCart) {
      setSettings((prev) => ({
        ...prev,
        ...(orgSettings.preferences.ecommerceCart as Partial<CartSettings>),
      }));
    }
  }, [orgSettings]);

  // Save cart settings to org settings
  const saveSettings = useMutation({
    mutationFn: async (s: CartSettings) => {
      const existingPrefs = orgSettings?.preferences ?? {};
      const res = await fetch(`${API_BASE}/v1/settings/organization`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          preferences: { ...existingPrefs, ecommerceCart: s },
        }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      toast.success("Cart settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save settings");
    },
  });

  // Checkout mutation — creates an order from cart items
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (cartItems.length === 0) throw new Error("Cart is empty");
      const res = await fetch(`${API_BASE}/v1/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          customer: { name: "Guest", email: "guest@example.com" },
          items: cartItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });
      if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      setCartItems([]);
      sessionStorage.removeItem(SESSION_KEY);
      toast.success("Order placed successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Checkout failed");
    },
  });

  const updateQty = (id: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const cartTotal = cartItems.reduce((s, item) => s + item.price * item.quantity, 0);

  const toggle = (key: keyof CartSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cart</h2>
          <p className="text-sm text-muted-foreground">
            Manage cart items and configure cart behavior
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              activeTab === "cart" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted/50"
            }`}
          >
            <ShoppingCart className="h-4 w-4 inline mr-1" />
            Cart ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              activeTab === "settings" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted/50"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-1" />
            Settings
          </button>
        </div>
      </div>

      {/* Cart Items Tab */}
      {activeTab === "cart" && (
        <div className="space-y-4">
          {cartItems.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">Cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add products from the Products catalog to test checkout.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-border/60">
                <CardContent className="p-4 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border/40">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                        <p className="text-sm font-semibold text-primary mt-1">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted text-sm font-bold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted text-sm font-bold"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10 flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold">$9.99</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span className="font-semibold">${(cartTotal * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>${(cartTotal + 9.99 + cartTotal * 0.08).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? "Processing…" : "Checkout"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <>
          <div className="flex justify-end">
            <Button
              leftIcon={<Save className="h-4 w-4" />}
              onClick={() => saveSettings.mutate(settings)}
              disabled={saveSettings.isPending}
            >
              {saveSettings.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cart Behavior */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Cart Behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    ["showCartDrawer", "Show Cart Drawer", "Slide-out drawer when item is added"],
                    ["enableGuestCheckout", "Enable Guest Checkout", "Allow checkout without account"],
                    ["allowNoteField", "Allow Note Field", "Let customers add order notes"],
                    ["showContinueShopping", "Show Continue Shopping", "Display continue shopping button"],
                  ] as [keyof CartSettings, string, string][]
                ).map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[key] as boolean}
                      onChange={() => toggle(key)}
                      className="rounded accent-primary"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cart Page */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Cart Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    ["showProductImages", "Show Product Images", "Display product thumbnails"],
                    ["showItemDetails", "Show Item Details", "SKU, variant, price breakdown"],
                    ["showOrderSummary", "Show Order Summary", "Subtotal, taxes, shipping total"],
                    ["enableQuantitySelector", "Enable Quantity Selector", "Allow quantity adjustments in cart"],
                  ] as [keyof CartSettings, string, string][]
                ).map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[key] as boolean}
                      onChange={() => toggle(key)}
                      className="rounded accent-primary"
                    />
                  </div>
                ))}
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
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={settings.minimumOrderAmount}
                    onChange={(e) => setSettings((s) => ({ ...s, minimumOrderAmount: e.target.value }))}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Maximum Items per Order</label>
                  <Input
                    type="number"
                    placeholder="0 (unlimited)"
                    value={settings.maximumItemsPerOrder}
                    onChange={(e) => setSettings((s) => ({ ...s, maximumItemsPerOrder: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Maximum Quantity per Item</label>
                  <Input
                    type="number"
                    placeholder="0 (unlimited)"
                    value={settings.maximumQuantityPerItem}
                    onChange={(e) => setSettings((s) => ({ ...s, maximumQuantityPerItem: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    ["lowStockAlerts", "Low Stock Alerts", "Notify when stock is low"],
                    ["cartRecoveryEmails", "Cart Recovery Emails", "Abandoned cart reminders"],
                    ["priceChangeAlerts", "Price Change Alerts", "Notify if price changes"],
                  ] as [keyof CartSettings, string, string][]
                ).map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[key] as boolean}
                      onChange={() => toggle(key)}
                      className="rounded accent-primary"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
