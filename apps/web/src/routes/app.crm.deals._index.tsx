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
import { Pagination } from "@/components/ui/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  CalendarDays,
  DollarSign,
  Download,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { dealsApi } from "@/lib/api";
import { z } from "zod";

const searchSchema = z.object({
  stage: z.string().optional().default("all"),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/crm/deals/_index")({
  validateSearch: searchSchema,
  component: DealsPage,
});

const STAGE_VARIANTS: Record<string, string> = {
  lead: "outline",
  prospecting: "outline",
  qualification: "primary",
  proposal: "primary",
  negotiation: "warning",
  "closed_won": "success",
  "closed_lost": "destructive",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function exportToCsv(filename: string, rows: string[][], headers: string[]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 50;

function DealsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { stage: stageFilter, page } = useSearch({ from: Route.id });
  const setStageFilter = (stage: string) => navigate({ search: (prev) => ({ ...prev, stage, page: 1 }) });
  const setPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) });
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    stage: "prospecting",
    notes: "",
    expectedCloseDate: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-deals", stageFilter, page],
    queryFn: () =>
      dealsApi.list({
        page,
        limit: PAGE_SIZE,
        stage: stageFilter !== "all" ? stageFilter : undefined,
      }),
  });

  const DEALS_KEY = ["crm-deals", stageFilter, page];

  const createDeal = useMutation({
    mutationFn: (payload: { name: string; value: number; stage: string; notes?: string; expectedCloseDate?: string }) =>
      dealsApi.create(payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: DEALS_KEY });
      const previous = qc.getQueryData(DEALS_KEY);
      qc.setQueryData(DEALS_KEY, (old: any) => ({
        ...old,
        data: [{ ...payload, id: `temp-${Date.now()}` }, ...(old?.data ?? [])],
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(DEALS_KEY, ctx.previous);
      toast.error("Failed to create deal");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["crm-deals"] }),
    onSuccess: () => {
      toast.success("Deal created");
      setIsCreateOpen(false);
      setNewDeal({ name: "", value: "", stage: "prospecting", notes: "", expectedCloseDate: "" });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: DEALS_KEY });
      const previous = qc.getQueryData(DEALS_KEY);
      qc.setQueryData(DEALS_KEY, (old: any) => ({
        ...old,
        data: (old?.data ?? []).filter((item: any) => item.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(DEALS_KEY, ctx.previous);
      toast.error("Failed to delete deal");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["crm-deals"] }),
    onSuccess: () => toast.success("Deal deleted"),
  });

  const deals: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const totalPipeline = deals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
  const wonDeals = deals.filter((d: any) => d.stage === "closed_won");
  const wonThisMonth = wonDeals.filter((d: any) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const updated = d.updatedAt ? new Date(d.updatedAt) : null;
    return updated && updated >= start;
  });
  const avgDealSize = deals.length > 0 ? totalPipeline / deals.length : 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return deals;
    const s = search.toLowerCase();
    return deals.filter((d: any) =>
      [d.name, d.stage, d.notes].some((v) => String(v ?? "").toLowerCase().includes(s))
    );
  }, [deals, search]);

  const allSelected = filtered.length > 0 && filtered.every((d: any) => selectedIds.has(d.id));
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(filtered.map((d: any) => d.id)));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  function handleBulkExport() {
    const selected = filtered.filter((d: any) => selectedIds.has(d.id));
    const headers = ["Name", "Company", "Stage", "Value", "Owner", "Close Date"];
    const rows = selected.map((d: any) => [
      d.name ?? d.title ?? "",
      d.company ?? d.companyName ?? "",
      d.stage ?? "",
      String(Number(d.value) || 0),
      d.owner ?? d.assignedTo ?? "",
      d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : "",
    ]);
    exportToCsv("deals.csv", rows, headers);
    toast.success(`Exported ${selected.length} deal${selected.length !== 1 ? "s" : ""}`);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;
    for (const id of ids) {
      try {
        await dealsApi.delete(id);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    qc.invalidateQueries({ queryKey: ["crm-deals"] });
    setSelectedIds(new Set());
    if (successCount > 0) toast.success(`Deleted ${successCount} deal${successCount !== 1 ? "s" : ""}`);
    if (errorCount > 0) toast.error(`Failed to delete ${errorCount} deal${errorCount !== 1 ? "s" : ""}`);
  }

  if (isLoading) return <Loading text="Loading deals..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <BadgeDollarSign className="h-6 w-6" /> Deals
          </h1>
          <p className="text-muted-foreground text-sm">Manage your sales pipeline and track deal progress.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Total Pipeline" value={fmt(totalPipeline)} icon={<DollarSign className="h-4 w-4" />} trend={`${deals.length} deals`} color="text-emerald-400" />
        <Metric
          title="Won This Month"
          value={fmt(wonThisMonth.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0))}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={`${wonThisMonth.length} deals closed`}
          color="text-primary"
        />
        <Metric title="Avg Deal Size" value={fmt(avgDealSize)} icon={<Target className="h-4 w-4" />} trend="across all active deals" color="text-cyan-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deal name, stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All stages</option>
          <option value="prospecting">Prospecting</option>
          <option value="qualification">Qualification</option>
          <option value="proposal">Proposal</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1.5" />Delete
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<BadgeDollarSign className="h-12 w-12" />}
              title="No deals found"
              description={search ? "Try adjusting your search." : "Create your first deal to start tracking your pipeline."}
              action={<Button onClick={() => setIsCreateOpen(true)}>New Deal</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/30">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  aria-label="Select all deals"
                />
                <span className="text-xs text-muted-foreground font-medium">Select all</span>
              </div>
              {filtered.map((deal: any) => (
                <div key={deal.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(deal.id)}
                      onChange={() => toggleSelect(deal.id)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
                      aria-label={`Select deal ${deal.name ?? deal.id}`}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{deal.name ?? deal.title ?? deal.id}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-emerald-400">
                          {fmt(Number(deal.value) || 0)}
                        </span>
                        {deal.expectedCloseDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(deal.expectedCloseDate).toLocaleDateString()}
                          </span>
                        )}
                        {deal.probability != null && (
                          <span className="text-xs text-muted-foreground">{deal.probability}% probability</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant={(STAGE_VARIANTS[deal.stage ?? ""] ?? "outline") as any}>
                      {deal.stage ?? "unknown"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => deleteDeal.mutate(deal.id)}
                      loading={deleteDeal.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Deal"
        submitText="Create Deal"
        loading={createDeal.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newDeal.name.trim()) {
            toast.error("Deal name is required");
            return;
          }
          const value = parseFloat(newDeal.value);
          if (isNaN(value) || value < 0) {
            toast.error("Enter a valid deal value");
            return;
          }
          createDeal.mutate({
            name: newDeal.name.trim(),
            value,
            stage: newDeal.stage,
            notes: newDeal.notes.trim() || undefined,
            expectedCloseDate: newDeal.expectedCloseDate || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Deal Name" required>
            <Input
              value={newDeal.name}
              onChange={(e) => setNewDeal((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enterprise SaaS Upgrade"
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Value ($)" required>
              <Input
                type="number"
                min="0"
                value={newDeal.value}
                onChange={(e) => setNewDeal((p) => ({ ...p, value: e.target.value }))}
                placeholder="50000"
              />
            </FormField>
            <FormField label="Stage">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newDeal.stage}
                onChange={(e) => setNewDeal((p) => ({ ...p, stage: e.target.value }))}
              >
                <option value="prospecting">Prospecting</option>
                <option value="qualification">Qualification</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </FormField>
          </div>
          <FormField label="Expected Close Date">
            <Input
              type="date"
              value={newDeal.expectedCloseDate}
              onChange={(e) => setNewDeal((p) => ({ ...p, expectedCloseDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Notes">
            <Input
              value={newDeal.notes}
              onChange={(e) => setNewDeal((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Additional context..."
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
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
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <BadgeDollarSign className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
