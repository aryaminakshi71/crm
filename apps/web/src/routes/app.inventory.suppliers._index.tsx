import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  Building2,
  Clock,
  Mail,
  Phone,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inventoryApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/inventory/suppliers/_index")({
  validateSearch: searchSchema,
  component: SuppliersPage,
});

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}>
            {icon || <Building2 className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReliabilityDots({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 90 ? "text-emerald-500" : pct >= 70 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-bold ${color}`}>{pct}%</span>
      <div className="flex gap-0.5">
        {[20, 40, 60, 80, 100].map((threshold) => (
          <div
            key={threshold}
            className={`h-1.5 w-1.5 rounded-full ${pct >= threshold ? color.replace("text-", "bg-") : "bg-muted/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

function SuppliersPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/inventory/suppliers/_index" });
  const navigate = useNavigate({ from: "/app/inventory/suppliers" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    leadTimeDays: "",
    categories: "",
  });

  const queryClient = useQueryClient();

  // Derive supplier data from products that have supplier info
  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "products", "suppliers"],
    queryFn: () => inventoryApi.products.list({ page: 1, limit: 50 }),
  });

  const addSupplierProduct = useMutation({
    mutationFn: (payload: any) => inventoryApi.products.create(payload),
    onSuccess: () => {
      toast.success("Supplier added");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsCreateOpen(false);
      setNewSupplier({ name: "", contactName: "", email: "", phone: "", leadTimeDays: "", categories: "" });
    },
    onError: () => toast.error("Failed to add supplier"),
  });

  const products = (productsData as any)?.data ?? [];

  // Build supplier rows from product supplier metadata
  const supplierMap: Record<string, any> = {};
  for (const p of products) {
    const sName = p.supplierName || p.vendor;
    if (!sName) continue;
    if (!supplierMap[sName]) {
      supplierMap[sName] = {
        id: sName,
        name: sName,
        contact: p.supplierContact || "—",
        email: p.supplierEmail || "—",
        phone: p.supplierPhone || "—",
        leadTime: p.leadTimeDays ?? 7,
        reliability: p.supplierReliability ?? 85,
        categories: [],
        productCount: 0,
      };
    }
    if (p.category && !supplierMap[sName].categories.includes(p.category)) {
      supplierMap[sName].categories.push(p.category);
    }
    supplierMap[sName].productCount += 1;
  }

  // If no real supplier data, show example structure
  const suppliers = Object.values(supplierMap);

  const filtered = suppliers.filter(
    (s: any) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const avgLeadTime =
    suppliers.length > 0
      ? Math.round(suppliers.reduce((sum: number, s: any) => sum + s.leadTime, 0) / suppliers.length)
      : 0;

  if (isError) {
    return (
      <EmptyState
        variant="error"
        title="Something went wrong"

        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Suppliers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vendor contacts, lead times, and reliability scores
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Metric
          title="Total Suppliers"
          value={suppliers.length}
          icon={<Building2 className="h-4 w-4" />}
          color="text-cyan-500"
          trend="Active vendors"
        />
        <Metric
          title="Avg Lead Time"
          value={avgLeadTime > 0 ? `${avgLeadTime}d` : "—"}
          icon={<Clock className="h-4 w-4" />}
          color="text-amber-500"
          trend="Days to fulfillment"
        />
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search suppliers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-xs h-8"
        />
      </div>

      {/* Table / Empty */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No suppliers found"

          action={
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["Supplier", "Contact", "Email", "Phone", "Lead Time", "Reliability", "Categories"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background">
              {filtered.map((s: any) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.contact}</td>
                  <td className="px-4 py-3">
                    {s.email !== "—" ? (
                      <a
                        href={`mailto:${s.email}`}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {s.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.phone !== "—" ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {s.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {s.leadTime}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ReliabilityDots value={s.reliability} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(s.categories as string[]).slice(0, 3).map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-[9px] h-4 px-1.5">
                          {cat}
                        </Badge>
                      ))}
                      {s.categories.length === 0 && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Supplier"

        onSubmit={() => {
          if (!newSupplier.name.trim()) {
            toast.error("Supplier name is required");
            return;
          }
          addSupplierProduct.mutate({
            name: `[Supplier Ref] ${newSupplier.name}`,
            category: newSupplier.categories || "General",
            supplierName: newSupplier.name,
            supplierContact: newSupplier.contactName,
            supplierEmail: newSupplier.email,
            supplierPhone: newSupplier.phone,
            leadTimeDays: newSupplier.leadTimeDays ? Number(newSupplier.leadTimeDays) : 7,
            currentStock: 0,
            minStockLevel: 0,
          });
        }}
        isLoading={addSupplierProduct.isPending}
        submitText="Add Supplier"
      >
        <FormField label="Supplier Name" required>
          <Input
            placeholder="e.g. Acme Components Ltd."
            value={newSupplier.name}
            onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Contact Name">
            <Input
              placeholder="e.g. Jane Doe"
              value={newSupplier.contactName}
              onChange={(e) => setNewSupplier((s) => ({ ...s, contactName: e.target.value }))}
            />
          </FormField>
          <FormField label="Lead Time (days)">
            <Input
              type="number"
              placeholder="7"
              min="1"
              value={newSupplier.leadTimeDays}
              onChange={(e) => setNewSupplier((s) => ({ ...s, leadTimeDays: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Email">
            <Input
              type="email"
              placeholder="supplier@example.com"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier((s) => ({ ...s, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Phone">
            <Input
              placeholder="+1 (555) 000-0000"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField label="Categories">
          <Input
            placeholder="e.g. Electronics, Hardware"
            value={newSupplier.categories}
            onChange={(e) => setNewSupplier((s) => ({ ...s, categories: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
