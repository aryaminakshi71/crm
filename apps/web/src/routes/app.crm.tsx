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
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  History,
  Mail,
  Phone,
  PieChart as PieChartIcon,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  activitiesApi,
  aiApi,
  contactsApi,
  dealsApi,
  leadsApi,
} from "../lib/api";

import { CsvImportModal } from "../components/CsvImportModal";

// ─── Route ─────────────────────────────────────────────────────────────────

const crmSearchSchema = z.object({
  view: z
    .enum(["overview", "contacts", "leads", "deals", "activities"])
    .optional(),
});

export const Route = createFileRoute("/app/crm")({
  validateSearch: crmSearchSchema,
  component: CrmWorkspacePage,
});

type CrmView = "overview" | "contacts" | "leads" | "deals" | "activities";

const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
type DealStage = (typeof DEAL_STAGES)[number];

const STAGE_META: Record<
  DealStage,
  { label: string; color: string; bg: string; textColor: string }
> = {
  lead: {
    label: "Lead",
    color: "#94a3b8",
    bg: "border-slate-400/20 bg-slate-400/5",
    textColor: "text-slate-400",
  },
  qualified: {
    label: "Qualified",
    color: "#38bdf8",
    bg: "border-sky-400/20 bg-sky-400/5",
    textColor: "text-sky-400",
  },
  proposal: {
    label: "Proposal",
    color: "#a78bfa",
    bg: "border-violet-400/20 bg-violet-400/5",
    textColor: "text-violet-400",
  },
  negotiation: {
    label: "Negotiation",
    color: "#fbbf24",
    bg: "border-amber-400/20 bg-amber-400/5",
    textColor: "text-amber-400",
  },
  won: {
    label: "Won ✓",
    color: "#22c55e",
    bg: "border-success/20 bg-success/5",
    textColor: "text-success",
  },
  lost: {
    label: "Lost",
    color: "#ef4444",
    bg: "border-destructive/20 bg-destructive/5",
    textColor: "text-destructive",
  },
};

const LEAD_STATUS_META: Record<string, { bg: string; textColor: string }> = {
  new: { bg: "bg-sky-400/15", textColor: "text-sky-400" },
  contacted: { bg: "bg-amber-400/15", textColor: "text-amber-400" },
  qualified: { bg: "bg-violet-400/15", textColor: "text-violet-400" },
  converted: { bg: "bg-success/15", textColor: "text-success" },
  lost: { bg: "bg-destructive/15", textColor: "text-destructive" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(first = "", last = "") {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

function avatarColor(str: string) {
  const colors = [
    "#22d3ee",
    "#a78bfa",
    "#f472b6",
    "#34d399",
    "#fbbf24",
    "#60a5fa",
    "#fb923c",
    "#a3e635",
  ];
  const h = str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[h % colors.length];
}

function Avatar({
  firstName = "",
  lastName = "",
  size = 36,
}: { firstName?: string; lastName?: string; size?: number }) {
  const bg = avatarColor(`${firstName}${lastName}`);
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.36,
      }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border px-2 py-0.5"
      style={{ borderColor: color + "40", background: color + "15" }}
    >
      <Star className="h-3 w-3" style={{ color }} />
      <span className="font-bold text-xs" style={{ color }}>
        {score}/100
      </span>
    </div>
  );
}

// ─── Mini pipeline funnel bars ────────────────────────────────────────────────

function FunnelChart({ deals }: { deals: any[] }) {
  const counts = DEAL_STAGES.map((stage) => ({
    stage,
    count: deals.filter((d) => d.stage === stage).length,
    value: deals
      .filter((d) => d.stage === stage)
      .reduce((s, d) => s + Number(d.value || 0), 0),
  }));
  const maxCount = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="space-y-2">
      {counts.map((c) => {
        const m = STAGE_META[c.stage];
        const pct = (c.count / maxCount) * 100;
        return (
          <div key={c.stage} className="flex items-center gap-3">
            <span
              className={`w-20 text-xs font-medium ${m.textColor} text-right`}
            >
              {m.label}
            </span>
            <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden">
              <div
                className="h-full rounded-md flex items-center px-2 transition-all duration-700"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: m.color + "30",
                  borderLeft: `3px solid ${m.color}`,
                }}
              >
                {c.count > 0 && (
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: m.color }}
                  >
                    {c.count}
                  </span>
                )}
              </div>
            </div>
            <span className="text-muted-foreground text-xs w-16 text-right">
              ${c.value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Deal Kanban column ───────────────────────────────────────────────────────

function DealKanbanColumn({
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
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 min-w-[180px] ${m.bg}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-bold uppercase tracking-wide ${m.textColor}`}
        >
          {m.label}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${m.textColor}`}
            style={{ background: m.color + "20" }}
          >
            {deals.length}
          </span>
        </div>
      </div>
      {stageValue > 0 && (
        <p className="text-muted-foreground text-[10px] -mt-1 mb-1">
          ${stageValue.toLocaleString()}
        </p>
      )}
      <div className="flex flex-col gap-2 flex-1">
        {deals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/20 py-4 text-center text-muted-foreground/40 text-xs">
            Empty
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              className="group rounded-lg border border-border bg-card p-3 space-y-2 hover:border-primary/40 transition-colors"
            >
              <p className="font-medium text-foreground text-sm leading-tight">
                {deal.name}
              </p>
              <p className={`font-bold text-sm ${m.textColor}`}>
                ${Number(deal.value || 0).toLocaleString()}
              </p>
              {deal.notes && (
                <p className="text-muted-foreground text-[10px] line-clamp-2">
                  {deal.notes}
                </p>
              )}
              <div className="flex items-center gap-1 pt-1">
                <select
                  className="flex-1 h-6 rounded border border-border bg-transparent text-[10px] px-1"
                  value={deal.stage}
                  onChange={(e) => onStageChange(deal.id, e.target.value)}
                  disabled={loading}
                >
                  {DEAL_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s].label}
                    </option>
                  ))}
                </select>
                {deal.probability > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground/60">
                    {deal.probability}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(deal.id)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function CrmWorkspacePage() {
  const { view: viewParam } = Route.useSearch();
  const navigate = useNavigate();
  const view: CrmView = viewParam ?? "overview";
  const [search, setSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [dealStageFilter, setDealStageFilter] = useState("all");

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [editContactCompany, setEditContactCompany] = useState("");

  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    jobTitle: "",
    notes: "",
  });
  const [newLead, setNewLead] = useState({
    email: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    source: "website",
    notes: "",
    jobTitle: "",
  });
  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    stage: "lead",
    notes: "",
    probability: "50",
    expectedCloseDate: "",
  });

  const [leadScores, setLeadScores] = useState<
    Record<string, { score: number; reasoning: string }>
  >({});

  const queryClient = useQueryClient();

  const [importType, setImportType] = useState<"leads" | "contacts" | "deals">(
    "contacts",
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [profileViewId, setProfileViewId] = useState<string | null>(null);
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");

  const setView = (nextView: CrmView) => {
    navigate({
      to: "/app/crm",
      search: nextView === "overview" ? {} : { view: nextView },
    });
  };

  const onCsvImport = async (data: any) => {
    if (importType === "leads") {
      await leadsApi.create(data);
    } else if (importType === "deals") {
      await dealsApi.create({
        name: data.name,
        value: Number(data.value || 0),
        stage: data.stage || "lead",
        notes: data.notes,
        probability: Number(data.probability || 50),
      });
    } else {
      await contactsApi.create({
        firstName: data.firstName || "Imported",
        lastName: data.lastName || "Contact",
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        notes: data.notes,
      });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] }),
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] }),
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] }),
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-stats"] }),
    ]);
  };

  const { data: contactsData, isLoading: isContactsLoading } = useQuery({
    queryKey: ["crm-contacts", search],
    queryFn: () => contactsApi.list({ page: 1, limit: 200, search }),
  });
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ["crm-leads", search, leadStatusFilter],
    queryFn: () =>
      leadsApi.list({
        page: 1,
        limit: 200,
        search,
        status: leadStatusFilter !== "all" ? leadStatusFilter : undefined,
      }),
  });
  const { data: dealsData, isLoading: isDealsLoading } = useQuery({
    queryKey: ["crm-deals", search, dealStageFilter],
    queryFn: () =>
      dealsApi.list({
        search,
        stage: dealStageFilter !== "all" ? dealStageFilter : undefined,
      }),
  });
  const { data: activitiesData, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["crm-activities", view, search],
    queryFn: () => activitiesApi.list({ limit: 100 }),
  });

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    subject: "",
    type: "note",
    description: "",
    contactId: "",
    dealId: "",
  });

  const createActivity = useMutation({
    mutationFn: (data: any) => activitiesApi.create(data),
    onSuccess: () => {
      toast.success("Activity logged");
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      setIsActivityModalOpen(false);
      setNewActivity({
        subject: "",
        type: "note",
        description: "",
        contactId: "",
        dealId: "",
      });
    },
    onError: () => toast.error("Failed to log activity"),
  });

  const createContact = useMutation({
    mutationFn: () => {
      if (!newContact.firstName.trim() || !newContact.lastName.trim())
        throw new Error("First and last name are required");
      return contactsApi.create({
        firstName: newContact.firstName.trim(),
        lastName: newContact.lastName.trim(),
        email: newContact.email.trim() || undefined,
        phone: newContact.phone.trim() || undefined,
        companyName: newContact.companyName.trim() || undefined,
        jobTitle: newContact.jobTitle.trim() || undefined,
        notes: newContact.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Contact created");
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      setIsContactModalOpen(false);
      setNewContact({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
        jobTitle: "",
        notes: "",
      });
    },

    onError: (e: Error) => toast.error(e.message || "Failed to create contact"),
  });

  const updateContact = useMutation({
    mutationFn: ({ id, companyName }: { id: string; companyName: string }) =>
      contactsApi.update(id, { companyName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact updated");
      setEditContactId(null);
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact deleted");
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  const createLead = useMutation({
    mutationFn: () => {
      if (!newLead.email.trim()) throw new Error("Lead email is required");
      return leadsApi.create({
        email: newLead.email.trim(),
        firstName: newLead.firstName.trim() || undefined,
        lastName: newLead.lastName.trim() || undefined,
        companyName: newLead.companyName.trim() || undefined,
        phone: newLead.phone.trim() || undefined,
        source: newLead.source,
        notes: newLead.notes.trim() || undefined,
        jobTitle: newLead.jobTitle.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Lead created");
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      setIsLeadModalOpen(false);
      setNewLead({
        email: "",
        firstName: "",
        lastName: "",
        companyName: "",
        phone: "",
        source: "website",
        notes: "",
        jobTitle: "",
      });
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

  const deleteLead = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  const convertLead = useMutation({
    mutationFn: (leadId: string) => leadsApi.convert(leadId, {}),
    onSuccess: () => {
      toast.success("Lead converted to contact ✓");
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to convert lead"),
  });

  const scoreLead = useMutation({
    mutationFn: (lead: any) =>
      aiApi.scoreLead({
        email: lead.email,
        companyName: lead.companyName,
        notes: lead.notes,
      }),
    onSuccess: (result, lead) => {
      if (!result.result) {
        toast.error("Lead score unavailable");
        return;
      }
      setLeadScores((prev) => ({ ...prev, [lead.id]: result.result! }));
      toast.success(`Lead scored: ${result.result.score}/100`);
    },
    onError: () => toast.error("Failed to score lead"),
  });

  const createDeal = useMutation({
    mutationFn: () => {
      const value = Number(newDeal.value);
      if (!newDeal.name.trim()) throw new Error("Deal name is required");
      if (!Number.isFinite(value) || value <= 0)
        throw new Error("Deal value must be a positive number");
      return dealsApi.create({
        name: newDeal.name.trim(),
        value,
        stage: newDeal.stage,
        notes: newDeal.notes.trim() || undefined,
        probability: Number(newDeal.probability),
        expectedCloseDate: newDeal.expectedCloseDate || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Deal created");
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      setIsDealModalOpen(false);
      setNewDeal({
        name: "",
        value: "",
        stage: "lead",
        notes: "",
        probability: "50",
        expectedCloseDate: "",
      });
    },

    onError: (e: Error) => toast.error(e.message || "Failed to create deal"),
  });

  const updateDealStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      dealsApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Stage updated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update stage"),
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      toast.success("Deal deleted");
    },
    onError: () => toast.error("Failed to delete deal"),
  });

  const contacts = (contactsData?.data as any[]) || [];
  const leads = (leadsData?.data as any[]) || [];
  const deals = (dealsData?.data as any[]) || [];

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c: any) =>
      [c.firstName, c.lastName, c.email, c.companyName].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [contacts, search]);

  const filteredLeads = useMemo(() => {
    const base = leads.filter(
      (l: any) => leadStatusFilter === "all" || l.status === leadStatusFilter,
    );
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((l: any) =>
      [l.email, l.firstName, l.lastName, l.companyName].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [leads, search, leadStatusFilter]);

  const filteredDeals = useMemo(() => {
    const base = deals.filter(
      (d: any) => dealStageFilter === "all" || d.stage === dealStageFilter,
    );
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((d: any) =>
      [d.name, d.notes, d.stage].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [deals, search, dealStageFilter]);

  const totalPipeline = deals.reduce(
    (s: number, d: any) => s + Number(d.value || 0),
    0,
  );
  const wonPipeline = deals
    .filter((d: any) => d.stage === "won")
    .reduce((s: number, d: any) => s + Number(d.value || 0), 0);
  const newLeads = leads.filter((l: any) => l.status === "new").length;
  const qualifiedLeads = leads.filter(
    (l: any) => l.status === "qualified",
  ).length;
  const convertedLeads = leads.filter(
    (l: any) => l.status === "converted",
  ).length;
  const winRate =
    deals.length > 0
      ? Math.round(
          (deals.filter((d: any) => d.stage === "won").length / deals.length) *
            100,
        )
      : 0;

  if (isContactsLoading || isLeadsLoading || isDealsLoading)
    return <Loading text="Loading CRM workspace..." />;

  const VIEW_TABS = [
    { id: "overview" as CrmView, label: "Overview", icon: BarChart3 },
    {
      id: "contacts" as CrmView,
      label: `Contacts (${contacts.length})`,
      icon: Users,
    },
    { id: "leads" as CrmView, label: `Leads (${leads.length})`, icon: Mail },
    { id: "deals" as CrmView, label: `Deals (${deals.length})`, icon: Target },
    { id: "activities" as CrmView, label: "Timeline", icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">CRM Workspace</h1>
          <p className="text-muted-foreground text-sm">
            Manage contacts, qualify leads, and close deals with AI assistance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setView("overview")}
          >
            Overview
          </Button>
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => {
              setImportType(
                view === "leads"
                  ? "leads"
                  : view === "deals"
                    ? "deals"
                    : "contacts",
              );
              setIsImportModalOpen(true);
            }}
          >
            Import CSV
          </Button>
          {view === "activities" && (
            <Button
              variant="primary"
              leftIcon={<Zap className="h-4 w-4" />}
              onClick={() => setIsActivityModalOpen(true)}
            >
              Log Activity
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => {
              setIsContactModalOpen(true);
            }}
          >
            Add Contact
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={() => setIsLeadModalOpen(true)}
          >
            Add Lead
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Target className="h-3.5 w-3.5" />}
            onClick={() => setIsDealModalOpen(true)}
          >
            New Deal
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric
          title="Total Contacts"
          value={contacts.length}
          icon={<Users className="h-4 w-4" />}
          trend="+5 new"
          color="text-primary"
        />
        <Metric
          title="Active Leads"
          value={newLeads}
          icon={<UserPlus className="h-4 w-4" />}
          trend="High growth"
          color="text-sky-400"
        />
        <Metric
          title="Qualified"
          value={qualifiedLeads}
          icon={<Star className="h-4 w-4" />}
          trend="Top tier"
          color="text-violet-400"
        />
        <Metric
          title="Converted"
          value={convertedLeads}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend="82% rate"
          color="text-success"
        />
        <Metric
          title="Open Deals"
          value={
            deals.filter((d: any) => !["won", "lost"].includes(d.stage)).length
          }
          icon={<Target className="h-4 w-4" />}
          trend="Closing soon"
          color="text-amber-400"
        />
        <Metric
          title="Pipeline"
          value={`$${(totalPipeline / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-4 w-4" />}
          trend="Exceeding target"
          color="text-emerald-400"
        />
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit overflow-x-auto">
        {VIEW_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
          />
        </div>
        {view === "leads" && (
          <select
            value={leadStatusFilter}
            onChange={(e) => setLeadStatusFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        )}
        {view === "deals" && (
          <select
            value={dealStageFilter}
            onChange={(e) => setDealStageFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All stages</option>
            {DEAL_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ─── Overview ─── */}
      {view === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Pipeline Velocity
                </CardTitle>
                <p className="text-2xl font-black text-foreground">
                  Revenue Flow
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: "Jan", value: 12000, target: 10000 },
                      { month: "Feb", value: 18000, target: 15000 },
                      { month: "Mar", value: 24000, target: 20000 },
                      { month: "Apr", value: 38000, target: 30000 },
                      { month: "May", value: 45000, target: 35000 },
                    ]}
                  >
                    <defs>
                      <linearGradient
                        id="colorPipeline"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22d3ee"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22d3ee"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      stroke="#888"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      stroke="#888"
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "11px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#22d3ee"
                      fillOpacity={1}
                      fill="url(#colorPipeline)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#888"
                      fillOpacity={0}
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-border/40 pt-6 mt-6">
                <div className="text-center space-y-1">
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    Total Pipeline
                  </p>
                  <p className="font-black text-2xl text-primary">
                    ${totalPipeline.toLocaleString()}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    Won Revenue
                  </p>
                  <p className="font-black text-2xl text-success">
                    ${wonPipeline.toLocaleString()}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    Win Rate
                  </p>
                  <p className="font-black text-2xl text-amber-400">
                    {winRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Deal Distribution
                </CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground/40" />
              </CardHeader>
              <CardContent>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            stage: "Qualified",
                            val:
                              deals.filter((d) => d.stage === "qualified")
                                .length || 5,
                            color: "#38bdf8",
                          },
                          {
                            stage: "Proposal",
                            val:
                              deals.filter((d) => d.stage === "proposal")
                                .length || 8,
                            color: "#a78bfa",
                          },
                          {
                            stage: "Won",
                            val:
                              deals.filter((d) => d.stage === "won").length ||
                              12,
                            color: "#22c55e",
                          },
                          { stage: "Other", val: 4, color: "#f472b6" },
                        ]}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="val"
                      >
                        {[
                          { stage: "Qualified", color: "#38bdf8" },
                          { stage: "Proposal", color: "#a78bfa" },
                          { stage: "Won", color: "#22c55e" },
                          { stage: "Other", color: "#f472b6" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "none",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Recent Activity
                </CardTitle>
                <Clock className="h-4 w-4 text-primary/40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {activitiesData?.data && activitiesData.data.length > 0 ? (
                  activitiesData.data.slice(0, 3).map((act: any) => (
                    <div key={act.id} className="flex gap-3 text-[10px]">
                      <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary h-fit">
                        <Zap className="h-2.5 w-2.5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-tight">
                          {act.subject}
                        </p>
                        <p className="text-muted-foreground mt-0.5">
                          {new Date(act.createdAt).toLocaleDateString()} —{" "}
                          {act.type}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-[10px] italic">
                    No recent activities recorded.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Quick Actions
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Pipeline",
                    icon: ArrowRight,
                    action: () => setView("deals"),
                  },
                  {
                    label: "Contacts",
                    icon: Users,
                    action: () => setView("contacts"),
                  },
                  {
                    label: "Leads",
                    icon: Mail,
                    action: () => setView("leads"),
                  },
                  {
                    label: "AI Scan",
                    icon: Sparkles,
                    action: () => toast.info("AI Analysis started..."),
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 p-3 text-[10px] font-bold text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Contacts ─── */}
      {view === "contacts" &&
        (filteredContacts.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No contacts found"
            description="Add your first contact to start building your network."
            action={
              <Button onClick={() => setIsContactModalOpen(true)}>
                Add Contact
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact: any) => (
              <Card
                key={contact.id}
                className="group hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      firstName={contact.firstName}
                      lastName={contact.lastName}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.companyName && (
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {contact.companyName}
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-muted-foreground text-xs flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <Badge variant="outline" className="text-[10px]">
                      Contact
                    </Badge>
                    <div className="flex-1" />
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => setProfileViewId(contact.id)}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => {
                        setEditContactId(contact.id);
                        setEditContactCompany(contact.companyName || "");
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-7 px-2 text-[10px] text-destructive"
                      onClick={() => deleteContact.mutate(contact.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {/* ─── Leads ─── */}
      {view === "leads" &&
        (filteredLeads.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-12 w-12" />}
            title="No leads found"
            description="Capture leads from campaigns, forms, or outbound channels."
            action={
              <Button onClick={() => setIsLeadModalOpen(true)}>Add Lead</Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredLeads.map((lead: any) => {
              const sm = LEAD_STATUS_META[lead.status] || LEAD_STATUS_META.new;
              const score = leadScores[lead.id];
              return (
                <Card
                  key={lead.id}
                  className="group hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar
                        firstName={lead.firstName}
                        lastName={lead.lastName || lead.email}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground truncate">
                            {lead.firstName || "-"} {lead.lastName || ""}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sm.bg} ${sm.textColor}`}
                          >
                            {lead.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {lead.email}
                        </p>
                        {lead.companyName && (
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {lead.companyName}
                          </p>
                        )}
                        {lead.source && (
                          <p className="text-muted-foreground text-[10px]">
                            Source: {lead.source}
                          </p>
                        )}
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="text-muted-foreground text-xs bg-muted/40 rounded-lg px-3 py-2 line-clamp-2">
                        {lead.notes}
                      </p>
                    )}

                    {score && (
                      <div className="rounded-lg border border-border bg-muted/30 p-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <ScoreBadge score={score.score} />
                          <p className="text-muted-foreground text-[10px] leading-tight line-clamp-2">
                            {score.reasoning}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
                      <select
                        className="h-7 rounded-md border border-border bg-card px-2 text-xs flex-1 min-w-0"
                        value={lead.status || "new"}
                        onChange={(e) =>
                          updateLeadStatus.mutate({
                            id: lead.id,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="new">new</option>
                        <option value="contacted">contacted</option>
                        <option value="qualified">qualified</option>
                        <option value="converted">converted</option>
                        <option value="lost">lost</option>
                      </select>
                      <button
                        type="button"
                        title="AI Score"
                        onClick={() => scoreLead.mutate(lead)}
                        className="flex items-center gap-1 rounded-md border border-border bg-card px-2 h-7 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" /> Score
                      </button>
                      <button
                        type="button"
                        title="Convert to Contact"
                        onClick={() => convertLead.mutate(lead.id)}
                        className="flex items-center gap-1 rounded-md border border-border bg-card px-2 h-7 text-xs text-muted-foreground hover:text-success hover:border-success/40 transition-colors"
                      >
                        <ArrowRightLeft className="h-3 w-3" /> Convert
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLead.mutate(lead.id)}
                        className="flex items-center h-7 px-2 rounded-md text-muted-foreground/40 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}

      {/* ─── Deals (Kanban) ─── */}
      {view === "deals" && (
        <div className="space-y-3">
          {/* Pipeline total bar */}
          {deals.length > 0 && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
                {DEAL_STAGES.map((s) => {
                  const stageDeals = deals.filter((d: any) => d.stage === s);
                  const stageVal = stageDeals.reduce(
                    (sum: number, d: any) => sum + Number(d.value || 0),
                    0,
                  );
                  const pct =
                    totalPipeline > 0 ? (stageVal / totalPipeline) * 100 : 0;
                  return (
                    <div
                      key={s}
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: STAGE_META[s].color,
                      }}
                      title={`${STAGE_META[s].label}: $${stageVal.toLocaleString()}`}
                    />
                  );
                })}
              </div>
              <p className="text-foreground text-sm font-semibold shrink-0">
                Total:{" "}
                <span className="text-primary">
                  ${totalPipeline.toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {deals.length === 0 ? (
            <EmptyState
              icon={<Target className="h-12 w-12" />}
              title="No deals found"
              description="Build a forecastable pipeline from qualified opportunities."
              action={
                <Button onClick={() => setIsDealModalOpen(true)}>
                  Add Deal
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {(DEAL_STAGES as readonly DealStage[]).map((stage) => (
                  <DealKanbanColumn
                    key={stage}
                    stage={stage}
                    deals={filteredDeals.filter((d: any) => d.stage === stage)}
                    onStageChange={(id, s) =>
                      updateDealStage.mutate({ id, stage: s })
                    }
                    onDelete={(id) => deleteDeal.mutate(id)}
                    loading={updateDealStage.isPending || deleteDeal.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Activities ─── */}
      {view === "activities" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Activity Timeline
              </CardTitle>
              <select
                className="h-8 rounded-md border border-border bg-card px-2 text-xs"
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
              >
                <option value="all">All types</option>
                <option value="note">Notes</option>
                <option value="call">Calls</option>
                <option value="meeting">Meetings</option>
                <option value="email">Emails</option>
                <option value="task">Tasks</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {(() => {
              const filteredActs = (activitiesData?.data || []).filter(
                (a: any) =>
                  activityTypeFilter === "all" || a.type === activityTypeFilter,
              );
              if (filteredActs.length === 0)
                return (
                  <EmptyState
                    icon={<History className="h-12 w-12" />}
                    title="No activities"
                    description="Your timeline will populate as you interact with contacts and deals."
                  />
                );
              return (
                <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-muted">
                  {filteredActs.map((act: any) => (
                    <div key={act.id} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-card" />
                      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{act.type}</Badge>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground text-sm">
                          {act.subject}
                        </p>
                        {act.description && (
                          <p className="text-muted-foreground text-xs whitespace-pre-wrap">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* ─── Modals ─── */}

      {/* Add Contact */}
      <FormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Contact"
        submitText="Create Contact"
        loading={createContact.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createContact.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <Input
              value={newContact.firstName}
              onChange={(e) =>
                setNewContact((p) => ({ ...p, firstName: e.target.value }))
              }
              placeholder="Jane"
            />
          </FormField>
          <FormField label="Last Name" required>
            <Input
              value={newContact.lastName}
              onChange={(e) =>
                setNewContact((p) => ({ ...p, lastName: e.target.value }))
              }
              placeholder="Smith"
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={newContact.email}
              onChange={(e) =>
                setNewContact((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="jane@acme.com"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newContact.phone}
              onChange={(e) =>
                setNewContact((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="+1 555 0100"
            />
          </FormField>
          <FormField label="Job Title" className="col-span-2">
            <Input
              value={newContact.jobTitle}
              onChange={(e) =>
                setNewContact((p) => ({ ...p, jobTitle: e.target.value }))
              }
              placeholder="CEO"
            />
          </FormField>
          <FormField label="Company" className="col-span-2">
            <Input
              value={newContact.companyName}
              onChange={(e) =>
                setNewContact((p) => ({ ...p, companyName: e.target.value }))
              }
              placeholder="Acme Corp"
            />
          </FormField>
          <FormField label="Notes" className="col-span-2">
            <Textarea
              value={newContact.notes}
              onChange={(e) =>
                setNewContact((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Key details..."
            />
          </FormField>
        </div>
      </FormModal>

      {/* Edit Contact company */}
      <FormModal
        isOpen={!!editContactId}
        onClose={() => setEditContactId(null)}
        title="Edit Contact"
        submitText="Save"
        onSubmit={(e) => {
          e.preventDefault();
          if (editContactId)
            updateContact.mutate({
              id: editContactId,
              companyName: editContactCompany,
            });
        }}
      >
        <FormField label="Company Name">
          <Input
            value={editContactCompany}
            onChange={(e) => setEditContactCompany(e.target.value)}
            placeholder="Acme Corp"
          />
        </FormField>
      </FormModal>

      {/* Add Lead */}
      <FormModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title="Capture Lead"
        submitText="Create Lead"
        loading={createLead.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createLead.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" required className="col-span-2">
            <Input
              type="email"
              value={newLead.email}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="lead@company.com"
            />
          </FormField>
          <FormField label="First Name">
            <Input
              value={newLead.firstName}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, firstName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              value={newLead.lastName}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, lastName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Job Title" className="col-span-2">
            <Input
              value={newLead.jobTitle}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, jobTitle: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Company">
            <Input
              value={newLead.companyName}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, companyName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newLead.phone}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Source" className="col-span-2">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newLead.source}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, source: e.target.value }))
              }
            >
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="social_media">Social Media</option>
              <option value="event">Event / Conference</option>
              <option value="partner">Partner</option>
            </select>
          </FormField>
          <FormField label="Notes" className="col-span-2">
            <Textarea
              rows={3}
              value={newLead.notes}
              onChange={(e) =>
                setNewLead((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Any qualifying information..."
            />
          </FormField>
        </div>
      </FormModal>

      {/* Add Deal */}
      <FormModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        title="New Deal"
        submitText="Create Deal"
        loading={createDeal.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createDeal.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Deal Name" required className="col-span-2">
            <Input
              value={newDeal.name}
              onChange={(e) =>
                setNewDeal((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Acme Corp — Enterprise License"
            />
          </FormField>
          <FormField label="Value ($)" required>
            <Input
              type="number"
              min="0"
              step="100"
              value={newDeal.value}
              onChange={(e) =>
                setNewDeal((p) => ({ ...p, value: e.target.value }))
              }
              placeholder="25000"
            />
          </FormField>
          <FormField label="Probability (%)">
            <Input
              type="number"
              min="0"
              max="100"
              value={newDeal.probability}
              onChange={(e) =>
                setNewDeal((p) => ({ ...p, probability: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Expected Close">
            <Input
              type="date"
              value={newDeal.expectedCloseDate}
              onChange={(e) =>
                setNewDeal((p) => ({ ...p, expectedCloseDate: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Stage" className="col-span-2">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newDeal.stage}
              onChange={(e) =>
                setNewDeal((p) => ({ ...p, stage: e.target.value }))
              }
            >
              {DEAL_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_META[s].label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" className="col-span-2">
            <Textarea
              rows={3}
              value={newDeal.notes}
              onChange={(e) =>
                setNewDeal((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Key decision maker, timeline, budget confirmed..."
            />
          </FormField>
        </div>
      </FormModal>
      {/* CSV Import */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onCsvImport}
        title={
          importType === "leads"
            ? "Import Leads"
            : importType === "deals"
              ? "Import Deals"
              : "Import Contacts"
        }
        fields={
          importType === "leads"
            ? [
                { key: "firstName", label: "First Name" },
                { key: "lastName", label: "Last Name" },
                { key: "email", label: "Email", required: true },
                { key: "phone", label: "Phone" },
                { key: "companyName", label: "Company" },
                { key: "jobTitle", label: "Job Title" },
                { key: "source", label: "Source" },
                { key: "notes", label: "Notes" },
              ]
            : importType === "deals"
              ? [
                  { key: "name", label: "Deal Name", required: true },
                  { key: "value", label: "Value ($)", required: true },
                  {
                    key: "stage",
                    label:
                      "Stage (lead, qualified, propose, negotiate, won, lost)",
                  },
                  { key: "probability", label: "Probability (%)" },
                  { key: "notes", label: "Notes" },
                ]
              : [
                  { key: "firstName", label: "First Name", required: true },
                  { key: "lastName", label: "Last Name", required: true },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "companyName", label: "Company" },
                  { key: "jobTitle", label: "Job Title" },
                  { key: "notes", label: "Notes" },
                ]
        }
      />

      {/* Log Activity */}
      <FormModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Log Activity"
        submitText="Save Activity"
        loading={createActivity.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          createActivity.mutate(newActivity);
        }}
      >
        <div className="space-y-4">
          <FormField label="Subject" required>
            <Input
              value={newActivity.subject}
              onChange={(e) =>
                setNewActivity((p) => ({ ...p, subject: e.target.value }))
              }
              placeholder="Follow up call"
            />
          </FormField>
          <FormField label="Type">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newActivity.type}
              onChange={(e) =>
                setNewActivity((p) => ({ ...p, type: e.target.value }))
              }
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
              <option value="email">Email</option>
              <option value="task">Task</option>
            </select>
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newActivity.description}
              onChange={(e) =>
                setNewActivity((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="What happened?"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Link Contact">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newActivity.contactId}
                onChange={(e) =>
                  setNewActivity((p) => ({ ...p, contactId: e.target.value }))
                }
              >
                <option value="">None</option>
                {contacts.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Link Deal">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newActivity.dealId}
                onChange={(e) =>
                  setNewActivity((p) => ({ ...p, dealId: e.target.value }))
                }
              >
                <option value="">None</option>
                {deals.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
      </FormModal>
      {/* View Profile */}
      <FormModal
        isOpen={!!profileViewId}
        onClose={() => setProfileViewId(null)}
        title="Contact Profile"
        submitText="Close"
        onSubmit={(e) => {
          e.preventDefault();
          setProfileViewId(null);
        }}
      >
        {profileViewId &&
          (() => {
            const contact = (contactsData?.data || []).find(
              (c: any) => c.id === profileViewId,
            );
            if (!contact) return <p>Contact not found</p>;
            const contactDeals = (dealsData?.data || []).filter(
              (d: any) => d.contactId === contact.id,
            );
            const contactActivities = (activitiesData?.data || []).filter(
              (a: any) => a.contactId === contact.id,
            );

            return (
              <div className="space-y-6">
                <div className="flex items-start gap-4 border-b border-border pb-4">
                  <Avatar
                    firstName={contact.firstName}
                    lastName={contact.lastName}
                    size={56}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground">
                      {contact.firstName} {contact.lastName}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      {contact.jobTitle || "No title"} @{" "}
                      {contact.companyName || "No company"}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="text-xs">
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{contact.email || "—"}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{contact.phone || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Target className="h-3.5 w-3.5" /> Linked Deals (
                      {contactDeals.length})
                    </h3>
                    {contactDeals.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No deals linked.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {contactDeals.map((d: any) => (
                          <div
                            key={d.id}
                            className="rounded-lg border border-border p-2 bg-muted/20"
                          >
                            <p className="text-xs font-semibold truncate">
                              {d.name}
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                ${Number(d.value).toLocaleString()}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0"
                              >
                                {d.stage}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <History className="h-3.5 w-3.5" /> Timeline (
                      {contactActivities.length})
                    </h3>
                    {contactActivities.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No activities logged.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {contactActivities.map((a: any) => (
                          <div
                            key={a.id}
                            className="text-[10px] border-l-2 border-primary pl-2 py-1"
                          >
                            <p className="font-medium text-foreground">
                              {a.subject}
                            </p>
                            <p className="text-muted-foreground">
                              {new Date(a.createdAt).toLocaleDateString()} —{" "}
                              {a.type}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {contact.notes && (
                  <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Notes
                    </p>
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {contact.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
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
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Users className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
