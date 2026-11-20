/**
 * Email Builder
 *
 * Email template library with open rate, click rate, preview thumbnails,
 * "New Template" and "Use Template" actions.
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
  Copy,
  ImageOff,
  Mail,
  MousePointerClick,
  Plus,
  Search,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;
import { marketingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/app/marketing/email-builder/_index")({
  validateSearch: searchSchema,
  component: EmailBuilderPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  category?: string;
  updatedAt?: string;
  openRate?: number;
  clickRate?: number;
  usageCount?: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────


// ─── Category Badge Color ─────────────────────────────────────────────────────

function categoryColor(cat?: string) {
  switch (cat) {
    case "Onboarding": return "bg-primary/10 text-primary";
    case "Newsletter": return "bg-violet-500/10 text-violet-400";
    case "Promotional": return "bg-rose-500/10 text-rose-400";
    case "Transactional": return "bg-amber-500/10 text-amber-400";
    case "Retention": return "bg-emerald-500/10 text-emerald-400";
    default: return "bg-muted/50 text-muted-foreground";
  }
}

// ─── Template Preview Thumbnail ───────────────────────────────────────────────

function TemplateThumbnail({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="flex h-24 w-full items-center justify-center rounded-lg bg-muted/40 border border-border/40 relative overflow-hidden">
      {/* Simulated email layout */}
      <div className="absolute inset-2 flex flex-col gap-1 opacity-20">
        <div className="h-2 w-1/2 rounded bg-current mx-auto" />
        <div className="h-1 w-full rounded bg-current" />
        <div className="h-1 w-5/6 rounded bg-current" />
        <div className="h-1 w-4/6 rounded bg-current" />
        <div className="mt-1 h-3 w-1/3 rounded bg-primary mx-auto" />
      </div>
      <span className="relative text-xs font-bold text-muted-foreground/50">{initials}</span>
    </div>
  );
}

// ─── New Template Modal ───────────────────────────────────────────────────────

function NewTemplateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", subject: "", category: "Newsletter" });

  const mutation = useMutation({
    mutationFn: () => marketingApi.templates.create({ name: form.name, subject: form.subject, category: form.category }),
    onSuccess: () => {
      toast.success("Template created");
      onCreated();
      onClose();
      setForm({ name: "", subject: "", category: "Newsletter" });
    },
    onError: () => toast.error("Failed to create template"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">New Email Template</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name) { toast.error("Name is required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Template Name <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Welcome Email"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Subject Line</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Welcome to {{company}}!"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {["Newsletter", "Onboarding", "Promotional", "Transactional", "Retention"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Template"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function EmailBuilderPage() {
  const qc = useQueryClient();
  const { q = "", category = "all" } = useSearch({ from: "/app/marketing/email-builder/_index" });
  const navigate = useNavigate({ from: "/app/marketing/email-builder" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setCategory = (v: string) => navigate({ search: (p) => ({ ...p, category: v === "all" ? undefined : v }) });
  const [showNew, setShowNew] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "templates", page],
    queryFn: () => marketingApi.templates.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const templates: EmailTemplate[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category ?? "Other")))];

  const filtered = templates.filter((t) => {
    const matchSearch = !q || t.name.toLowerCase().includes(q.toLowerCase()) || (t.subject ?? "").toLowerCase().includes(q.toLowerCase());
    const matchCat = (category || "all") === "all" || t.category === category;
    return matchSearch && matchCat;
  });

  const bestTemplate = [...templates].sort((a, b) => (b.openRate ?? 0) - (a.openRate ?? 0))[0];

  return (
    <div className="space-y-6">
      <NewTemplateModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["marketing", "templates"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Templates</p>
              <p className="text-2xl font-black">{templates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 sm:col-span-2">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best Performing</p>
              <p className="text-sm font-bold truncate">{bestTemplate?.name ?? "—"}</p>
              {bestTemplate && (
                <p className="text-xs text-muted-foreground">
                  {bestTemplate.openRate?.toFixed(1)}% open rate · {bestTemplate.clickRate?.toFixed(1)}% CTR
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCategory(c); setPage(1); }}
                className={`px-3 py-1.5 capitalize transition-colors ${(category || "all") === c ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="h-8 w-44 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Search templates…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading templates…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
          <ImageOff className="h-8 w-8 opacity-40" />
          <p className="text-sm">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="border-border/60 hover:border-primary/40 transition-colors group">
              <CardContent className="p-4 space-y-3">
                <TemplateThumbnail name={t.name} />
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-tight">{t.name}</p>
                    {t.category && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColor(t.category)}`}>
                        {t.category}
                      </span>
                    )}
                  </div>
                  {t.subject && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">{t.subject}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="font-medium text-foreground">{(t.openRate ?? 0).toFixed(1)}%</span> open
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    <span className="font-medium text-foreground">{(t.clickRate ?? 0).toFixed(1)}%</span> click
                  </span>
                  {t.updatedAt && (
                    <span className="ml-auto">{new Date(t.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => toast.info(`Editing "${t.name}"`)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="primary" className="flex-1 h-7 text-xs gap-1" onClick={() => toast.success(`Using template "${t.name}"`)}>
                    <Copy className="h-3 w-3" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
