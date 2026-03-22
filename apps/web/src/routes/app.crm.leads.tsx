import {
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { leadsApi } from "../lib/api";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/crm/leads")({
  validateSearch: z.object({
    status: z.string().optional(),
    search: z.string().optional(),
  }),
  component: CrmLeadsPage,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

const STATUS_META: Record<LeadStatus, { label: string; bg: string; textColor: string }> = {
  new: { label: "New", bg: "bg-sky-400/15", textColor: "text-sky-400" },
  contacted: { label: "Contacted", bg: "bg-amber-400/15", textColor: "text-amber-400" },
  qualified: { label: "Qualified", bg: "bg-violet-400/15", textColor: "text-violet-400" },
  converted: { label: "Converted", bg: "bg-success/15", textColor: "text-success" },
  lost: { label: "Lost", bg: "bg-destructive/15", textColor: "text-destructive" },
};

const LEAD_SOURCES = [
  "website",
  "referral",
  "cold_outreach",
  "social_media",
  "event",
  "advertising",
  "other",
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(first = "", last = "") {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

function avatarBg(str: string) {
  const colors = [
    "#22d3ee", "#a78bfa", "#f472b6", "#34d399",
    "#fbbf24", "#60a5fa", "#fb923c", "#a3e635",
  ];
  const h = str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[h % colors.length];
}

function Avatar({ firstName = "", lastName = "", size = 36 }: { firstName?: string; lastName?: string; size?: number }) {
  const bg = avatarBg(`${firstName}${lastName}`);
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CrmLeadsPage() {
  const { status: statusParam, search: searchParam } = Route.useSearch();
  const [search, setSearch] = useState(searchParam ?? "");
  const [statusFilter, setStatusFilter] = useState(statusParam ?? "all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [newLead, setNewLead] = useState({
    email: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    source: "website" as (typeof LEAD_SOURCES)[number],
    notes: "",
  });

  const queryClient = useQueryClient();

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["crm-leads", search, statusFilter],
    queryFn: () =>
      leadsApi.list({
        page: 1,
        limit: 200,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const leads = (data?.data as any[]) ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter((l: any) =>
      [l.email, l.firstName, l.lastName, l.companyName].some((v) =>
        String(v || "").toLowerCase().includes(q),
      ),
    );
  }, [leads, search]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createLead = useMutation({
    mutationFn: () => {
      if (!newLead.email.trim()) throw new Error("Email is required");
      return leadsApi.create({
        email: newLead.email.trim(),
        firstName: newLead.firstName.trim() || undefined,
        lastName: newLead.lastName.trim() || undefined,
        companyName: newLead.companyName.trim() || undefined,
        phone: newLead.phone.trim() || undefined,
        source: newLead.source,
        notes: newLead.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Lead created");
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      setIsCreateOpen(false);
      setNewLead({ email: "", firstName: "", lastName: "", companyName: "", phone: "", source: "website", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create lead"),
  });

  const updateLeadStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead updated");
    },
    onError: () => toast.error("Failed to update lead"),
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      leadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead updated");
      setEditLead(null);
    },
    onError: () => toast.error("Failed to update lead"),
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  const convertLead = useMutation({
    mutationFn: (id: string) => leadsApi.convert(id, {}),
    onSuccess: () => {
      toast.success("Lead converted to contact");
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to convert lead"),
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l: any) => l.status === "new").length,
    qualified: leads.filter((l: any) => l.status === "qualified").length,
    converted: leads.filter((l: any) => l.status === "converted").length,
  }), [leads]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Leads</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm">
            Capture and qualify leads before converting them to contacts.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: <Mail className="h-4 w-4" /> },
          { label: "New", value: stats.new, icon: <Star className="h-4 w-4 text-sky-400" /> },
          { label: "Qualified", value: stats.qualified, icon: <CheckCircle2 className="h-4 w-4 text-violet-400" /> },
          { label: "Converted", value: stats.converted, icon: <ArrowRight className="h-4 w-4 text-success" /> },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {["all", ...LEAD_STATUSES].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : STATUS_META[s as LeadStatus]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <Loading text="Loading leads..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No leads found"
          description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first lead to get started."}
          action={{ label: "New Lead", onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((lead: any) => {
            const statusMeta = STATUS_META[lead.status as LeadStatus] ?? STATUS_META.new;
            return (
              <Card key={lead.id} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar firstName={lead.firstName} lastName={lead.lastName} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">
                          {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.bg} ${statusMeta.textColor}`}>
                          {statusMeta.label}
                        </span>
                        {lead.source && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                            {lead.source.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {lead.email && (
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Mail className="h-3 w-3" />{lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Phone className="h-3 w-3" />{lead.phone}
                          </span>
                        )}
                        {lead.companyName && (
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Building2 className="h-3 w-3" />{lead.companyName}
                          </span>
                        )}
                      </div>
                      {lead.notes && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{lead.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Status change */}
                      <select
                        className="h-7 rounded border border-border bg-transparent text-xs px-1"
                        value={lead.status}
                        onChange={(e) => updateLeadStatus.mutate({ id: lead.id, status: e.target.value })}
                        disabled={updateLeadStatus.isPending}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                      {lead.status !== "converted" && (
                        <button
                          type="button"
                          title="Convert to contact"
                          onClick={() => convertLead.mutate(lead.id)}
                          disabled={convertLead.isPending}
                          className="p-1.5 rounded text-muted-foreground hover:text-success transition-colors"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => deleteLead.mutate(lead.id)}
                        disabled={deleteLead.isPending}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Lead"
        onSubmit={() => createLead.mutate()}
        isSubmitting={createLead.isPending}
        submitLabel="Create Lead"
      >
        <FormField label="Email *">
          <Input
            type="email"
            placeholder="lead@example.com"
            value={newLead.email}
            onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name">
            <Input
              placeholder="Jane"
              value={newLead.firstName}
              onChange={(e) => setNewLead((p) => ({ ...p, firstName: e.target.value }))}
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              placeholder="Smith"
              value={newLead.lastName}
              onChange={(e) => setNewLead((p) => ({ ...p, lastName: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField label="Company">
          <Input
            placeholder="Acme Corp"
            value={newLead.companyName}
            onChange={(e) => setNewLead((p) => ({ ...p, companyName: e.target.value }))}
          />
        </FormField>
        <FormField label="Phone">
          <Input
            placeholder="+1 555 000 0000"
            value={newLead.phone}
            onChange={(e) => setNewLead((p) => ({ ...p, phone: e.target.value }))}
          />
        </FormField>
        <FormField label="Source">
          <select
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={newLead.source}
            onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value as any }))}
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes">
          <Textarea
            placeholder="Any additional context..."
            value={newLead.notes}
            onChange={(e) => setNewLead((p) => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
