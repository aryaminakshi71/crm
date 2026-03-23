/**
 * QR Code Generator
 *
 * Generate QR codes for products and locations — products from real API.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  QrCode,
  Download,
  Copy,
  Package,
  MapPin,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/inventory/qr")({
  component: QRGeneratorPage,
});

// Hardcoded locations (no locations API endpoint)
const LOCATIONS = [
  { code: "A-01-1", name: "Warehouse A - Zone A - Aisle 1 - Rack 1" },
  { code: "A-02-1", name: "Warehouse A - Zone A - Aisle 2 - Rack 1" },
  { code: "B-01-1", name: "Warehouse B - Zone B - Aisle 1 - Rack 1" },
  { code: "C-01-1", name: "Warehouse C - Zone C - Aisle 1 - Rack 1" },
  { code: "DC-01-1", name: "Distribution Center - Zone DC - Aisle 1" },
];

function QRGeneratorPage() {
  const [selectedType, setSelectedType] = useState<"product" | "location">("product");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const { data: productsData, isLoading: productsLoading, isError, refetch} = useQuery({
    queryKey: ["inventory", "products", "qr"],
    queryFn: () => inventoryApi.products.list({ limit: 100 }),
    enabled: selectedType === "product",
  });

  const products = (productsData?.data ?? []).map((p: any) => ({
    sku: p.sku ?? p.id,
    name: p.name,
    barcode: p.barcode,
  }));

  const items = selectedType === "product" ? products : LOCATIONS;

  const generateQR = () => {
    if (selectedItem) {
      setGeneratedCodes([...generatedCodes, selectedItem]);
    }
  };

  const generateBatch = () => {
    const allItems = items.map((item) => ("sku" in item ? item.sku : item.code));
    setGeneratedCodes([...generatedCodes, ...allItems]);
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">QR Code Generator</h2>
          <p className="text-sm text-muted-foreground">
            Generate QR codes for products and locations
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Generate QR Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type Selection */}
            <div className="flex gap-4">
              <button
                onClick={() => { setSelectedType("product"); setSelectedItem(null); }}
                className={`flex-1 p-4 rounded-lg border transition-colors ${
                  selectedType === "product"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Package className={`h-6 w-6 mx-auto mb-2 ${selectedType === "product" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-medium text-foreground">Products</p>
                <p className="text-xs text-muted-foreground">For individual items</p>
              </button>
              <button
                onClick={() => { setSelectedType("location"); setSelectedItem(null); }}
                className={`flex-1 p-4 rounded-lg border transition-colors ${
                  selectedType === "location"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <MapPin className={`h-6 w-6 mx-auto mb-2 ${selectedType === "location" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-medium text-foreground">Locations</p>
                <p className="text-xs text-muted-foreground">For warehouse bins</p>
              </button>
            </div>

            {/* Item Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select {selectedType === "product" ? "Products" : "Locations"}
              </label>
              {selectedType === "product" && productsLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading products...</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {items.map((item) => {
                    const key = "sku" in item ? item.sku : item.code;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedItem(key)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          selectedItem === key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <QrCode className={`h-5 w-5 ${selectedItem === key ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {"sku" in item ? `SKU: ${item.sku}` : `Code: ${item.code}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={generateQR}
                disabled={!selectedItem}
                className="flex-1"
                leftIcon={<QrCode className="h-4 w-4" />}
              >
                Generate Selected
              </Button>
              <Button
                variant="outline"
                onClick={generateBatch}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Generate All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Preview */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Generated QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedCodes.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select items and click Generate to create QR codes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedCodes.map((code, idx) => (
                  <div key={idx} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <QrCode className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-mono font-medium text-foreground">{code}</p>
                        <p className="text-xs text-muted-foreground">Generated</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" leftIcon={<Download className="h-3 w-3" />}>
                        PNG
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" leftIcon={<Download className="h-3 w-3" />}>
                        PDF
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" leftIcon={<Download className="h-4 w-4" />}>
                  Download All as PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">QR Code Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Size</label>
              <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option>Small (100x100)</option>
                <option>Medium (200x200)</option>
                <option>Large (300x300)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Format</label>
              <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option>PNG</option>
                <option>SVG</option>
                <option>PDF</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Include Logo</label>
              <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option>None</option>
                <option>Company Logo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Error Correction</label>
              <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option>Low (7%)</option>
                <option>Medium (15%)</option>
                <option>Quartile (25%)</option>
                <option>High (30%)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
