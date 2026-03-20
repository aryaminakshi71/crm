/**
 * Product Catalog
 *
 * Browse and manage product catalog.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Filter,
  Grid,
  List,
  Image,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/inventory/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState("all");

  const products = [
    {
      id: "prod1",
      sku: "ELEC-4KTV-55",
      name: '55" 4K Smart TV',
      category: "Electronics",
      price: 499.99,
      cost: 320.00,
      stock: 124,
      reorderPoint: 20,
      status: "active",
      image: null,
      variants: 3,
    },
    {
      id: "prod2",
      sku: "ELEC-LAP-15",
      name: "Laptop 15\" Pro",
      category: "Electronics",
      price: 999.99,
      cost: 650.00,
      stock: 89,
      reorderPoint: 15,
      status: "active",
      image: null,
      variants: 2,
    },
    {
      id: "prod3",
      sku: "HOME-SOF-3S",
      name: "3-Seater Sofa",
      category: "Home & Garden",
      price: 999.00,
      cost: 580.00,
      stock: 45,
      reorderPoint: 10,
      status: "active",
      image: null,
      variants: 5,
    },
    {
      id: "prod4",
      sku: "SPORT-BIKE-MTN",
      name: "Mountain Bike",
      category: "Sports",
      price: 599.99,
      cost: 380.00,
      stock: 23,
      reorderPoint: 5,
      status: "low_stock",
      image: null,
      variants: 4,
    },
    {
      id: "prod5",
      sku: "APPA-JKT-WIN-B",
      name: "Winter Jacket Black",
      category: "Apparel",
      price: 149.99,
      cost: 65.00,
      stock: 156,
      reorderPoint: 30,
      status: "active",
      image: null,
      variants: 6,
    },
    {
      id: "prod6",
      sku: "ELEC-HEAD-无线",
      name: "Wireless Headphones Pro",
      category: "Electronics",
      price: 249.99,
      cost: 120.00,
      stock: 8,
      reorderPoint: 25,
      status: "low_stock",
      image: null,
      variants: 3,
    },
    {
      id: "prod7",
      sku: "HOME-LAMP-LED",
      name: "LED Desk Lamp",
      category: "Home & Garden",
      price: 79.99,
      cost: 35.00,
      stock: 0,
      reorderPoint: 20,
      status: "out_of_stock",
      image: null,
      variants: 2,
    },
    {
      id: "prod8",
      sku: "BEAU-SKR-SPF50",
      name: "SPF 50 Sunscreen",
      category: "Beauty",
      price: 24.99,
      cost: 8.50,
      stock: 234,
      reorderPoint: 50,
      status: "active",
      image: null,
      variants: 1,
    },
  ];

  const categories = ["all", "Electronics", "Home & Garden", "Sports", "Apparel", "Beauty"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "low_stock":
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case "out_of_stock":
        return <Badge variant="danger" size="sm">Out of Stock</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Product Catalog</h2>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} products
          </p>
        </div>
        <Link to="/app/inventory/products/new">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={`p-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                  {product.image ? (
                    <Image className="h-12 w-12 text-muted-foreground" />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(product.status)}
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">SKU: {product.sku}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">Cost: ${product.cost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className={product.stock <= product.reorderPoint ? "text-yellow-600" : "text-muted-foreground"}>
                    Stock: {product.stock}
                  </span>
                  <span className="text-muted-foreground">
                    {product.variants} variants
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to="/app/inventory/products/$id" params={{ id: product.id }} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit className="h-3 w-3" />}>
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.image ? (
                      <Image className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      {getStatusBadge(product.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku} / {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${product.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Cost: ${product.cost.toFixed(2)}</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className={`font-medium ${product.stock <= product.reorderPoint ? "text-yellow-600" : "text-foreground"}`}>
                      {product.stock} in stock
                    </p>
                    <p className="text-xs text-muted-foreground">Reorder: {product.reorderPoint}</p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm text-muted-foreground">{product.variants}</p>
                    <p className="text-xs text-muted-foreground">variants</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/app/inventory/products/$id" params={{ id: product.id }}>
                      <Button variant="outline" size="sm" leftIcon={<Edit className="h-3 w-3" />}>
                        Edit
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <Link to="/app/inventory/products/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
