import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  GripVertical,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { dealsApi } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const searchSchema = z.object({
  q: z.string().optional(),
  stage: z.string().optional(),
});

export const Route = createFileRoute("/app/crm/pipeline/_index")({
  validateSearch: searchSchema,
  component: PipelinePage,
});

const STAGES = [
  { key: "prospecting", label: "Prospecting", color: "border-slate-500/30 bg-slate-500/5" },
  { key: "qualification", label: "Qualification", color: "border-blue-500/30 bg-blue-500/5" },
  { key: "proposal", label: "Proposal", color: "border-violet-500/30 bg-violet-500/5" },
  { key: "negotiation", label: "Negotiation", color: "border-amber-500/30 bg-amber-500/5" },
  { key: "closed_won", label: "Closed Won", color: "border-emerald-500/30 bg-emerald-500/5" },
  { key: "closed_lost", label: "Closed Lost", color: "border-red-500/30 bg-red-500/5" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function PipelinePage() {
  const { q = "", stage: stageFilter = "all" } = useSearch({ from: "/app/crm/pipeline/_index" });
  const navigate = useNavigate({ from: "/app/crm/pipeline/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setStageFilter = (v: string) => navigate({ search: (p) => ({ ...p, stage: v }) });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ name: "", value: "", stage: "prospecting", notes: "" });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-pipeline"],
    queryFn: () => dealsApi.list({ page: 1, limit: 300 }),
  });

  const createDeal = useMutation({
    mutationFn: (payload: { name: string; value: number; stage: string; notes?: string }) =>
      dealsApi.create(payload),
    onSuccess: () => {
      toast.success("Deal created");
      qc.invalidateQueries({ queryKey: ["crm-pipeline"] });
      setIsCreateOpen(false);
      setNewDeal({ name: "", value: "", stage: "prospecting", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create deal"),
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => dealsApi.updateStage(id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-pipeline"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to move deal"),
  });

  const allDeals: any[] = (data as any)?.data ?? [];

  const deals = allDeals.filter((d: any) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesQ = [d.name, d.title, d.notes].some((v) => String(v ?? "").toLowerCase().includes(s));
      if (!matchesQ) return false;
    }
    if (stageFilter !== "all" && d.stage !== stageFilter) return false;
    return true;
  });

  const dealsByStage: Record<string, any[]> = {};
  for (const stage of STAGES) {
    dealsByStage[stage.key] = deals.filter((d: any) => d.stage === stage.key);
  }
  // Catch any deals with unexpected stages in the first column
  const knownStages = STAGES.map((s) => s.key);
  const uncategorized = deals.filter((d: any) => !knownStages.includes(d.stage));
  if (uncategorized.length > 0) {
    dealsByStage["prospecting"] = [...(dealsByStage["prospecting"] ?? []), ...uncategorized];
  }

  if (isLoading) return <Loading text="Loading pipeline..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <GripVertical className="h-6 w-6" /> Pipeline
          </h1>
          <p className="text-muted-foreground text-sm">Visualize your deals across pipeline stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{deals.length}</span> total deals ·{" "}
            <span className="font-bold text-emerald-400">
              {fmt(deals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0))}
            </span> pipeline
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            New Deal
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Pipeline Value by Stage */}
      {(() => {
        const pipelineData = STAGES.map((stage) => {
          const stageDeals = deals.filter((d: any) => d.stage === stage.key);
          return {
            stage: stage.label,
            value: stageDeals.reduce((sum: number, d: any) => sum + (Number(d.value) ?? 0), 0),
            count: stageDeals.length,
          };
        });
        return (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BadgeDollarSign className="h-4 w-4 text-primary" />
                Pipeline Value by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pipelineData}
                    margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
                    barSize={28}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 11,
                      }}
                      formatter={(value: number) => [fmt(value), "Value"]}
                    />
                    <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage.key] ?? [];
            const stageValue = stageDeals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
            return (
              <div key={stage.key} className="w-72 shrink-0">
                <Card className={`border ${stage.color}`}>
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold">{stage.label}</CardTitle>
                      <Badge variant="outline" className="text-xs">{stageDeals.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{fmt(stageValue)}</p>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {stageDeals.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">No deals</div>
                    ) : (
                      stageDeals.map((deal: any) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          stages={STAGES}
                          onMoveStage={(stage) => updateStage.mutate({ id: deal.id, stage })}
                        />
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setNewDeal((p) => ({ ...p, stage: stage.key }));
                        setIsCreateOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add deal
                    </button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

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
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Deal Name" required>
            <Input
              value={newDeal.name}
              onChange={(e) => setNewDeal((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enterprise Upgrade"
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Value ($)">
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
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </FormField>
          </div>
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

function DealCard({
  deal,
  stages,
  onMoveStage,
}: {
  deal: any;
  stages: typeof STAGES;
  onMoveStage: (stage: string) => void;
}) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{deal.name ?? deal.title ?? deal.id}</p>
          <p className="text-xs font-semibold text-emerald-400 mt-0.5">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(deal.value) || 0)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {deal.probability != null && (
            <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMove(!showMove)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
            </button>
            {showMove && (
              <div className="absolute right-0 top-5 z-10 w-40 rounded-lg border border-border bg-card shadow-lg p-1">
                {stages.filter((s) => s.key !== deal.stage).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      onMoveStage(s.key);
                      setShowMove(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded transition-colors"
                  >
                    Move to {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {deal.expectedCloseDate && (
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
