/**
 * Marketing Automation
 *
 * Workflow automation list with trigger, steps, enrolled contacts,
 * active/inactive toggle, and last-run timestamp.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  CheckCircle2,
  Cpu,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { marketingApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/marketing/automation/_index")({
  validateSearch: searchSchema,
  component: AutomationPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  stepsCount: number;
  enrolledContacts: number;
  active: boolean;
  lastRun?: string;
  conversions?: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_WORKFLOWS: Workflow[] = [
  { id: "1", name: "Welcome Series", trigger: "Contact created", stepsCount: 5, enrolledContacts: 1840, active: true, lastRun: "2026-03-24T08:00:00Z", conversions: 320 },
  { id: "2", name: "Abandoned Cart Recovery", trigger: "Cart abandoned", stepsCount: 3, enrolledContacts: 542, active: true, lastRun: "2026-03-24T09:30:00Z", conversions: 188 },
  { id: "3", name: "Re-engagement Campaign", trigger: "90 days inactive", stepsCount: 4, enrolledContacts: 2110, active: false, lastRun: "2026-03-20T14:00:00Z", conversions: 95 },
  { id: "4", name: "Lead Nurture – Trial Users", trigger: "Trial started", stepsCount: 7, enrolledContacts: 320, active: true, lastRun: "2026-03-23T17:00:00Z", conversions: 74 },
  { id: "5", name: "Post-Purchase Follow-Up", trigger: "Purchase completed", stepsCount: 2, enrolledContacts: 4500, active: true, lastRun: "2026-03-24T06:15:00Z", conversions: 1100 },
  { id: "6", name: "Birthday Offer", trigger: "Contact birthday", stepsCount: 1, enrolledContacts: 890, active: false, lastRun: "2026-03-18T00:00:00Z", conversions: 210 },
];

// ─── New Workflow Modal ───────────────────────────────────────────────────────

function NewWorkflowModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", trigger: "Contact created" });

  const TRIGGERS = [
    "Contact created",
    "Cart abandoned",
    "Trial started",
    "Purchase completed",
    "Contact birthday",
    "Tag added",
    "Form submitted",
  ];

  const mutation = useMutation({
    mutationFn: async () => {
      // automation.create not in real API — optimistic local creation
      await new Promise((r) => setTimeout(r, 400));
      return { id: String(Date.now()), ...form, stepsCount: 0, enrolledContacts: 0, active: false };
    },
    onSuccess: () => {
      toast.success("Workflow created");
      onCreated();
      onClose();
      setForm({ name: "", trigger: "Contact created" });
    },
    onError: () => toast.error("Failed to create workflow"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New Workflow</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name) { toast.error("Name is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Workflow Name <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Welcome Series"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Trigger</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.trigger}
              onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
            >
              {TRIGGERS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Workflow"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Toggle Mutation ──────────────────────────────────────────────────────────

function useToggleMutation(onSettled: () => void) {
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      // automation.toggle not in real API — simulate
      await new Promise((r) => setTimeout(r, 300));
      return { id, active };
    },
    onSuccess: (_, { active }) => {
      toast.success(`Workflow ${active ? "activated" : "paused"}`);
      onSettled();
    },
    onError: () => toast.error("Failed to update workflow"),
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AutomationPage() {
  const qc = useQueryClient();
  const { q = "", status = "all" } = useSearch({ from: "/app/marketing/automation/_index" });
  const navigate = useNavigate({ from: "/app/marketing/automation" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v }) });
  const [showNew, setShowNew] = useState(false);
  const [page, setPage] = useState(1);
  // Local override for toggles while the API is stubbed
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "automation", page],
    queryFn: async () => {
      // automation.list not in real api.ts — fall through to mock
      return { data: [] };
    },
    retry: false,
  });

  const toggleMutation = useToggleMutation(() => qc.invalidateQueries({ queryKey: ["marketing", "automation"] }));

  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rawWorkflows: Workflow[] = (data as any)?.data ?? [];

  const workflows = rawWorkflows.map((w) => ({
    ...w,
    active: overrides[w.id] !== undefined ? overrides[w.id] : w.active,
  }));

  const filtered = workflows.filter((w) => {
    const matchQ = !q || w.name.toLowerCase().includes(q.toLowerCase());
    const matchStatus = status === "all" || !status || (status === "active" ? w.active : !w.active);
    return matchQ && matchStatus;
  });

  const activeCount = workflows.filter((w) => w.active).length;
  const totalEnrolled = workflows.reduce((s, w) => s + w.enrolledContacts, 0);
  const totalConversions = workflows.reduce((s, w) => s + (w.conversions ?? 0), 0);

  function handleToggle(w: Workflow) {
    const next = !w.active;
    setOverrides((o) => ({ ...o, [w.id]: next }));
    toggleMutation.mutate({ id: w.id, active: next });
  }

  return (
    <div className="space-y-6">
      <NewWorkflowModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ["marketing", "automation"] })}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Cpu className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Workflows</p>
              <p className="text-2xl font-black">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contacts Enrolled</p>
              <p className="text-2xl font-black">{totalEnrolled.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Target className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Conversions</p>
              <p className="text-2xl font-black">{totalConversions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Automation Workflows
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
                {["all", "active", "inactive"].map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 capitalize transition-colors ${(status || "all") === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="h-8 w-44 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search workflows…"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Workflow
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading workflows…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Cpu className="h-8 w-8 opacity-40" />
              <p className="text-sm">No workflows found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((w) => (
                <div key={w.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${w.active ? "bg-emerald-500/10" : "bg-muted/50"}`}>
                      <Zap className={`h-5 w-5 ${w.active ? "text-emerald-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground truncate">Trigger: {w.trigger}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{w.stepsCount}</span> steps
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{w.enrolledContacts.toLocaleString()}</span> enrolled
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{(w.conversions ?? 0).toLocaleString()}</span> conversions
                    </span>
                    {w.lastRun && (
                      <span>Last run: {new Date(w.lastRun).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={w.active ? "success" : "outline"} className={w.active ? "text-emerald-400" : ""}>
                      {w.active ? "Active" : "Inactive"}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleToggle(w)}
                      disabled={toggleMutation.isPending}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${w.active ? "bg-emerald-500" : "bg-muted"}`}
                      aria-label={w.active ? "Deactivate workflow" : "Activate workflow"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${w.active ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
