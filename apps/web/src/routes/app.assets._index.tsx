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
  DollarSign,
  HardDrive,
  Plus,
  Search,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { assetsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/assets/_index")({
  validateSearch: searchSchema,
  component: AssetsIndexPage,
});

type AssetStatus = "active" | "maintenance" | "retired" | "";

function statusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "maintenance") return "warning";
  if (status === "retired") return "secondary";
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
            {icon || <HardDrive className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetsIndexPage() {
  const { q = "", type: typeFilterParam = "", page = 1 } = useSearch({ from: "/app/assets/_index" });
  const navigate = useNavigate({ from: "/app/assets/_index" });
  const search = q;
  const typeFilter = typeFilterParam;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setTypeFilter = (v: string) => navigate({ search: (p) => ({ ...p, type: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [statusFilter, setStatusFilter] = useState<AssetStatus>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    assetType: "",
    serialNumber: "",
    location: "",
    assignedTo: "",
    purchaseDate: "",
    value: "",
  });

  const queryClient = useQueryClient();

  const { data: assetsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["assets", "list", search],
    queryFn: () => assetsApi.list({ search: search || undefined, page: 1, limit: 50 }),
  });

  const createAsset = useMutation({
    mutationFn: (payload: any) =>
      assetsApi.create({
        name: payload.name,
        mimeType: "application/x-asset",
        size: "0",
        originalName: payload.name,
      }),
    onSuccess: () => {
      toast.success("Asset created");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsCreateOpen(false);
      setNewAsset({ name: "", assetType: "", serialNumber: "", location: "", assignedTo: "", purchaseDate: "", value: "" });
    },
    onError: () => toast.error("Failed to create asset"),
  });

  const deleteAsset = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      toast.success("Asset deleted");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: () => toast.error("Failed to delete asset"),
  });

  const assets = (assetsData as any)?.data ?? [];

  const filtered = assets.filter((a: any) => {
    const matchSearch =
      !search ||
      (a.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.serialNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.assetStatus === statusFilter || a.status === statusFilter;
    const matchType = !typeFilter || a.assetType === typeFilter || a.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const types = Array.from(new Set(assets.map((a: any) => a.assetType || a.type).filter(Boolean)));
  const totalValue = assets.reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);
  const maintenanceCount = assets.filter(
    (a: any) => a.assetStatus === "maintenance" || a.status === "maintenance",
  ).length;

  const STATUS_TABS: { value: AssetStatus; label: string }[] = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "maintenance", label: "Maintenance" },
    { value: "retired", label: "Retired" },
  ];

  if (isError) {
    return (
      <EmptyState
        variant="error"
        title="Something went wrong"
        description="Failed to load assets. Please try again."
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
            <HardDrive className="h-6 w-6 text-primary" />
            Assets
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Physical assets, equipment, and assigned hardware
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric
          title="Total Assets"
          value={assets.length}
          icon={<HardDrive className="h-4 w-4" />}
          color="text-cyan-500"
          trend="Tracked items"
        />
        <Metric
          title="Total Value"
          value={totalValue > 0 ? `$${totalValue.toLocaleString()}` : "—"}
          icon={<DollarSign className="h-4 w-4" />}
          color="text-emerald-500"
          trend="Portfolio value"
        />
        <Metric
          title="In Maintenance"
          value={maintenanceCount}
          icon={<Settings className="h-4 w-4" />}
          color="text-amber-500"
          trend="Under repair"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
        {types.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Types</option>
            {types.map((t: any) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
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

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<HardDrive />}
          title="No assets found"
          description="Add your first asset or adjust your filters."
          action={
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["Asset", "Type", "Serial No.", "Location", "Assigned To", "Purchase Date", "Value", "Status", ""].map(
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
              {filtered.map((asset: any) => {
                const status = asset.assetStatus || asset.status || "active";
                return (
                  <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                          <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-semibold text-foreground">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {asset.assetType || asset.type || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {asset.serialNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {asset.location || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {asset.assignedTo || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {asset.purchaseDate
                        ? new Date(asset.purchaseDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                      {asset.value ? `$${Number(asset.value).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(status) as any}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteAsset.mutate(asset.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Asset"
        onSubmit={() => {
          if (!newAsset.name.trim()) {
            toast.error("Asset name is required");
            return;
          }
          createAsset.mutate(newAsset);
        }}
        isLoading={createAsset.isPending}
        submitText="Create Asset"
      >
        <FormField label="Asset Name" required>
          <Input
            placeholder="e.g. Dell XPS 15 Laptop"
            value={newAsset.name}
            onChange={(e) => setNewAsset((a) => ({ ...a, name: e.target.value }))}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type">
            <Input
              placeholder="e.g. Laptop, Vehicle, Equipment"
              value={newAsset.assetType}
              onChange={(e) => setNewAsset((a) => ({ ...a, assetType: e.target.value }))}
            />
          </FormField>
          <FormField label="Serial Number">
            <Input
              placeholder="e.g. SN-123456"
              value={newAsset.serialNumber}
              onChange={(e) => setNewAsset((a) => ({ ...a, serialNumber: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Location">
            <Input
              placeholder="e.g. HQ Office, Warehouse A"
              value={newAsset.location}
              onChange={(e) => setNewAsset((a) => ({ ...a, location: e.target.value }))}
            />
          </FormField>
          <FormField label="Assigned To">
            <Input
              placeholder="e.g. John Smith"
              value={newAsset.assignedTo}
              onChange={(e) => setNewAsset((a) => ({ ...a, assignedTo: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Purchase Date">
            <Input
              type="date"
              value={newAsset.purchaseDate}
              onChange={(e) => setNewAsset((a) => ({ ...a, purchaseDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Value ($)">
            <Input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={newAsset.value}
              onChange={(e) => setNewAsset((a) => ({ ...a, value: e.target.value }))}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
