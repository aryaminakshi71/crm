/**
 * Add Product
 *
 * Create a new product for the store.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Image,
  DollarSign,
  ArrowRight,
  Save,
} from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/ecommerce/products/new")({
  component: AddProductPage,
});

function AddProductPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    type: "",
    vendor: "",
    price: "",
    comparePrice: "",
    chargeTax: true,
    trackInventory: true,
    stock: "",
    sku: "",
    barcode: "",
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${API_BASE}/ecommerce/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          name: data.name,
          shortDescription: data.shortDescription,
          description: data.description,
          type: data.type,
          vendor: data.vendor,
          price: data.price ? parseFloat(data.price) : undefined,
          comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : undefined,
          stock: data.stock ? parseInt(data.stock) : 0,
          sku: data.sku,
          barcode: data.barcode,
          trackInventory: data.trackInventory,
          status: "draft",
        }),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      navigate({ to: "/app/ecommerce/products" });
    },
  });

  const steps = [
    { num: 1, title: "Basic Info" },
    { num: 2, title: "Pricing" },
    { num: 3, title: "Inventory" },
    { num: 4, title: "Images" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/ecommerce/products">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add New Product</h1>
          <p className="text-sm text-muted-foreground">Create a new product for your store</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-4">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  step >= s.num ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.num}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    step > s.num ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto">
        {step === 1 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Product Title *</label>
                <Input
                  placeholder="Enter product title"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Short Description</label>
                <Input
                  placeholder="Brief description for product cards"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <textarea
                  className="w-full h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Full product description"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Product Type</label>
                  <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                    <option>Select type</option>
                    <option>Physical</option>
                    <option>Digital</option>
                    <option>Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Vendor</label>
                  <Input placeholder="Vendor name" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Price *</label>
                  <Input type="number" placeholder="0.00" leftIcon={<DollarSign className="h-4 w-4" />} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Compare at Price</label>
                  <Input type="number" placeholder="0.00" leftIcon={<DollarSign className="h-4 w-4" />} />
                  <p className="text-xs text-muted-foreground mt-1">Shows original price with strikethrough</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Charge tax on this product</span>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Inventory</CardTitle>
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
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">SKU</label>
                  <Input placeholder="Stock keeping unit" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Barcode</label>
                <Input placeholder="ISBN, UPC, GTIN, etc." />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Drag and drop images here
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  or click to browse (max 10 images, 5MB each)
                </p>
                <Button variant="outline" size="sm">Browse Files</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              leftIcon={<Save className="h-4 w-4" />}
              onClick={() => createProductMutation.mutate(formData)}
              disabled={createProductMutation.isPending || !formData.name}
            >
              {createProductMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
