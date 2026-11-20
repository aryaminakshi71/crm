/**
 * Order Detail
 *
 * View and manage order details.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ecommerceApi } from "@/lib/api";
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

function OrderDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const updateOrderStatusMutation = useMutation({
    mutationFn: (data: { status: string }) => ecommerceApi.orders.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-order", id] }),
  });

  const { data: orderData, isLoading, isError, refetch} = useQuery({
    queryKey: ["ecommerce-order", id],
    queryFn: () => ecommerceApi.orders.get(id),
    placeholderData: (prev) => prev,
  });

  const order = orderData ?? {};

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
            <h1 className="text-xl font-bold text-foreground">Order {(order as any).id}</h1>
            <Badge variant="info" size="sm">Processing</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Placed on {(order as any).date}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />}>
            Print
          </Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Invoice
          </Button>
          <Button variant="outline" onClick={() => updateOrderStatusMutation.mutate({ status: "shipped" })} disabled={updateOrderStatusMutation.isPending}>
            Mark Shipped
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
              {(order as any).items.map((item: any) => (
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
                  <span>${(order as any).subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${(order as any).shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${(order as any).tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${(order as any).total.toFixed(2)}</span>
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
              <p className="font-medium text-foreground">{(order as any).customer.name}</p>
              <p className="text-sm text-muted-foreground">{(order as any).customer.email}</p>
              <p className="text-sm text-muted-foreground">{(order as any).customer.phone}</p>
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
              <p className="text-foreground">{(order as any).customer.name}</p>
              <p className="text-sm text-muted-foreground">{(order as any).shippingAddress.line1}</p>
              {(order as any).shippingAddress.line2 && (
                <p className="text-sm text-muted-foreground">{(order as any).shippingAddress.line2}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {(order as any).shippingAddress.city}, {(order as any).shippingAddress.state} {(order as any).shippingAddress.zip}
              </p>
              <p className="text-sm text-muted-foreground">{(order as any).shippingAddress.country}</p>
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
                {(order as any).payment.method} ending in {(order as any).payment.last4}
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
              <p className="font-medium text-foreground">{(order as any).shippingInfo.method}</p>
              <p className="text-sm text-muted-foreground mt-1">Tracking: {(order as any).shippingInfo.tracking}</p>
              <Badge variant="info" size="sm" className="mt-2">In Transit</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
