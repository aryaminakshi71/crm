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
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  ArrowUpDown,
  Package,
  Plus,
  Search,
  Warehouse,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { inventoryApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/inventory/stock/_index")({
  validateSearch: searchSchema,
  component: StockPage,
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
            {icon || <Package className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StockPage() {
  const { q: search = "" } = useSearch({ from: "/app/inventory/stock/_index" });
  const navigate = useNavigate({ from: "/app/inventory/stock" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({
    quantity: "",
    reason: "",
    type: "add",
  });

  const queryClient = useQueryClient();

  const { data: stockData, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "stock"],
    queryFn: () => inventoryApi.products.list({ page: 1, limit: 50 }),
  });

  const adjustStock = useMutation({
    mutationFn: (payload: any) =>
      inventoryApi.products.update(payload.id, {
        currentStock:
          payload.type === "add"
            ? (payload.currentStock ?? 0) + Number(payload.quantity)
            : Math.max(0, (payload.currentStock ?? 0) - Number(payload.quantity)),
      }),
    onSuccess: () => {
      toast.success("Stock adjusted successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsAdjustOpen(false);
      setAdjustForm({ quantity: "", reason: "", type: "add" });
      setSelectedStock(null);
    },
    onError: () => toast.error("Failed to adjust stock"),
  });

  const items = (stockData as any)?.data ?? [];
  const filtered = items.filter(
    (i: any) =>
      !search ||
      (i.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (i.sku ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const warehouses = Array.from(new Set(items.map((i: any) => i.warehouse).filter(Boolean)));

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
            <ArrowUpDown className="h-6 w-6 text-primary" />
            Stock Levels
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            On-hand quantities, reservations, and adjustments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Metric
          title="Total SKUs Tracked"
          value={items.length}
          icon={<Package className="h-4 w-4" />}
          color="text-cyan-500"
          trend="Across all locations"
        />
        <Metric
          title="Warehouses"
          value={warehouses.length || 1}
          icon={<Warehouse className="h-4 w-4" />}
          color="text-violet-500"
          trend="Storage locations"
        />
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by product or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-xs h-8"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No stock records found"

        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["Product", "SKU", "On Hand", "Reserved", "Available", "Last Updated", ""].map(
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
              {filtered.map((item: any) => {
                const onHand = item.currentStock ?? 0;
                const reserved = item.reservedStock ?? 0;
                const available = Math.max(0, onHand - reserved);
                return (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {item.sku || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-foreground">{onHand}</span>
                      <span className="text-xs text-muted-foreground ml-1">{item.unit || "units"}</span>
                    </td>
                    <td className="px-4 py-3 text-amber-500 font-semibold">{reserved}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          available === 0 ? "text-red-500" : available <= (item.minStockLevel ?? 0) ? "text-amber-500" : "text-emerald-500"
                        }`}
                      >
                        {available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setSelectedStock(item);
                          setIsAdjustOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <FormModal
        isOpen={isAdjustOpen}
        onClose={() => { setIsAdjustOpen(false); setSelectedStock(null); }}
        title="Adjust Stock"
        onSubmit={() => {
          if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) {
            toast.error("Please enter a valid quantity");
            return;
          }
          adjustStock.mutate({
            id: selectedStock.id,
            currentStock: selectedStock.currentStock ?? 0,
            quantity: adjustForm.quantity,
            type: adjustForm.type,
            reason: adjustForm.reason,
          });
        }}
        isLoading={adjustStock.isPending}
        submitText="Apply Adjustment"
      >
        <FormField label="Adjustment Type">
          <select
            value={adjustForm.type}
            onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full h-9 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="add">Add Stock</option>
            <option value="remove">Remove Stock</option>
          </select>
        </FormField>
        <FormField label="Quantity" required>
          <Input
            type="number"
            placeholder="0"
            min="1"
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
          />
        </FormField>
        <FormField label="Reason">
          <Input
            placeholder="e.g. Cycle count correction, damage, etc."
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
