/**
 * Add New Product
 *
 * Form to create a new product in the catalog — connected to real inventory API.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Image,
  DollarSign,
  Hash,
  Save,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../../lib/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/products/new")({
  component: AddProductPage,
});

function AddProductPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    description: "",
    sellingPrice: 0,
    costPrice: 0,
    weight: 0,
    dimensions: "",
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    warehouse: "",
    location: "",
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      inventoryApi.products.create({
        name: form.name,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        category: form.category || undefined,
        description: form.description || undefined,
        sellingPrice: form.sellingPrice || undefined,
        costPrice: form.costPrice || undefined,
        currentStock: form.currentStock,
        minStockLevel: form.minStockLevel || undefined,
        status: "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "stats"] });
      navigate({ to: "/app/inventory/products" });
    },
  });

  const steps = [
    { num: 1, title: "Basic Info" },
    { num: 2, title: "Pricing" },
    { num: 3, title: "Inventory" },
    { num: 4, title: "Media" },
  ];

  const margin = form.sellingPrice > 0 && form.costPrice > 0
    ? ((form.sellingPrice - form.costPrice) / form.sellingPrice * 100).toFixed(0)
    : null;
  const profit = form.sellingPrice > 0 && form.costPrice > 0
    ? (form.sellingPrice - form.costPrice).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/inventory/products">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add New Product</h1>
          <p className="text-sm text-muted-foreground">Create a new product in your catalog</p>
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
                <label className="text-sm font-medium text-foreground mb-1 block">Product Name *</label>
                <Input
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">SKU *</label>
                  <Input
                    placeholder="e.g., ELEC-4KTV-55"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Barcode</label>
                  <Input
                    placeholder="Enter barcode"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Category *</label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Sports">Sports</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Beauty">Beauty</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <textarea
                  className="w-full h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter product description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
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
                  <label className="text-sm font-medium text-foreground mb-1 block">Selling Price *</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.sellingPrice || ""}
                    onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Cost Price *</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.costPrice || ""}
                    onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Weight (kg)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.weight || ""}
                    onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Dimensions</label>
                  <Input
                    placeholder="L x W x H"
                    value={form.dimensions}
                    onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                  />
                </div>
              </div>
              {margin && profit && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Margin:</strong> ${profit} ({margin}%)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Inventory Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Initial Stock</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.currentStock || ""}
                    onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Reorder Point</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.minStockLevel || ""}
                    onChange={(e) => setForm({ ...form, minStockLevel: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Maximum Stock</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.maxStockLevel || ""}
                  onChange={(e) => setForm({ ...form, maxStockLevel: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Warehouse *</label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.warehouse}
                  onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                >
                  <option value="">Select warehouse</option>
                  <option value="Warehouse A">Warehouse A</option>
                  <option value="Warehouse B">Warehouse B</option>
                  <option value="Warehouse C">Warehouse C</option>
                  <option value="Distribution Center">Distribution Center</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Location (Bin/Shelf)</label>
                <Input
                  placeholder="e.g., A-12-3"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Media & Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Drag and drop images here
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  or click to browse (max 5 images, 5MB each)
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
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !form.name}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              leftIcon={<Save className="h-4 w-4" />}
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.name}
            >
              {createMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          )}
        </div>
        {createMutation.isError && (
          <p className="text-sm text-red-600 text-center mt-2">
            Failed to create product. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
