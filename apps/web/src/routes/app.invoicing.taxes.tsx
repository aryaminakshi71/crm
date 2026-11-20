/**
 * Tax Configuration
 *
 * Configure tax rates and settings.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Globe,
  Plus,
  Scale,
  Search,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { invoicingApi } from "@/lib/api";

export const Route = createFileRoute("/app/invoicing/taxes")({
  component: TaxConfiguration,
});

type TaxRate = {
  id: string;
  name: string;
  rate: number;
  type: "sales" | "vat" | "gst" | "custom";
  region: string;
  status: "active" | "inactive";
};

const EMPTY_TAX_RATES: any[] = [];

function TaxConfiguration() {
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTax, setNewTax] = useState({ name: "", rate: "", type: "sales", region: "" });
  const queryClient = useQueryClient();

  const createTaxRateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => invoicingApi.taxes.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/taxes"] }),
  });

  const deleteTaxRateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoicing/taxes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tax rate");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/taxes"] }),
  });

  const taxesQuery = useQuery({
    queryKey: ["invoicing/taxes"],
    queryFn: () => invoicingApi.taxes.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (taxesQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => taxesQuery.refetch()}>Retry</Button>
    </div>
  );
  const taxRates: any[] = (taxesQuery as any)?.data?.data ?? [];

  const filteredTaxRates = taxRates.filter((tax) => {
    if (!search.trim()) return true;
    return (
      tax.name.toLowerCase().includes(search.toLowerCase()) ||
      tax.region.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeTaxes = taxRates.filter(t => t.status === "active");
  const totalTaxCollected = 45678; // Example value

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Tax Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure tax rates for invoicing</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>
          Add Tax Rate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Active Tax Rates" value={activeTaxes.length + ""} />
        <StatCard title="Tax Types" value="4" />
        <StatCard title="Tax Collected YTD" value="$45.7K" />
        <StatCard title="Filing Due" value="Apr 30" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tax rates..." />
        </div>
      </div>

      {/* Tax List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tax Name</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rate</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Region</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxRates.map((tax) => (
                <tr key={tax.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{tax.name}</td>
                  <td className="px-4 py-3 text-sm font-medium">{tax.rate}%</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{tax.type.toUpperCase()}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{tax.region}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tax.status === "active" ? "success" : "outline"}>
                      {tax.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTaxRateMutation.mutate(tax.id)} disabled={deleteTaxRateMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Tax Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Default Tax Rate</label>
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {activeTaxes.map((tax) => (
                  <option key={tax.id} value={tax.id}>{tax.name} ({tax.rate}%)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tax Number</label>
              <Input defaultValue="US12-3456789" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="font-medium text-sm">Auto-calculate tax</p>
              <p className="text-xs text-muted-foreground">Automatically calculate tax based on client region</p>
            </div>
            <div className="relative h-5 w-9 rounded-full bg-primary">
              <div className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Tax Rate"
        submitText="Add Rate"
        onSubmit={(e) => {
          e.preventDefault();
          createTaxRateMutation.mutate(
            { name: newTax.name, rate: Number(newTax.rate), type: newTax.type, region: newTax.region },
            { onSuccess: () => { setIsCreateModalOpen(false); setNewTax({ name: "", rate: "", type: "sales", region: "" }); } }
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Tax Name" required>
            <Input value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} placeholder="e.g., US Sales Tax" required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rate (%)" required>
              <Input type="number" value={newTax.rate} onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })} placeholder="0.00" required />
            </FormField>
            <FormField label="Type" required>
              <select value={newTax.type} onChange={(e) => setNewTax({ ...newTax, type: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="sales">Sales Tax</option>
                <option value="vat">VAT</option>
                <option value="gst">GST</option>
                <option value="custom">Custom</option>
              </select>
            </FormField>
          </div>
          <FormField label="Region">
            <Input value={newTax.region} onChange={(e) => setNewTax({ ...newTax, region: e.target.value })} placeholder="e.g., United States" />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
