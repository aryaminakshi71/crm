/**
 * eCommerce Shipping Index
 *
 * Configure carriers, shipping rates, and delivery options.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Clock,
  Package,
  Plus,
  Search,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ecommerceApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  carrier: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/ecommerce/shipping/_index")({
  validateSearch: searchSchema,
  component: ShippingIndexPage,
});

interface ShippingRate {
  id: string;
  carrier?: string;
  name?: string;
  serviceName?: string;
  estimatedDays?: number;
  deliveryDays?: number;
  minDays?: number;
  maxDays?: number;
  rate?: number;
  price?: number;
  cost?: number;
  status?: string;
  isActive?: boolean;
}

const _MOCK_RATES: ShippingRate[] = [
  { id: "S1", carrier: "FedEx", name: "Ground Shipping", estimatedDays: 5, rate: 9.99, status: "active" },
  { id: "S2", carrier: "FedEx", name: "Express 2-Day", estimatedDays: 2, rate: 24.99, status: "active" },
  { id: "S3", carrier: "UPS", name: "Standard Ground", estimatedDays: 7, rate: 7.99, status: "active" },
  { id: "S4", carrier: "UPS", name: "Next Day Air", estimatedDays: 1, rate: 49.99, status: "active" },
  { id: "S5", carrier: "USPS", name: "Priority Mail", estimatedDays: 3, rate: 12.99, status: "active" },
  { id: "S6", carrier: "DHL", name: "International Express", estimatedDays: 4, rate: 39.99, status: "inactive" },
];

function getName(r: ShippingRate) { return r.name ?? r.serviceName ?? "Unnamed Service"; }
function getRate(r: ShippingRate) { return r.rate ?? r.price ?? r.cost ?? 0; }
function getDays(r: ShippingRate) {
  if (r.estimatedDays != null) return `${r.estimatedDays} days`;
  if (r.minDays != null && r.maxDays != null) return `${r.minDays}–${r.maxDays} days`;
  if (r.deliveryDays != null) return `${r.deliveryDays} days`;
  return "—";
}
function getStatus(r: ShippingRate) {
  if (r.status) return r.status;
  if (r.isActive === true) return "active";
  if (r.isActive === false) return "inactive";
  return "active";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "active" ? "success" : "default"} size="sm">{status}</Badge>
  );
}

function ShippingIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", carrier: carrierFilter = "all", status: statusFilter = "all" } = useSearch({ from: "/app/ecommerce/shipping/_index" });
  const navigate = useNavigate({ from: "/app/ecommerce/shipping" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setCarrierFilter = (v: string) => navigate({ search: (p) => ({ ...p, carrier: v }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v }) });

  const [showCreate, setShowCreate] = useState(false);
  const [newCarrier, setNewCarrier] = useState("");
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState("");
  const [newRate, setNewRate] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-shipping-index"],
    queryFn: () => ecommerceApi.shipping.list(),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { carrier: string; name: string; estimatedDays: number; rate: number }) =>
      ecommerceApi.shipping.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-shipping-index"] });
      setShowCreate(false);
      setNewCarrier("");
      setNewName("");
      setNewDays("");
      setNewRate("");
    },
  });

  const allRates: ShippingRate[] = (data as any)?.data?.length > 0 ? (data as any).data : [];

  const rates = allRates.filter((r) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesQ = [r.carrier, r.name, r.serviceName].some((v) => String(v ?? "").toLowerCase().includes(s));
      if (!matchesQ) return false;
    }
    if (carrierFilter !== "all" && r.carrier !== carrierFilter) return false;
    if (statusFilter !== "all" && getStatus(r) !== statusFilter) return false;
    return true;
  });

  const allCarriers = [...new Set(allRates.map((r) => r.carrier).filter(Boolean))] as string[];

  const activeRates = rates.filter((r) => getStatus(r) === "active");
  const carriers = [...new Set(rates.map((r) => r.carrier).filter(Boolean))];
  const avgDays =
    activeRates.length > 0
      ? activeRates.reduce((sum, r) => sum + (r.estimatedDays ?? r.deliveryDays ?? 3), 0) / activeRates.length
      : 0;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load shipping rates. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Shipping Rates</h2>
          <p className="text-sm text-muted-foreground">Configure carriers and delivery options</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Add Rate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Rates</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{activeRates.length}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Truck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Delivery</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{avgDays.toFixed(1)} days</p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carriers</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{carriers.length}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">New Shipping Rate</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Input placeholder="Carrier (e.g. UPS)" value={newCarrier} onChange={(e) => setNewCarrier(e.target.value)} />
              <Input placeholder="Service name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input type="number" placeholder="Est. days" value={newDays} onChange={(e) => setNewDays(e.target.value)} />
              <Input type="number" placeholder="Rate ($)" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newCarrier || !newName || !newRate || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    carrier: newCarrier,
                    name: newName,
                    estimatedDays: parseInt(newDays) || 5,
                    rate: parseFloat(newRate),
                  })
                }
              >
                {createMutation.isPending ? "Adding..." : "Add Rate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search carriers or services..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {allCarriers.length > 0 && (
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All carriers</option>
            {allCarriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Rates Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {rates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Truck className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No shipping rates configured</p>
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                Add Rate
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Carrier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Service</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Est. Delivery</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Rate</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                            <Truck className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold">{rate.carrier ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{getName(rate)}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{getDays(rate)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">${getRate(rate).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={getStatus(rate)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
