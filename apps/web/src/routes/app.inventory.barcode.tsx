/**
 * Barcode Scanner Interface
 *
 * Scan barcodes to look up products and update stock.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ScanBarcode,
  Search,
  Package,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Camera,
  History,
  Settings,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/inventory/barcode")({
  component: BarcodeScannerPage,
});

function BarcodeScannerPage() {
  const [manualInput, setManualInput] = useState("");
  const [lastScanned, setLastScanned] = useState<{
    sku: string;
    name: string;
    barcode: string;
    stock: number;
    location: string;
    warehouse: string;
  } | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [recentScans] = useState([
    { id: "1", sku: "ELEC-4KTV-55", name: '55" 4K Smart TV', scannedAt: "2 min ago", action: "Viewed" },
    { id: "2", sku: "ELEC-LAP-15", name: "Laptop 15\" Pro", scannedAt: "5 min ago", action: "Stock +5" },
    { id: "3", sku: "HOME-SOF-3S", name: "3-Seater Sofa", scannedAt: "8 min ago", action: "Viewed" },
    { id: "4", sku: "APPA-JKT-WIN-B", name: "Winter Jacket Black", scannedAt: "12 min ago", action: "Stock -2" },
  ]);

  const handleScan = () => {
    if (manualInput) {
      setLastScanned({
        sku: "ELEC-4KTV-55",
        name: '55" 4K Smart TV',
        barcode: manualInput,
        stock: 50,
        location: "A-12-3",
        warehouse: "Warehouse A",
      });
      setManualInput("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Barcode Scanner</h2>
          <p className="text-sm text-muted-foreground">
            Scan barcodes to look up products and adjust stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<History className="h-4 w-4" />}>
            Scan History
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
            Scanner Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scanner Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Camera Scanner */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <ScanBarcode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Camera preview</p>
                  <p className="text-xs text-muted-foreground">(Click to activate scanner)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Activate Camera
                </Button>
                <Button variant="outline">
                  <ScanBarcode className="h-4 w-4 mr-2" />
                  Use External Scanner
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode or SKU..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleScan} leftIcon={<Search className="h-4 w-4" />}>
                  Look Up
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Last Scanned Product */}
          {lastScanned && (
            <Card className="border-border/60 border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Last Scanned
                  </CardTitle>
                  <Badge variant="success" size="sm">Found</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{lastScanned.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {lastScanned.sku}</p>
                    <p className="text-sm text-muted-foreground">Barcode: {lastScanned.barcode}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold text-foreground">{lastScanned.stock}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-lg font-semibold text-foreground">{lastScanned.location}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Warehouse</p>
                    <p className="text-lg font-semibold text-foreground">{lastScanned.warehouse}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Quick Adjustment</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => setAdjustmentQty(adjustmentQty - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={adjustmentQty}
                        onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => setAdjustmentQty(adjustmentQty + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="success" className="flex-1">
                      Apply Adjustment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Scans */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <ScanBarcode className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{scan.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {scan.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">{scan.action}</p>
                    <p className="text-xs text-muted-foreground">{scan.scannedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
