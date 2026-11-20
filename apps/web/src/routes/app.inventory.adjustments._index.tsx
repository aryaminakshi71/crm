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
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inventoryApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["add", "remove", "damage", "cycle_count", ""]).optional(),
});

export const Route = createFileRoute("/app/inventory/adjustments/_index")({
  validateSearch: searchSchema,
  component: AdjustmentsPage,
});

type AdjustmentType = "add" | "remove" | "damage" | "cycle_count" | "";

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "add", label: "Add" },
  { value: "remove", label: "Remove" },
  { value: "damage", label: "Damage" },
  { value: "cycle_count", label: "Cycle Count" },
];

function typeColor(type: string) {
  if (type === "add") return "success";
  if (type === "remove") return "destructive";
  if (type === "damage") return "warning";
  if (type === "cycle_count") return "secondary";
  return "outline";
}

function typeIcon(type: string) {
  if (type === "add") return <ArrowUp className="h-3 w-3" />;
  if (type === "remove") return <ArrowDown className="h-3 w-3" />;
  if (type === "damage") return <RefreshCw className="h-3 w-3" />;
  return <ClipboardList className="h-3 w-3" />;
}

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
            {icon || <ClipboardList className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdjustmentsPage() {
  const { q = "", type: typeFilterRaw = "" } = useSearch({ from: "/app/inventory/adjustments/_index" });
  const typeFilter = typeFilterRaw as AdjustmentType;
  const navigate = useNavigate({ from: "/app/inventory/adjustments" });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAdj, setNewAdj] = useState({
    productId: "",
    productName: "",
    type: "add",
    quantity: "",
    reason: "",
  });

  const queryClient = useQueryClient();

  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "products"],
    queryFn: () => inventoryApi.products.list({ page: 1, limit: 50 }),
  });

  const applyAdjustment = useMutation({
    mutationFn: async (payload: any) => {
      const product = products.find((p: any) => p.id === payload.productId);
      if (!product) throw new Error("Product not found");
      const qty = Number(payload.quantity);
      let newStock = product.currentStock ?? 0;
      if (payload.type === "add") newStock += qty;
      else if (payload.type === "remove" || payload.type === "damage") newStock = Math.max(0, newStock - qty);
      return inventoryApi.products.update(payload.productId, { currentStock: newStock });
    },
    onSuccess: () => {
      toast.success("Adjustment applied");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsCreateOpen(false);
      setNewAdj({ productId: "", productName: "", type: "add", quantity: "", reason: "" });
    },
    onError: () => toast.error("Failed to apply adjustment"),
  });

  const products = (productsData as any)?.data ?? [];

  // Build synthetic adjustment log from products (we track stock changes via product updates)
  // Since there's no dedicated adjustments endpoint, show a table allowing manual adjustments
  const now = new Date();
  const thisMonth = products.filter((p: any) => {
    if (!p.updatedAt) return false;
    const d = new Date(p.updatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Simulate adjustment rows from product history
  const adjustmentRows: any[] = products
    .filter((p: any) => p.lastAdjustmentType || p.lastAdjustmentQty)
    .map((p: any) => ({
      id: `adj-${p.id}`,
      date: p.updatedAt || p.createdAt,
      product: p.name,
      warehouse: p.warehouse || "Main",
      type: p.lastAdjustmentType || "cycle_count",
      quantity: p.lastAdjustmentQty ?? 0,
      reason: p.lastAdjustmentReason || "—",
      user: p.lastAdjustedBy || "—",
    }));

  const filtered = adjustmentRows
    .filter((a) => !typeFilter || a.type === typeFilter)
    .filter((a) =>
      !q ||
      a.product?.toLowerCase().includes(q.toLowerCase()) ||
      a.reason?.toLowerCase().includes(q.toLowerCase()) ||
      a.warehouse?.toLowerCase().includes(q.toLowerCase()),
    );

  const netChange = adjustmentRows.reduce((sum, a) => {
    if (a.type === "add") return sum + a.quantity;
    if (a.type === "remove" || a.type === "damage") return sum - a.quantity;
    return sum;
  }, 0);

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
            <ClipboardList className="h-6 w-6 text-primary" />
            Adjustments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Stock corrections, damage records, and cycle counts
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Adjustment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Metric
          title="Adjustments This Month"
          value={thisMonth.length}
          icon={<ClipboardList className="h-4 w-4" />}
          color="text-cyan-500"
          trend="Product updates"
        />
        <Metric
          title="Net Change"
          value={netChange >= 0 ? `+${netChange}` : `${netChange}`}
          icon={netChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          color={netChange >= 0 ? "text-emerald-500" : "text-red-500"}
          trend="Units net delta"
        />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search adjustments..."
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
            className="pl-9 h-8 w-56 text-sm"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
          {ADJUSTMENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, type: t.value || undefined }) })
              }
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                typeFilter === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No adjustments recorded"

          action={
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Adjustment
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["Date", "Product", "Warehouse", "Type", "Qty", "Reason", "User"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background">
              {filtered.map((adj: any) => (
                <tr key={adj.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {adj.date ? new Date(adj.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{adj.product}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{adj.warehouse}</td>
                  <td className="px-4 py-3">
                    <Badge variant={typeColor(adj.type) as any} className="gap-1">
                      {typeIcon(adj.type)}
                      {adj.type.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${
                        adj.type === "add" ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {adj.type === "add" ? "+" : "-"}
                      {adj.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{adj.reason}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{adj.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create adjustment modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Adjustment"

        onSubmit={() => {
          if (!newAdj.productId) {
            toast.error("Please select a product");
            return;
          }
          if (!newAdj.quantity || Number(newAdj.quantity) <= 0) {
            toast.error("Please enter a valid quantity");
            return;
          }
          applyAdjustment.mutate(newAdj);
        }}
        isLoading={applyAdjustment.isPending}
        submitText="Apply Adjustment"
      >
        <FormField label="Product" required>
          <select
            value={newAdj.productId}
            onChange={(e) => {
              const p = products.find((p: any) => p.id === e.target.value);
              setNewAdj((a) => ({ ...a, productId: e.target.value, productName: p?.name ?? "" }));
            }}
            className="w-full h-9 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a product…</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} (stock: {p.currentStock ?? 0})
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Adjustment Type">
          <select
            value={newAdj.type}
            onChange={(e) => setNewAdj((a) => ({ ...a, type: e.target.value }))}
            className="w-full h-9 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="add">Add</option>
            <option value="remove">Remove</option>
            <option value="damage">Damage</option>
            <option value="cycle_count">Cycle Count</option>
          </select>
        </FormField>
        <FormField label="Quantity" required>
          <Input
            type="number"
            placeholder="0"
            min="1"
            value={newAdj.quantity}
            onChange={(e) => setNewAdj((a) => ({ ...a, quantity: e.target.value }))}
          />
        </FormField>
        <FormField label="Reason">
          <Input
            placeholder="e.g. Annual cycle count, damaged in transit"
            value={newAdj.reason}
            onChange={(e) => setNewAdj((a) => ({ ...a, reason: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
