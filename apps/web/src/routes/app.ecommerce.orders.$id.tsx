/**
 * Order Detail
 *
 * View and manage order details.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  Printer,
  Download,
  AlertCircle
} from "lucide-react";

export const Route = createFileRoute("/app/ecommerce/orders/$id")({
  component: OrderDetailPage,
});

const MOCK_ORDER = {
  id: "ORD-2024-342",
  status: "processing",
  date: "Mar 20, 2024",
  customer: {
    name: "Michael Torres",
    email: "michael@example.com",
    phone: "+1-555-0123",
  },
  shippingAddress: {
    line1: "123 Main Street",
    line2: "Apt 4B",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "United States",
  },
  billingAddress: {
    line1: "123 Main Street",
    line2: "Apt 4B",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "United States",
  },
  payment: {
    method: "Credit Card",
    last4: "4242",
    status: "paid",
  },
  shippingInfo: {
    method: "Standard Shipping",
    tracking: "1Z999AA10123456784",
    status: "in_transit",
  },
  items: [
    { id: 1, name: '55" 4K Smart TV', sku: "ELEC-4KTV-55", price: 499.99, quantity: 1 },
    { id: 2, name: "HDMI Cable 6ft", sku: "ELEC-HDMI-6", price: 14.99, quantity: 2 },
  ],
  subtotal: 529.97,
  shippingCost: 9.99,
  tax: 42.40,
  total: 582.36,
};

function OrderDetailPage() {
  const { id } = Route.useParams();

  const { data: orderData, isLoading, isError, refetch} = useQuery({
    queryKey: ["ecommerce-order", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/orders/${id}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
  });

  const order = orderData ?? MOCK_ORDER;

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
      <div className="flex items-center gap-4">
        <Link to="/app/ecommerce/orders">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Order {order.id}</h1>
            <Badge variant="info" size="sm">Processing</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />}>
            Print
          </Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{order.customer.name}</p>
              <p className="text-sm text-muted-foreground">{order.customer.email}</p>
              <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Shipping Address</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{order.customer.name}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && (
                <p className="text-sm text-muted-foreground">{order.shippingAddress.line2}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Payment</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">Paid</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {order.payment.method} ending in {order.payment.last4}
              </p>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Shipping</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{order.shippingInfo.method}</p>
              <p className="text-sm text-muted-foreground mt-1">Tracking: {order.shippingInfo.tracking}</p>
              <Badge variant="info" size="sm" className="mt-2">In Transit</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
