/**
 * eCommerce Layout
 *
 * Main layout for eCommerce module.
 */

import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Store,
  ShoppingBag,
  CreditCard,
  Truck,
  Users,
  Heart,
  Star,
  Percent,
  ShoppingCart,
  DollarSign,
  Package,
  ChevronRight,
  Palette,
} from "lucide-react";

export const Route = createFileRoute("/app/ecommerce")({
  component: EcommerceLayout,
});

function EcommerceLayout() {
  const navItems = [
    { name: "Dashboard", href: "/app/ecommerce", icon: Store, isIndex: true },
    { name: "Store", href: "/app/ecommerce/store", icon: Palette },
    { name: "Products", href: "/app/ecommerce/products", icon: Package },
    { name: "Cart", href: "/app/ecommerce/cart", icon: ShoppingCart },
    { name: "Checkout", href: "/app/ecommerce/checkout", icon: CreditCard },
    { name: "Orders", href: "/app/ecommerce/orders", icon: ShoppingBag },
    { name: "Shipping", href: "/app/ecommerce/shipping", icon: Truck },
    { name: "Taxes", href: "/app/ecommerce/taxes", icon: DollarSign },
    { name: "Discounts", href: "/app/ecommerce/discounts", icon: Percent },
    { name: "Customers", href: "/app/ecommerce/customers", icon: Users },
    { name: "Wishlists", href: "/app/ecommerce/wishlists", icon: Heart },
    { name: "Reviews", href: "/app/ecommerce/reviews", icon: Star },
    { name: "Upsell", href: "/app/ecommerce/upsell", icon: Percent },
    { name: "Abandoned", href: "/app/ecommerce/abandoned", icon: ShoppingCart },
    { name: "Dropship", href: "/app/ecommerce/dropship", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">eCommerce</h1>
        <p className="text-muted-foreground">
          Manage your online store, products, orders, and customer experience.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors group flex items-start gap-3"
          >
            <item.icon className="h-8 w-8 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.name === "Dashboard" && "Overview & stats"}
                {item.name === "Store" && "Store customizer"}
                {item.name === "Products" && "Product catalog"}
                {item.name === "Cart" && "Cart settings"}
                {item.name === "Checkout" && "Checkout config"}
                {item.name === "Orders" && "Order management"}
                {item.name === "Shipping" && "Shipping rates"}
                {item.name === "Taxes" && "Tax settings"}
                {item.name === "Discounts" && "Promo codes"}
                {item.name === "Customers" && "Customer accounts"}
                {item.name === "Wishlists" && "Wishlist items"}
                {item.name === "Reviews" && "Product reviews"}
                {item.name === "Upsell" && "Cross-sell rules"}
                {item.name === "Abandoned" && "Cart recovery"}
                {item.name === "Dropship" && "Dropshipping"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
