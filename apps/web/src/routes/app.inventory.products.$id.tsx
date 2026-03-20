/**
 * Product Detail
 *
 * View and edit product details with variants.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  Package,
  Plus,
  Settings,
  DollarSign,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Image,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/inventory/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const [activeTab, setActiveTab] = useState<"details" | "variants" | "stock" | "history">("details");

  const product = {
    id: "prod1",
    sku: "ELEC-4KTV-55",
    name: '55" 4K Smart TV',
    description: "Ultra HD Smart TV with 4K resolution, HDR support, and built-in streaming apps.",
    category: "Electronics",
    price: 499.99,
    cost: 320.00,
    weight: 25.5,
    dimensions: "49\" x 28\" x 2.5\"",
    barcode: "012345678901",
    reorderPoint: 20,
    maxStock: 200,
    status: "active",
    image: null,
    createdAt: "Jan 15, 2024",
    updatedAt: "2 hours ago",
  };

  const variants = [
    { id: "v1", name: "55\" Black", sku: "ELEC-4KTV-55-BLK", stock: 45, price: 499.99 },
    { id: "v2", name: "55\" Silver", sku: "ELEC-4KTV-55-SLV", stock: 38, price: 499.99 },
    { id: "v3", name: "55\" White", sku: "ELEC-4KTV-55-WHT", stock: 41, price: 519.99 },
  ];

  const stockByWarehouse = [
    { warehouse: "Warehouse A", location: "A-12-3", stock: 50, reserved: 5 },
    { warehouse: "Warehouse B", location: "B-05-1", stock: 40, reserved: 2 },
    { warehouse: "Distribution Center", location: "DC-08-2", stock: 34, reserved: 8 },
  ];

  const activityHistory = [
    { id: 1, type: "stock_in", quantity: 100, date: "Mar 15, 2024", user: "David Park" },
    { id: 2, type: "order", quantity: -15, date: "Mar 14, 2024", user: "System" },
    { id: 3, type: "adjustment", quantity: 5, date: "Mar 12, 2024", user: "Sarah Chen" },
    { id: 4, type: "order", quantity: -8, date: "Mar 10, 2024", user: "System" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/inventory/products">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <Badge variant="success" size="sm">Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Copy className="h-4 w-4" />}>
            Duplicate
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" leftIcon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {(["details", "variants", "stock", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "details" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Image className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Product Name</label>
                  <Input defaultValue={product.name} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">SKU</label>
                  <Input defaultValue={product.sku} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                  <Input defaultValue={product.category} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Barcode</label>
                  <Input defaultValue={product.barcode} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Price</label>
                  <Input type="number" defaultValue={product.price} leftIcon={<DollarSign className="h-4 w-4" />} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Cost</label>
                  <Input type="number" defaultValue={product.cost} leftIcon={<DollarSign className="h-4 w-4" />} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Weight (kg)</label>
                  <Input type="number" defaultValue={product.weight} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Dimensions</label>
                  <Input defaultValue={product.dimensions} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <textarea
                  className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={product.description}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Stock Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Reorder Point</label>
                <Input type="number" defaultValue={product.reorderPoint} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Maximum Stock</label>
                <Input type="number" defaultValue={product.maxStock} />
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Stock</span>
                  <span className="font-bold text-lg">124</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Reserved</span>
                  <span className="font-medium text-yellow-600">15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="font-bold text-green-600">109</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "variants" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Product Variants</CardTitle>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {variants.map((variant) => (
                <div key={variant.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{variant.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${variant.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className={`font-medium ${variant.stock <= 10 ? "text-yellow-600" : "text-foreground"}`}>
                      {variant.stock} in stock
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "stock" && (
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Stock by Warehouse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockByWarehouse.map((item) => (
                  <div key={item.warehouse} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.warehouse}</p>
                      <p className="text-sm text-muted-foreground">Location: {item.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{item.stock}</p>
                      <p className="text-xs text-muted-foreground">in stock</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-medium text-yellow-600">{item.reserved}</p>
                      <p className="text-xs text-muted-foreground">reserved</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityHistory.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg">
                  {activity.type === "stock_in" && (
                    <div className="rounded-full bg-green-100 p-2">
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  {activity.type === "order" && (
                    <div className="rounded-full bg-blue-100 p-2">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  {activity.type === "adjustment" && (
                    <div className="rounded-full bg-yellow-100 p-2">
                      <Settings className="h-4 w-4 text-yellow-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {activity.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date} / {activity.user}
                    </p>
                  </div>
                  <div className={`text-right font-bold ${activity.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                    {activity.quantity > 0 ? "+" : ""}{activity.quantity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
