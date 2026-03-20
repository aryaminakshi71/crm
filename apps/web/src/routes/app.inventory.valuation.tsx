/**
 * Inventory Valuation
 *
 * Configure and view inventory valuation methods (FIFO/LIFO/Avg).
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  DollarSign,
  TrendingUp,
  Package,
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/inventory/valuation")({
  component: InventoryValuationPage,
});

function InventoryValuationPage() {
  const [valuationMethod, setValuationMethod] = useState("fifo");

  const inventoryByMethod = {
    fifo: [
      { sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', quantity: 124, avgCost: 295.00, totalValue: 36580.00, lastCost: 320.00 },
      { sku: "ELEC-LAP-15", name: "Laptop 15\" Pro", quantity: 89, avgCost: 620.00, totalValue: 55180.00, lastCost: 650.00 },
      { sku: "HOME-SOF-3S", name: "3-Seater Sofa", quantity: 45, avgCost: 520.00, totalValue: 23400.00, lastCost: 580.00 },
      { sku: "SPORT-BIKE-MTN", name: "Mountain Bike", quantity: 23, avgCost: 340.00, totalValue: 7820.00, lastCost: 380.00 },
      { sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", quantity: 156, avgCost: 58.00, totalValue: 9048.00, lastCost: 65.00 },
    ],
    lifo: [
      { sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', quantity: 124, avgCost: 310.00, totalValue: 38440.00, lastCost: 320.00 },
      { sku: "ELEC-LAP-15", name: "Laptop 15\" Pro", quantity: 89, avgCost: 635.00, totalValue: 56515.00, lastCost: 650.00 },
      { sku: "HOME-SOF-3S", name: "3-Seater Sofa", quantity: 45, avgCost: 545.00, totalValue: 24525.00, lastCost: 580.00 },
      { sku: "SPORT-BIKE-MTN", name: "Mountain Bike", quantity: 23, avgCost: 360.00, totalValue: 8280.00, lastCost: 380.00 },
      { sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", quantity: 156, avgCost: 62.00, totalValue: 9672.00, lastCost: 65.00 },
    ],
    average: [
      { sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', quantity: 124, avgCost: 302.50, totalValue: 37510.00, lastCost: 320.00 },
      { sku: "ELEC-LAP-15", name: "Laptop 15\" Pro", quantity: 89, avgCost: 627.50, totalValue: 55847.50, lastCost: 650.00 },
      { sku: "HOME-SOF-3S", name: "3-Seater Sofa", quantity: 45, avgCost: 532.50, totalValue: 23962.50, lastCost: 580.00 },
      { sku: "SPORT-BIKE-MTN", name: "Mountain Bike", quantity: 23, avgCost: 350.00, totalValue: 8050.00, lastCost: 380.00 },
      { sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", quantity: 156, avgCost: 60.00, totalValue: 9360.00, lastCost: 65.00 },
    ],
  };

  const currentInventory = inventoryByMethod[valuationMethod as keyof typeof inventoryByMethod];
  const totalValue = currentInventory.reduce((sum, item) => sum + item.totalValue, 0);

  const methods = [
    { id: "fifo", name: "FIFO", description: "First In, First Out - oldest inventory sold first", bestFor: "Perishable goods, Electronics" },
    { id: "lifo", name: "LIFO", description: "Last In, First Out - newest inventory sold first", bestFor: "Non-perishable, Cost-effective items" },
    { id: "average", name: "Average Cost", description: "Weighted average of all inventory costs", bestFor: "Homogeneous products, Steady pricing" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Inventory Valuation</h2>
          <p className="text-sm text-muted-foreground">
            Configure and compare valuation methods
          </p>
        </div>
        <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
          Valuation Settings
        </Button>
      </div>

      {/* Total Value Card */}
      <Card className="border-border/60 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Inventory Value ({methods.find((m) => m.id === valuationMethod)?.name})</p>
              <p className="text-4xl font-bold text-foreground mt-1">${totalValue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {currentInventory.length} products
              </p>
            </div>
            <div className="rounded-xl bg-primary/20 p-4">
              <DollarSign className="h-10 w-10 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Valuation Method Selection */}
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Valuation Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setValuationMethod(method.id)}
                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                  valuationMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{method.name}</span>
                  {valuationMethod === method.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Best for:</strong> {method.bestFor}
                </p>
              </button>
            ))}
            <Button className="w-full mt-4" leftIcon={<Save className="h-4 w-4" />}>
              Save Method
            </Button>
          </CardContent>
        </Card>

        {/* Inventory by Method */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Inventory Value by Product ({methods.find((m) => m.id === valuationMethod)?.name})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentInventory.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center gap-4 p-3 border border-border rounded-lg"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Avg Cost</p>
                    <p className="font-medium text-foreground">${item.avgCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Last Cost</p>
                    <p className="font-medium text-foreground">${item.lastCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm text-muted-foreground">Qty</p>
                    <p className="font-medium text-foreground">{item.quantity}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="font-bold text-primary">${item.totalValue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Important Note</p>
              <p className="text-sm text-muted-foreground mt-1">
                Changing the valuation method will affect your cost of goods sold (COGS) calculations
                and reported profit margins. This change should be reviewed with your accountant and
                typically requires consistent application for financial reporting. The method shown
                above is for internal tracking purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
