/**
 * Tax Configuration
 *
 * Configure tax settings and rates.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/app/ecommerce/taxes")({
  component: TaxesPage,
});

function TaxesPage() {
  const taxRates = [
    { id: 1, name: "US - California", rate: 7.25, region: "CA, USA", enabled: true },
    { id: 2, name: "US - New York", rate: 8.0, region: "NY, USA", enabled: true },
    { id: 3, name: "US - Texas", rate: 6.25, region: "TX, USA", enabled: true },
    { id: 4, name: "Canada - Ontario", rate: 13.0, region: "ON, Canada", enabled: true },
    { id: 5, name: "EU - VAT Standard", rate: 20.0, region: "European Union", enabled: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tax Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure tax rates and settings
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Add Tax Rate
        </Button>
      </div>

      {/* Tax Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Tax Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Charge Tax on Products</p>
              <p className="text-sm text-muted-foreground">Automatically calculate and charge tax</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Prices Include Tax</p>
              <p className="text-sm text-muted-foreground">Product prices include applicable tax</p>
            </div>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Show Tax Breakdown</p>
              <p className="text-sm text-muted-foreground">Display tax line item at checkout</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Tax Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {taxRates.map((rate) => (
              <div key={rate.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{rate.name}</p>
                    {rate.enabled && (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{rate.region}</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-bold text-foreground">{rate.rate}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={rate.enabled} className="rounded" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Tax Calculation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Taxes are calculated based on the customer's shipping address. Make sure to add
                tax rates for all regions where you need to collect taxes. Consult with a tax
                professional to ensure compliance with local tax laws.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
