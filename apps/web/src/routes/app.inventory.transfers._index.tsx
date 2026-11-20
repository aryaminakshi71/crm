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
  ArrowRight,
  Package,
  Plus,
  Search,
  Truck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inventoryApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["pending", "in_transit", "completed", ""]).optional(),
});

export const Route = createFileRoute("/app/inventory/transfers/_index")({
  validateSearch: searchSchema,
  component: TransfersPage,
});

type TransferStatus = "pending" | "in_transit" | "completed" | "";

function statusVariant(status: string) {
  if (status === "completed") return "success";
  if (status === "in_transit") return "warning";
  if (status === "pending") return "secondary";
  return "outline";
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
            {icon || <Truck className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransfersPage() {
  const { q = "", status: statusFilterRaw = "" } = useSearch({ from: "/app/inventory/transfers/_index" });
  const statusFilter = statusFilterRaw as TransferStatus;
  const navigate = useNavigate({ from: "/app/inventory/transfers" });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    productId: "",
    fromWarehouse: "",
    toWarehouse: "",
    quantity: "",
  });

  const queryClient = useQueryClient();

  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "products"],
    queryFn: () => inventoryApi.products.list({ page: 1, limit: 50 }),
  });

  const createTransfer = useMutation({
    mutationFn: (payload: any) =>
      inventoryApi.products.update(payload.productId, {
        pendingTransfer: true,
        transferFrom: payload.fromWarehouse,
        transferTo: payload.toWarehouse,
        transferQty: Number(payload.quantity),
        transferStatus: "pending",
        transferDate: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Transfer created");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsCreateOpen(false);
      setNewTransfer({ productId: "", fromWarehouse: "", toWarehouse: "", quantity: "" });
    },
    onError: () => toast.error("Failed to create transfer"),
  });

  const products = (productsData as any)?.data ?? [];

  // Build transfer rows from product transfer metadata
  const transferRows: any[] = products
    .filter((p: any) => p.transferStatus || p.pendingTransfer)
    .map((p: any, i: number) => ({
      id: `TRF-${String(i + 1).padStart(4, "0")}`,
      productId: p.id,
      product: p.name,
      fromWarehouse: p.transferFrom || "Main",
      toWarehouse: p.transferTo || "Secondary",
      quantity: p.transferQty ?? 0,
      status: p.transferStatus || "pending",
      date: p.transferDate || p.updatedAt,
    }));

  const filtered = transferRows
    .filter((t) => !statusFilter || t.status === statusFilter)
    .filter((t) =>
      !q ||
      t.product?.toLowerCase().includes(q.toLowerCase()) ||
      t.fromWarehouse?.toLowerCase().includes(q.toLowerCase()) ||
      t.toWarehouse?.toLowerCase().includes(q.toLowerCase()) ||
      t.id?.toLowerCase().includes(q.toLowerCase()),
    );

  const pendingCount = transferRows.filter((t) => t.status === "pending").length;
  const inTransitCount = transferRows.filter((t) => t.status === "in_transit").length;

  const STATUS_TABS: { value: TransferStatus; label: string }[] = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_transit", label: "In Transit" },
    { value: "completed", label: "Completed" },
  ];

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
            <Truck className="h-6 w-6 text-primary" />
            Transfers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Inter-warehouse stock movements
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Transfer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Metric
          title="Pending Transfers"
          value={pendingCount}
          icon={<Package className="h-4 w-4" />}
          color="text-amber-500"
          trend="Awaiting dispatch"
        />
        <Metric
          title="In Transit"
          value={inTransitCount}
          icon={<Truck className="h-4 w-4" />}
          color="text-cyan-500"
          trend="Currently moving"
        />
      </div>

      {/* Search + Status tabs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
            className="pl-9 h-8 w-56 text-sm"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, status: t.value || undefined }) })
              }
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === t.value
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
          icon={<Truck className="h-8 w-8" />}
          title="No transfers found"

          action={
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["Transfer ID", "Product", "From", "", "To", "Qty", "Status", "Date"].map(
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
              {filtered.map((t: any) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{t.product}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{t.fromWarehouse}</td>
                  <td className="px-4 py-3">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{t.toWarehouse}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{t.quantity}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(t.status) as any}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create transfer modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Transfer"

        onSubmit={() => {
          if (!newTransfer.productId) {
            toast.error("Please select a product");
            return;
          }
          if (!newTransfer.fromWarehouse.trim() || !newTransfer.toWarehouse.trim()) {
            toast.error("Please specify both origin and destination warehouses");
            return;
          }
          if (!newTransfer.quantity || Number(newTransfer.quantity) <= 0) {
            toast.error("Please enter a valid quantity");
            return;
          }
          createTransfer.mutate(newTransfer);
        }}
        isLoading={createTransfer.isPending}
        submitText="Create Transfer"
      >
        <FormField label="Product" required>
          <select
            value={newTransfer.productId}
            onChange={(e) => setNewTransfer((t) => ({ ...t, productId: e.target.value }))}
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
        <div className="grid grid-cols-2 gap-3">
          <FormField label="From Warehouse" required>
            <Input
              placeholder="e.g. Main Warehouse"
              value={newTransfer.fromWarehouse}
              onChange={(e) => setNewTransfer((t) => ({ ...t, fromWarehouse: e.target.value }))}
            />
          </FormField>
          <FormField label="To Warehouse" required>
            <Input
              placeholder="e.g. East Distribution"
              value={newTransfer.toWarehouse}
              onChange={(e) => setNewTransfer((t) => ({ ...t, toWarehouse: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField label="Quantity" required>
          <Input
            type="number"
            placeholder="0"
            min="1"
            value={newTransfer.quantity}
            onChange={(e) => setNewTransfer((t) => ({ ...t, quantity: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
