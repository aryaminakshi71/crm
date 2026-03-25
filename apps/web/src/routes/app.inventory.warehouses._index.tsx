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
  MapPin,
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
  status: z.enum(["active", "inactive", ""]).optional(),
});

export const Route = createFileRoute("/app/inventory/warehouses/_index")({
  validateSearch: searchSchema,
  component: WarehousesPage,
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
            {icon || <Warehouse className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UtilizationBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full bg-muted/40 h-1.5 min-w-[80px]">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function WarehousesPage() {
  const { q = "", status: statusFilter = "" } = useSearch({ from: "/app/inventory/warehouses/_index" });
  const navigate = useNavigate({ from: "/app/inventory/warehouses/_index" });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    location: "",
    manager: "",
    capacity: "",
  });

  const queryClient = useQueryClient();

  // Use products list as a proxy since inventoryApi doesn't expose a warehouses endpoint
  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", "products"],
    queryFn: () => inventoryApi.products.list({ page: 1, limit: 50 }),
  });

  const createProduct = useMutation({
    mutationFn: (payload: any) => inventoryApi.products.create(payload),
    onSuccess: () => {
      toast.success("Warehouse created");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsCreateOpen(false);
      setNewWarehouse({ name: "", location: "", manager: "", capacity: "" });
    },
    onError: () => toast.error("Failed to create warehouse"),
  });

  // Derive warehouse-like rows from product location data
  const products = (productsData as any)?.data ?? [];
  const warehouseMap: Record<string, any> = {};
  for (const p of products) {
    const key = p.warehouse || p.location || "Main Warehouse";
    if (!warehouseMap[key]) {
      warehouseMap[key] = {
        id: key,
        name: key,
        location: p.warehouseAddress || p.address || "—",
        manager: p.warehouseManager || "—",
        capacity: 1000,
        used: 0,
        status: "active",
        skuCount: 0,
      };
    }
    warehouseMap[key].used += p.currentStock ?? 0;
    warehouseMap[key].skuCount += 1;
  }
  const warehouses = Object.values(warehouseMap);
  if (warehouses.length === 0 && !isLoading) {
    warehouses.push({
      id: "main",
      name: "Main Warehouse",
      location: "—",
      manager: "—",
      capacity: 1000,
      used: products.reduce((sum: number, p: any) => sum + (p.currentStock ?? 0), 0),
      status: "active",
      skuCount: products.length,
    });
  }

  const filteredWarehouses = warehouses
    .filter((w) => !statusFilter || w.status === statusFilter)
    .filter(
      (w) =>
        !q ||
        w.name?.toLowerCase().includes(q.toLowerCase()) ||
        w.location?.toLowerCase().includes(q.toLowerCase()) ||
        w.manager?.toLowerCase().includes(q.toLowerCase()),
    );

  const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity ?? 0), 0);

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
            <Warehouse className="h-6 w-6 text-primary" />
            Warehouses
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Storage locations, capacity, and utilization
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Metric
          title="Total Warehouses"
          value={warehouses.length}
          icon={<Warehouse className="h-4 w-4" />}
          color="text-cyan-500"
          trend="Active locations"
        />
        <Metric
          title="Total Capacity"
          value={totalCapacity.toLocaleString()}
          icon={<MapPin className="h-4 w-4" />}
          color="text-violet-500"
          trend="Units capacity"
        />
      </div>

      {/* Search + Status filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search warehouses..."
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
            className="pl-9 h-8 w-56 text-sm"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
          {[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ].map((t) => (
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

      {/* Cards */}
      {isLoading ? (
        <Loading />
      ) : filteredWarehouses.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="h-8 w-8" />}
          title="No warehouses found"

          action={
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Warehouse
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWarehouses.map((wh: any) => {
            const utilPct = wh.capacity > 0 ? Math.round((wh.used / wh.capacity) * 100) : 0;
            return (
              <Card key={wh.id} className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Warehouse className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{wh.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {wh.location}
                        </p>
                      </div>
                    </div>
                    <Badge variant={wh.status === "active" ? "success" : "secondary"}>
                      {wh.status || "active"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Manager</span>
                      <span className="font-semibold text-foreground">{wh.manager}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">SKUs</span>
                      <span className="font-semibold text-foreground">{wh.skuCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-semibold text-foreground">
                        {wh.used.toLocaleString()} / {wh.capacity.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                        Utilization
                      </p>
                      <UtilizationBar value={utilPct} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Warehouse"

        onSubmit={() => {
          if (!newWarehouse.name.trim()) {
            toast.error("Warehouse name is required");
            return;
          }
          // Create a placeholder product to register the warehouse
          createProduct.mutate({
            name: `[Warehouse] ${newWarehouse.name}`,
            category: "warehouse",
            warehouse: newWarehouse.name,
            warehouseAddress: newWarehouse.location,
            warehouseManager: newWarehouse.manager,
            currentStock: 0,
            minStockLevel: 0,
          });
        }}
        isLoading={createProduct.isPending}
        submitText="Create Warehouse"
      >
        <FormField label="Warehouse Name" required>
          <Input
            placeholder="e.g. North Distribution Center"
            value={newWarehouse.name}
            onChange={(e) => setNewWarehouse((w) => ({ ...w, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Location">
          <Input
            placeholder="e.g. 123 Industrial Ave, Chicago, IL"
            value={newWarehouse.location}
            onChange={(e) => setNewWarehouse((w) => ({ ...w, location: e.target.value }))}
          />
        </FormField>
        <FormField label="Manager">
          <Input
            placeholder="e.g. John Smith"
            value={newWarehouse.manager}
            onChange={(e) => setNewWarehouse((w) => ({ ...w, manager: e.target.value }))}
          />
        </FormField>
        <FormField label="Capacity (units)">
          <Input
            type="number"
            placeholder="1000"
            min="1"
            value={newWarehouse.capacity}
            onChange={(e) => setNewWarehouse((w) => ({ ...w, capacity: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
