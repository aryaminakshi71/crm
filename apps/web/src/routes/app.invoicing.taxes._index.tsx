/**
 * Tax Rates
 *
 * Manage tax rates with type, region, and status.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  DollarSign,
  Globe,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  type: z.enum(["all", "sales", "VAT", "GST", "withholding"]).optional().default("all"),
  status: z.enum(["all", "active", "inactive"]).optional().default("all"),
});

export const Route = createFileRoute("/app/invoicing/taxes/_index")({
  validateSearch: searchSchema,
  component: TaxesPage,
});

const TYPE_BADGE: Record<string, string> = {
  VAT: "bg-primary/10 text-primary",
  GST: "bg-emerald-500/10 text-emerald-400",
  sales: "bg-amber-500/10 text-amber-400",
  "sales tax": "bg-amber-500/10 text-amber-400",
  withholding: "bg-violet-500/10 text-violet-400",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function TaxesPage() {
  const { q: search, type: typeFilter, status: statusFilter } = useSearch({ from: "/app/invoicing/taxes/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/taxes" });

  const setSearch = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, q: value || undefined }) });
  const setTypeFilter = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, type: value as any }) });
  const setStatusFilter = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, status: value as any }) });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newType, setNewType] = useState("sales");
  const [newRegion, setNewRegion] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createTaxMutation = useMutation({
    mutationFn: (taxData: { name: string; rate: number; type: string; region?: string }) =>
      invoicingApi.taxes.create(taxData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing/taxes"] });
      toast.success("Tax rate created successfully");
      setIsAddOpen(false);
      setNewName("");
      setNewRate("");
      setNewType("sales");
      setNewRegion("");
    },
    onError: () => toast.error("Failed to create tax rate"),
  });

  const deleteTaxMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/invoicing/taxes/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Delete failed");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing/taxes"] });
      toast.success("Tax rate deleted");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to delete tax rate"),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/taxes"],
    queryFn: () => invoicingApi.taxes.list(),
    retry: false,
  });

  const taxes: any[] = (data as any)?.data ?? [];

  const filtered = taxes.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.region?.toLowerCase().includes(search.toLowerCase()) ||
      t.type?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const isActive = t.isActive !== false;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive);
    return matchSearch && matchType && matchStatus;
  });

  const activeTaxes = taxes.filter((t) => t.isActive !== false);
  const totalCollected = taxes.reduce((s, t) => s + (Number(t.collectedAmount ?? t.collected) || 0), 0);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load tax rates.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Tax Rates</p>
                <p className="mt-0.5 text-2xl font-black">{activeTaxes.length}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Globe className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Tax Rates</p>
                <p className="mt-0.5 text-2xl font-black">{taxes.length}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collected This Period</p>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{fmt(totalCollected)}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tax rates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 w-56 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-3 py-1 text-sm"
          >
            <option value="all">All Types</option>
            <option value="sales">Sales Tax</option>
            <option value="VAT">VAT</option>
            <option value="GST">GST</option>
            <option value="withholding">Withholding</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-3 py-1 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Tax Rate
        </Button>
      </div>

      {isAddOpen && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">New Tax Rate</h3>
            <Input
              placeholder="Tax name (e.g. US Sales Tax) *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Rate % (e.g. 8.5) *"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-36"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm flex-1"
              >
                <option value="sales">Sales Tax</option>
                <option value="VAT">VAT</option>
                <option value="GST">GST</option>
                <option value="withholding">Withholding</option>
              </select>
            </div>
            <Input
              placeholder="Region (e.g. California, EU)"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newName.trim() || !newRate || createTaxMutation.isPending}
                onClick={() =>
                  createTaxMutation.mutate({
                    name: newName.trim(),
                    rate: Number(newRate),
                    type: newType,
                    region: newRegion.trim() || undefined,
                  })
                }
              >
                {createTaxMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading tax rates...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Globe className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No tax rates configured</p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add your first tax rate
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tax Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rate</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Region</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t: any) => {
                    const type = t.type ?? "sales";
                    const typeClass = TYPE_BADGE[type] ?? "bg-muted text-muted-foreground";
                    const isActive = t.isActive !== false;
                    return (
                      <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{t.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-foreground">
                            {t.rate != null ? `${Number(t.rate).toFixed(2)}%` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeClass}`}>
                            {type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {t.region ?? t.country ?? "Global"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isActive ? "success" : "outline"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              Edit
                            </Button>
                            {deleteConfirmId === t.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  disabled={deleteTaxMutation.isPending}
                                  onClick={() => deleteTaxMutation.mutate(t.id)}
                                >
                                  {deleteTaxMutation.isPending ? "..." : "Confirm"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirmId(t.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
