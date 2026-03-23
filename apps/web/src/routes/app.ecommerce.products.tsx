/**
 * eCommerce Products
 *
 * Manage products for the online store.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Package,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Grid,
  List,
  Filter,
  Image,
} from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/ecommerce/products")({
  component: ProductsPage,
});

const MOCK_PRODUCTS = [
  { id: "prod1", name: '55" 4K Smart TV', sku: "ELEC-4KTV-55", price: 499.99, comparePrice: 599.99, stock: 124, status: "active", sales: 45, image: null },
  { id: "prod2", name: "Laptop 15\" Pro", sku: "ELEC-LAP-15", price: 999.99, comparePrice: 1199.99, stock: 89, status: "active", sales: 32, image: null },
  { id: "prod3", name: "3-Seater Sofa", sku: "HOME-SOF-3S", price: 999.00, comparePrice: null, stock: 45, status: "active", sales: 18, image: null },
  { id: "prod4", name: "Mountain Bike", sku: "SPORT-BIKE-MTN", price: 599.99, comparePrice: 699.99, stock: 23, status: "draft", sales: 15, image: null },
  { id: "prod5", name: "Winter Jacket Black", sku: "APPA-JKT-WIN-B", price: 149.99, comparePrice: 179.99, stock: 156, status: "active", sales: 28, image: null },
  { id: "prod6", name: "Wireless Headphones Pro", sku: "ELEC-HEAD-无线", price: 249.99, comparePrice: null, stock: 8, status: "low_stock", sales: 42, image: null },
  { id: "prod7", name: "LED Desk Lamp", sku: "HOME-LAMP-LED", price: 79.99, comparePrice: null, stock: 0, status: "out_of_stock", sales: 89, image: null },
  { id: "prod8", name: "SPF 50 Sunscreen", sku: "BEAU-SKR-SPF50", price: 24.99, comparePrice: 29.99, stock: 234, status: "active", sales: 156, image: null },
];

function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: apiData, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-products", searchQuery, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (searchQuery) params.set("search", searchQuery);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`${API_BASE}/ecommerce/products?${params}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const products = apiData?.data?.length > 0 ? apiData.data : MOCK_PRODUCTS;

  const filteredProducts = products.filter((product: typeof MOCK_PRODUCTS[0]) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "draft":
        return <Badge variant="default" size="sm">Draft</Badge>;
      case "low_stock":
        return <Badge variant="warning" size="sm">Low Stock</Badge>;
      case "out_of_stock":
        return <Badge variant="danger" size="sm">Out of Stock</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} products
          </p>
        </div>
        <Link to="/app/ecommerce/products/new">
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
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

      {/* Products Grid */}
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
                  <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
                  {product.comparePrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className={product.stock <= 10 ? "text-yellow-600" : "text-muted-foreground"}>
                    Stock: {product.stock}
                  </span>
                  <span className="text-muted-foreground">{product.sales} sold</span>
                </div>
                <div className="flex gap-2">
                  <Link to="/app/ecommerce/products/$id" params={{ id: product.id }} className="flex-1">
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
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      {getStatusBadge(product.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">${product.price.toFixed(2)}</span>
                      {product.comparePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className={product.stock <= 10 ? "text-yellow-600 font-medium" : "text-foreground"}>
                      {product.stock} in stock
                    </p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-muted-foreground">{product.sales} sold</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/app/ecommerce/products/$id" params={{ id: product.id }}>
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
    </div>
  );
}
