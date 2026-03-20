/**
 * Wishlists
 *
 * View customer wishlists and popular items.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Heart,
  Search,
  Plus,
  Package,
  Eye,
  ShoppingCart,
  Users,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/ecommerce/wishlists")({
  component: WishlistsPage,
});

function WishlistsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const popularItems = [
    { id: 1, name: '55" 4K Smart TV', sku: "ELEC-4KTV-55", price: 499.99, wishlisted: 234, inStock: true },
    { id: 2, name: "Laptop 15\" Pro", sku: "ELEC-LAP-15", price: 999.99, wishlisted: 189, inStock: true },
    { id: 3, name: "3-Seater Sofa", sku: "HOME-SOF-3S", price: 999.00, wishlisted: 156, inStock: true },
    { id: 4, name: "Mountain Bike", sku: "SPORT-BIKE-MTN", price: 599.99, wishlisted: 145, inStock: true },
    { id: 5, name: "Wireless Headphones Pro", sku: "ELEC-HEAD-无线", price: 249.99, wishlisted: 134, inStock: false },
    { id: 6, name: "Winter Jacket Black", sku: "APPA-JKT-WIN-B", price: 149.99, wishlisted: 123, inStock: true },
  ];

  const recentWishlists = [
    { id: 1, customer: "Michael Torres", email: "michael@example.com", items: 3, products: ["55\" 4K Smart TV", "Laptop 15\" Pro"], createdAt: "2 hours ago" },
    { id: 2, customer: "Sarah Chen", email: "sarah@example.com", items: 5, products: ["3-Seater Sofa", "Mountain Bike", "Winter Jacket"], createdAt: "5 hours ago" },
    { id: 3, customer: "Emily Zhang", email: "emily@example.com", items: 2, products: ["Wireless Headphones Pro"], createdAt: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Wishlists</h2>
          <p className="text-sm text-muted-foreground">
            Customer wishlists and popular items
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-muted-foreground">Total Wishlists</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">2,456</p>
                <p className="text-xs text-muted-foreground">Wishlisted Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">892</p>
                <p className="text-xs text-muted-foreground">Unique Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">23%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Items */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Most Wishlisted Items</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-sm text-foreground">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-muted-foreground">{item.wishlisted} wishlisted</span>
                    {!item.inStock && (
                      <Badge variant="danger" size="sm">Out of Stock</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Wishlists */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Recent Wishlists</h3>
          <div className="space-y-3">
            {recentWishlists.map((wishlist) => (
              <div key={wishlist.id} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">
                    {wishlist.customer.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{wishlist.customer}</p>
                  <p className="text-xs text-muted-foreground">{wishlist.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{wishlist.items} items</p>
                  <p className="text-xs text-muted-foreground">{wishlist.createdAt}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ShoppingCart className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
