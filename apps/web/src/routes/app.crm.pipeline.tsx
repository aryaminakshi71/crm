import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DollarSign,
  GripVertical,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { dealsApi } from "../lib/api";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/crm/pipeline")({
  component: CrmPipelinePage,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
type DealStage = (typeof DEAL_STAGES)[number];

const STAGE_META: Record<DealStage, { label: string; color: string; bg: string; textColor: string }> = {
  lead: { label: "Lead", color: "#94a3b8", bg: "border-slate-400/20 bg-slate-400/5", textColor: "text-slate-400" },
  qualified: { label: "Qualified", color: "#38bdf8", bg: "border-sky-400/20 bg-sky-400/5", textColor: "text-sky-400" },
  proposal: { label: "Proposal", color: "#a78bfa", bg: "border-violet-400/20 bg-violet-400/5", textColor: "text-violet-400" },
  negotiation: { label: "Negotiation", color: "#fbbf24", bg: "border-amber-400/20 bg-amber-400/5", textColor: "text-amber-400" },
  won: { label: "Won ✓", color: "#22c55e", bg: "border-success/20 bg-success/5", textColor: "text-success" },
  lost: { label: "Lost", color: "#ef4444", bg: "border-destructive/20 bg-destructive/5", textColor: "text-destructive" },
};

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  deals,
  onStageChange,
  onDelete,
  loading,
}: {
  stage: DealStage;
  deals: any[];
  onStageChange: (id: string, stage: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const m = STAGE_META[stage];
  const stageValue = deals.reduce((s, d) => s + Number(d.value || 0), 0);

  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-3 min-w-[200px] flex-1 ${m.bg}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold uppercase tracking-wide ${m.textColor}`}>
          {m.label}
        </span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${m.textColor}`}
          style={{ background: m.color + "20" }}
        >
          {deals.length}
        </span>
      </div>
      {stageValue > 0 && (
        <p className="text-muted-foreground text-[10px] -mt-1 mb-1">
          ${stageValue.toLocaleString()}
        </p>
      )}
      <div className="flex flex-col gap-2 flex-1 min-h-[120px]">
        {deals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/20 py-6 text-center text-muted-foreground/40 text-xs">
            Empty
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              className="group rounded-lg border border-border bg-card p-3 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-1">
                <p className="font-medium text-foreground text-sm leading-tight flex-1">{deal.name}</p>
                <button
                  type="button"
                  onClick={() => onDelete(deal.id)}
                  disabled={loading}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className={`font-bold text-sm ${m.textColor}`}>
                ${Number(deal.value || 0).toLocaleString()}
              </p>
              {deal.notes && (
                <p className="text-muted-foreground text-[10px] line-clamp-2">{deal.notes}</p>
              )}
              <select
                className="w-full h-6 rounded border border-border bg-transparent text-[10px] px-1"
                value={deal.stage}
                onChange={(e) => onStageChange(deal.id, e.target.value)}
                disabled={loading}
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_META[s].label}</option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CrmPipelinePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    stage: "lead" as DealStage,
    notes: "",
  });

  const queryClient = useQueryClient();

  // ─── Query ─────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["crm-deals-pipeline"],
    queryFn: () => dealsApi.list({ page: 1, limit: 200 }),
  });

  const deals = (data?.data as any[]) ?? [];

  // Group by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, any[]> = {
      lead: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [],
    };
    deals.forEach((d: any) => {
      const stage = d.stage as DealStage;
      if (grouped[stage]) grouped[stage].push(d);
    });
    return grouped;
  }, [deals]);

  const totalPipeline = deals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
  const wonValue = deals.filter((d: any) => d.stage === "won").reduce((s: number, d: any) => s + Number(d.value || 0), 0);
  const winRate = deals.length > 0
    ? Math.round((deals.filter((d: any) => d.stage === "won").length / deals.length) * 100)
    : 0;

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createDeal = useMutation({
    mutationFn: () => {
      const value = Number(newDeal.value);
      if (!newDeal.name.trim()) throw new Error("Deal name is required");
      if (!Number.isFinite(value) || value <= 0) throw new Error("Value must be positive");
      return dealsApi.create({
        name: newDeal.name.trim(),
        value,
        stage: newDeal.stage,
        notes: newDeal.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Deal created");
      queryClient.invalidateQueries({ queryKey: ["crm-deals-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      setIsCreateOpen(false);
      setNewDeal({ name: "", value: "", stage: "lead", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create deal"),
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      dealsApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Stage updated");
    },
    onError: () => toast.error("Failed to update stage"),
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Deal deleted");
    },
    onError: () => toast.error("Failed to delete deal"),
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Pipeline</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm">
            Track deals through every stage of your pipeline.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Deal
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Pipeline", value: `$${totalPipeline.toLocaleString()}`, icon: <Target className="h-4 w-4" /> },
          { label: "Won Revenue", value: `$${wonValue.toLocaleString()}`, icon: <DollarSign className="h-4 w-4 text-success" /> },
          { label: "Win Rate", value: `${winRate}%`, icon: <GripVertical className="h-4 w-4 text-primary" /> },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                <p className="font-black text-2xl text-foreground">{s.value}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground">{s.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <Loading text="Loading pipeline..." />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {DEAL_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={dealsByStage[stage]}
              onStageChange={(id, newStage) => updateStage.mutate({ id, stage: newStage })}
              onDelete={(id) => deleteDeal.mutate(id)}
              loading={updateStage.isPending || deleteDeal.isPending}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Deal"
        onSubmit={() => createDeal.mutate()}
        isSubmitting={createDeal.isPending}
        submitLabel="Create Deal"
      >
        <FormField label="Deal Name *">
          <Input
            placeholder="Enterprise License"
            value={newDeal.name}
            onChange={(e) => setNewDeal((p) => ({ ...p, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Value ($) *">
          <Input
            type="number"
            placeholder="10000"
            value={newDeal.value}
            onChange={(e) => setNewDeal((p) => ({ ...p, value: e.target.value }))}
          />
        </FormField>
        <FormField label="Stage">
          <select
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={newDeal.stage}
            onChange={(e) => setNewDeal((p) => ({ ...p, stage: e.target.value as DealStage }))}
          >
            {DEAL_STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_META[s].label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes">
          <Textarea
            placeholder="Any notes about this deal..."
            value={newDeal.notes}
            onChange={(e) => setNewDeal((p) => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
