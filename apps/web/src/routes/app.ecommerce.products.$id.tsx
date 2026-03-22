/**
 * Product Editor
 *
 * Edit product details for eCommerce.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Eye,
  Copy,
  Trash2,
  Package,
  Image,
  DollarSign,
  Plus,
  Minus,
  Settings,
} from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/ecommerce/products/$id")({
  component: ProductEditor,
});

const MOCK_PRODUCT = {
  id: "prod1",
  name: '55" 4K Smart TV',
  description: "Ultra HD Smart TV with 4K resolution, HDR support, and built-in streaming apps.",
  shortDescription: "Premium 4K Smart TV with HDR",
  sku: "ELEC-4KTV-55",
  price: 499.99,
  comparePrice: 599.99,
  cost: 320.00,
  stock: 124,
  trackInventory: true,
  status: "active",
  weight: 25.5,
  dimensions: "49 x 28 x 2.5 inches",
  tags: ["electronics", "tv", "4k", "smart-tv"],
  images: [],
};

function ProductEditor() {
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "inventory" | "images" | "seo">("details");
  const queryClient = useQueryClient();

  const { data: productData, isLoading } = useQuery({
    queryKey: ["ecommerce-product", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/products/${id}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/ecommerce/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-product", id] });
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
    },
  });

  const product = productData ?? MOCK_PRODUCT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/ecommerce/products">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Eye className="h-4 w-4" />}>
            Preview
          </Button>
          <Button variant="outline" leftIcon={<Copy className="h-4 w-4" />}>
            Duplicate
          </Button>
          <Button
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => updateMutation.mutate({ name: product.name })}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {(["details", "pricing", "inventory", "images", "seo"] as const).map((tab) => (
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeTab === "details" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Product Title</label>
                  <Input defaultValue={product.name} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Short Description</label>
                  <Input defaultValue={product.shortDescription} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                  <textarea
                    className="w-full h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={product.description}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">
                        {tag} <button className="ml-1 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                  <Input placeholder="Add tag and press Enter" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "pricing" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Price</label>
                    <Input type="number" defaultValue={product.price} leftIcon={<DollarSign className="h-4 w-4" />} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Compare at Price</label>
                    <Input type="number" defaultValue={product.comparePrice || ""} leftIcon={<DollarSign className="h-4 w-4" />} />
                    <p className="text-xs text-muted-foreground mt-1">Shows original price with strikethrough</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Cost per Item</label>
                    <Input type="number" defaultValue={product.cost} leftIcon={<DollarSign className="h-4 w-4" />} />
                    <p className="text-xs text-muted-foreground mt-1">Used for profit margin calculation</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Margin</label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">${(product.price - product.cost).toFixed(2)} ({(100 * (product.price - product.cost) / product.price).toFixed(1)}%)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "inventory" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Track Inventory</p>
                    <p className="text-sm text-muted-foreground">Track stock quantities</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Quantity</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input type="number" defaultValue={product.stock} className="w-24 text-center" />
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">SKU</label>
                    <Input defaultValue={product.sku} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Weight (kg)</label>
                    <Input type="number" defaultValue={product.weight} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Dimensions</label>
                    <Input defaultValue={product.dimensions} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "images" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drag and drop images here
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    or click to browse (max 10 images, 5MB each)
                  </p>
                  <Button variant="outline" size="sm">Browse Files</Button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "seo" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Page Title</label>
                  <Input defaultValue={product.name} />
                  <p className="text-xs text-muted-foreground mt-1">55 characters recommended</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Meta Description</label>
                  <textarea
                    className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={product.shortDescription}
                  />
                  <p className="text-xs text-muted-foreground mt-1">155 characters recommended</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">URL Handle</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/products/</span>
                    <Input defaultValue="55-4k-smart-tv" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">This product is visible in your store</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
