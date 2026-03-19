import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FolderKanban,
  Gauge,
  Headphones,
  History,
  LifeBuoy,
  Mail,
  Megaphone,
  PieChart,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dealsApi, leadsApi, nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

// ─── Mini sparkline (pure SVG, zero deps) ───────────────────────────────────

function Sparkline({
  data,
  color = "#22d3ee",
  fill = "rgba(34,211,238,0.12)",
}: {
  data: number[];
  color?: string;
  fill?: string;
}) {
  if (data.length < 2) return null;
  const w = 80;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as [number, number];
  });
  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <path d={areaPath} fill={fill} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

// ─── Donut ring ──────────────────────────────────────────────────────────────

function DonutRing({
  pct,
  color,
  size = 60,
}: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={7}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={color}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Health bar ──────────────────────────────────────────────────────────────

function HealthBar({
  label,
  value,
  max,
  color,
}: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Fake sparkline seeds (deterministic per label) ─────────────────────────

function seed(label: string): number[] {
  const h = label.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = Math.sin((h + i * 37) * 0.5) * 50 + 50;
    return Math.max(5, Math.round(x));
  });
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

// ─── Onboarding Checklist ────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  {
    id: "invite_team",
    label: "Invite your first team member",
    sub: "Settings → Organization to invite colleagues",
    href: "/app/settings",
    ctaLabel: "Go to Settings",
  },
  {
    id: "add_contact",
    label: "Add your first CRM contact",
    sub: "Import or add customers manually in CRM",
    href: "/app/crm",
    ctaLabel: "Open CRM",
  },
  {
    id: "create_project",
    label: "Create your first project",
    sub: "Track work with tasks, milestones & timelines",
    href: "/app/projects",
    ctaLabel: "Open Projects",
  },
  {
    id: "send_invoice",
    label: "Send your first invoice",
    sub: "Create a professional USD invoice in minutes",
    href: "/app/invoicing",
    ctaLabel: "Open Invoicing",
  },
  {
    id: "setup_billing",
    label: "Choose a plan before trial ends",
    sub: "Lock in your price — 21 days free, no disruption",
    href: "/app/settings",
    ctaLabel: "Choose plan",
  },
];

function OnboardingChecklist() {
  const plan =
    typeof window !== "undefined"
      ? localStorage.getItem("nucleo_plan") || "trial"
      : "trial";
  const [dismissed, setDismissed] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("onboarding_dismissed") === "1"
      : false,
  );
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("onboarding_completed") || "[]");
    } catch {
      return [];
    }
  });

  if (plan !== "trial" || dismissed) return null;

  const allDone = completed.length === ONBOARDING_STEPS.length;
  const pct = Math.round((completed.length / ONBOARDING_STEPS.length) * 100);

  const toggleStep = (id: string) => {
    const next = completed.includes(id)
      ? completed.filter((c) => c !== id)
      : [...completed, id];
    setCompleted(next);
    localStorage.setItem("onboarding_completed", JSON.stringify(next));
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 text-primary" />
          <div>
            <p className="font-semibold text-foreground text-sm">
              {allDone ? "🎉 Setup complete!" : "Get started with Nucleo One"}
            </p>
            <p className="text-muted-foreground text-xs">
              {allDone
                ? "You're all set!"
                : `${completed.length} of ${ONBOARDING_STEPS.length} steps done`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={allDone ? "#22c55e" : "hsl(var(--primary))"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
              strokeDashoffset="21.99"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
            <text
              x="18"
              y="22"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill={allDone ? "#22c55e" : "hsl(var(--primary))"}
            >
              {pct}%
            </text>
          </svg>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("onboarding_dismissed", "1");
              setDismissed(true);
            }}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {ONBOARDING_STEPS.map((step) => {
          const done = completed.includes(step.id);
          return (
            <div key={step.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${done ? "border-success bg-success/20 text-success" : "border-border text-transparent hover:border-primary"}`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                </button>
                <span
                  className={`text-sm leading-tight ${done ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-7">{step.sub}</p>
              <Link
                to={step.href}
                className="ml-7 mt-auto inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                {step.ctaLabel} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Role Selector & Widget System ──────────────────────────────────────────

const ROLES = [
  { id: "all", label: "Executive View", icon: Gauge },
  { id: "sales", label: "Sales Rep", icon: Target },
  { id: "support", label: "Support Agent", icon: Headphones },
  { id: "projects", label: "Project Manager", icon: FolderKanban },
  { id: "finance", label: "Finance", icon: DollarSign },
];

// Sales Rep Widgets
function SalesRepWidgets({ deals, leads, campaigns }: { deals: any[]; leads: any[]; campaigns: any[] }) {
  const pipelineByStage = deals.reduce((acc: Record<string, number>, d: any) => {
    acc[d.stage || "unknown"] = (acc[d.stage || "unknown"] || 0) + (d.value || 0);
    return acc;
  }, {});

  const topDeals = [...deals].sort((a: any, b: any) => (b.value || 0) - (a.value || 0)).slice(0, 5);
  const hotLeads = leads.filter((l: any) => l.score && l.score >= 80).slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Pipeline Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-500" /> My Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(pipelineByStage).slice(0, 4).map(([stage, value]) => (
            <div key={stage} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground capitalize">{stage.replace(/_/g, " ")}</span>
              <span className="font-semibold text-foreground">${((value as number) || 0).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total</span>
              <span className="font-bold text-primary">${Object.values(pipelineByStage).reduce((a, b) => (a as number) + (b as number), 0).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Deals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" /> Top Deals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topDeals.map((d: any, i) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{i + 1}.</span>
                <span className="text-foreground truncate max-w-[120px]">{d.name}</span>
              </div>
              <span className="font-semibold text-success">${(d.value || 0).toLocaleString()}</span>
            </div>
          ))}
          {topDeals.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No deals yet</p>
          )}
        </CardContent>
      </Card>

      {/* Hot Leads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-500" /> Hot Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {hotLeads.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-foreground text-xs font-medium">{l.firstName} {l.lastName}</p>
                <p className="text-muted-foreground text-[10px]">{l.company || l.email}</p>
              </div>
              <Badge variant={l.score >= 90 ? "success" : "warning"} className="text-[10px]">
                {l.score}
              </Badge>
            </div>
          ))}
          {hotLeads.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No hot leads</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Support Agent Widgets
function SupportAgentWidgets({ tickets }: { tickets: any[] }) {
  const openTickets = tickets.filter((t: any) => t.status === "open" || t.status === "pending");
  const myTickets = openTickets.slice(0, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* My Queue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Headphones className="h-4 w-4 text-orange-500" /> My Ticket Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myTickets.map((t: any) => (
            <Link key={t.id} to="/app/helpdesk">
              <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded px-2 -mx-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-xs font-medium truncate">{t.subject}</p>
                  <p className="text-muted-foreground text-[10px]">
                    {t.priority || "Normal"} · {t.status}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground ml-2" />
              </div>
            </Link>
          ))}
          {myTickets.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No open tickets</p>
          )}
        </CardContent>
      </Card>

      {/* SLA Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> SLA Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "At Risk", count: openTickets.filter((t: any) => t.priority === "high" || t.priority === "urgent").length, color: "text-destructive" },
            { label: "Breaching Soon", count: Math.floor(openTickets.length * 0.2), color: "text-warning" },
            { label: "On Track", count: Math.floor(openTickets.length * 0.6), color: "text-success" },
            { label: "Total Open", count: openTickets.length, color: "text-foreground" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className={`font-bold text-sm ${item.color}`}>{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Project Manager Widgets
function ProjectManagerWidgets({ projects }: { projects: any[] }) {
  const activeProjects = projects.filter((p: any) => p.status === "active");
  const atRiskProjects = projects.filter((p: any) => p.status === "active" && (p.progress || 0) < 40);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Active Projects */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-violet-500" /> Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeProjects.slice(0, 4).map((p: any) => (
            <div key={p.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.progress || 0}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>
            </div>
          ))}
          {activeProjects.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No active projects</p>
          )}
        </CardContent>
      </Card>

      {/* At Risk */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> At Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {atRiskProjects.slice(0, 4).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <span className="text-xs text-foreground truncate">{p.name}</span>
              <Badge variant="danger" className="text-[10px]">{p.progress || 0}%</Badge>
            </div>
          ))}
          {atRiskProjects.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">All projects on track</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Finance Widgets
function FinanceWidgets({ invoices }: { invoices: any[] }) {
  const overdue = invoices.filter((i: any) => i.status === "overdue");
  const pending = invoices.filter((i: any) => i.status === "sent" || i.status === "draft");
  const totalOutstanding = pending.reduce((a: number, i: any) => a + (i.total || 0), 0);
  const totalOverdue = overdue.reduce((a: number, i: any) => a + (i.total || 0), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Outstanding */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-500" /> Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-black text-foreground">${totalOutstanding.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{pending.length} pending invoices</p>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Overdue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-black text-destructive">${totalOverdue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{overdue.length} overdue invoices</p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" /> Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Paid (30d)</span>
            <span className="font-semibold text-success">{invoices.filter((i: any) => i.status === "paid").length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Invoices</span>
            <span className="font-semibold">{invoices.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Role Selector ─────────────────────────────────────────────────────────────

function RoleSelector({ current, onChange }: { current: string; onChange: (role: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-card/50 rounded-xl p-1 border border-border/40">
      {ROLES.map((role) => {
        const isActive = current === role.id;
        return (
          <button
            key={role.id}
            onClick={() => onChange(role.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <role.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function DashboardPage() {
  // Role selector state
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dashboard_role") || "all";
    }
    return "all";
  });

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard_role", role);
    }
  };

  const summaryQuery = useQuery({
    queryKey: ["nucleo-summary-dashboard"],
    queryFn: () => nucleoApi.summary(),
  });
  const hrmQuery = useQuery({
    queryKey: ["hrm-summary-dashboard"],
    queryFn: () => nucleoApi.hrm.summary(),
  });
  const enterpriseQuery = useQuery({
    queryKey: ["enterprise-summary-dashboard"],
    queryFn: () => nucleoApi.enterprise.summary(),
  });
  const intelligenceQuery = useQuery({
    queryKey: ["intelligence-summary-dashboard"],
    queryFn: () => nucleoApi.intelligence.summary(),
  });
  const opsQuery = useQuery({
    queryKey: ["operations-summary-dashboard"],
    queryFn: () => nucleoApi.operations.summary(),
  });
  const ticketsQuery = useQuery({
    queryKey: ["dash-tickets"],
    queryFn: () => nucleoApi.tickets.list({ page: 1, limit: 20 }),
  });
  const invoicesQuery = useQuery({
    queryKey: ["dash-invoices"],
    queryFn: () => nucleoApi.invoices.list({ page: 1, limit: 20 }),
  });
  const projectsQuery = useQuery({
    queryKey: ["dash-projects"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 20 }),
  });
  const campaignsQuery = useQuery({
    queryKey: ["dash-campaigns"],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 20 }),
  });
  const dealsQuery = useQuery({
    queryKey: ["dash-deals"],
    queryFn: () => dealsApi.list({ limit: 1000 }),
  });
  const leadsQuery = useQuery({
    queryKey: ["dash-leads"],
    queryFn: () => leadsApi.list({ limit: 1000 }),
  });

  const isLoading =
    summaryQuery.isLoading ||
    hrmQuery.isLoading ||
    opsQuery.isLoading ||
    ticketsQuery.isLoading ||
    dealsQuery.isLoading ||
    leadsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-14" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-60" />
          ))}
        </div>
      </div>
    );
  }

  const s = summaryQuery.data || {};
  const hrm = hrmQuery.data || {};
  const ent = enterpriseQuery.data || {};
  const ai = intelligenceQuery.data || {};
  const ops = opsQuery.data || {};
  const tickets = ticketsQuery.data?.data || [];
  const invoices = invoicesQuery.data?.data || [];
  const projects = projectsQuery.data?.data || [];
  const campaigns = campaignsQuery.data?.data || [];
  const deals = dealsQuery.data?.data || [];
  const leads = leadsQuery.data?.data || [];

  // Also pull localStorage projects for full count
  const localProjects: any[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("nucleo_local_projects") || "[]");
    } catch {
      return [];
    }
  })();
  const allProjects = [...projects, ...localProjects];

  const modules: {
    label: string;
    value: number;
    href: string;
    icon: React.ElementType;
    color: string;
    accentFill: string;
    accentStroke: string;
    sub?: string;
  }[] = [
    {
      label: "CRM Pipeline",
      value: deals.length || s.deals || 0,
      href: "/app/crm",
      icon: Target,
      color: "text-cyan-400",
      accentStroke: "#22d3ee",
      accentFill: "rgba(34,211,238,0.12)",
      sub: "Active deals",
    },
    {
      label: "Active Leads",
      value: leads.length || s.leads || 0,
      href: "/app/crm",
      icon: Mail,
      color: "text-indigo-400",
      accentStroke: "#818cf8",
      accentFill: "rgba(129,140,248,0.12)",
      sub: "New opportunities",
    },
    {
      label: "Helpdesk Tickets",
      value: s.tickets || 0,
      href: "/app/helpdesk",
      icon: LifeBuoy,
      color: "text-orange-400",
      accentStroke: "#fb923c",
      accentFill: "rgba(251,146,60,0.12)",
      sub: "Total tickets",
    },
    {
      label: "Projects",
      value: allProjects.length || s.projects || 0,
      href: "/app/projects",
      icon: FolderKanban,
      color: "text-violet-400",
      accentStroke: "#a78bfa",
      accentFill: "rgba(167,139,250,0.12)",
      sub: "Active & planning",
    },
    {
      label: "Campaigns",
      value: s.campaigns || campaigns.length || 0,
      href: "/app/marketing",
      icon: Megaphone,
      color: "text-pink-400",
      accentStroke: "#f472b6",
      accentFill: "rgba(244,114,182,0.12)",
      sub: "Marketing campaigns",
    },
    {
      label: "Invoicing",
      value: s.invoices || invoices.length || 0,
      href: "/app/invoicing",
      icon: Receipt,
      color: "text-emerald-400",
      accentStroke: "#34d399",
      accentFill: "rgba(52,211,153,0.12)",
      sub: "Total invoices",
    },
    {
      label: "Procurement",
      value: ops.purchaseRequests || 0,
      href: "/app/procurement",
      icon: Briefcase,
      color: "text-amber-400",
      accentStroke: "#fbbf24",
      accentFill: "rgba(251,191,36,0.12)",
      sub: "Open requests",
    },
    {
      label: "Contracts",
      value: ops.contracts || 0,
      href: "/app/contracts",
      icon: Scale,
      color: "text-sky-400",
      accentStroke: "#38bdf8",
      accentFill: "rgba(56,189,248,0.12)",
      sub: "Active contracts",
    },
    {
      label: "HRM Headcount",
      value: hrm.headcount || 0,
      href: "/app/hrm",
      icon: UserRoundCog,
      color: "text-indigo-400",
      accentStroke: "#818cf8",
      accentFill: "rgba(129,140,248,0.12)",
      sub: "Total employees",
    },
    {
      label: "AI KPI Runs",
      value: ai.agentRuns || ai.kpis || 0,
      href: "/app/intelligence",
      icon: Brain,
      color: "text-fuchsia-400",
      accentStroke: "#e879f9",
      accentFill: "rgba(232,121,249,0.12)",
      sub: "Intelligence runs",
    },
  ];

  // Watchlist items
  const openTickets = tickets.filter((t: any) => t.status !== "closed").length;
  const overdueInvoices = invoices.filter(
    (i: any) =>
      i.dueAt &&
      new Date(i.dueAt).getTime() < Date.now() &&
      i.status !== "paid",
  ).length;
  const activeProjects = allProjects.filter(
    (p: any) => p.status === "active",
  ).length;
  const pendingLeave = hrm.pendingLeave || 0;
  const pendingProcurement = ops.purchaseRequests || 0;
  const aiRuns = ai.agentRuns || 0;

  // Health score (0-100)
  const healthItems = [
    openTickets === 0,
    overdueInvoices === 0,
    pendingLeave < 5,
    pendingProcurement < 10,
    activeProjects > 0 || allProjects.length > 0,
    aiRuns >= 0,
  ];
  const healthScore = Math.round(
    (healthItems.filter(Boolean).length / healthItems.length) * 100,
  );
  const healthColor =
    healthScore >= 80 ? "#22c55e" : healthScore >= 50 ? "#f59e0b" : "#ef4444";

  // Project status distribution
  const projByStatus = {
    planning: allProjects.filter((p: any) => p.status === "planning").length,
    active: allProjects.filter((p: any) => p.status === "active").length,
    on_hold: allProjects.filter((p: any) => p.status === "on_hold").length,
    completed: allProjects.filter((p: any) => p.status === "completed").length,
  };

  // Recent activity
  const now = new Date();
  const recent = [
    ...tickets.map((t: any) => ({
      id: `t-${t.id}`,
      time: t.createdAt,
      label: "Ticket",
      text: t.subject,
      href: "/app/helpdesk",
      color: "bg-orange-400/15 text-orange-400",
    })),
    ...invoices.map((i: any) => ({
      id: `i-${i.id}`,
      time: i.createdAt,
      label: "Invoice",
      text: `${i.invoiceNumber} · ${i.status}`,
      href: "/app/invoicing",
      color: "bg-emerald-400/15 text-emerald-400",
    })),
    ...allProjects.map((p: any) => ({
      id: `p-${p.id}`,
      time: p.createdAt,
      label: "Project",
      text: `${p.name} · ${p.status}`,
      href: "/app/projects",
      color: "bg-violet-400/15 text-violet-400",
    })),
    ...campaigns.map((c: any) => ({
      id: `c-${c.id}`,
      time: c.createdAt,
      label: "Campaign",
      text: `${c.name} · ${c.status}`,
      href: "/app/marketing",
      color: "bg-pink-400/15 text-pink-400",
    })),
    ...deals.map((d: any) => ({
      id: `d-${d.id}`,
      time: d.createdAt,
      label: "Pipeline",
      text: `${d.name} · $${d.value?.toLocaleString()}`,
      href: "/app/crm",
      color: "bg-cyan-400/15 text-cyan-400",
    })),
    ...leads.map((l: any) => ({
      id: `l-${l.id}`,
      time: l.createdAt,
      label: "Lead",
      text: `${l.firstName} ${l.lastName} · ${l.source || "Lead"}`,
      href: "/app/crm",
      color: "bg-indigo-400/15 text-indigo-400",
    })),
  ]

    .filter((item) => item.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  function timeAgo(iso: string) {
    const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Onboarding checklist (trial users only) */}
      <OnboardingChecklist />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Executive <span className="text-primary">Command</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Unified intelligence across CRM, Projects, Finance, and HRM.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RoleSelector current={selectedRole} onChange={handleRoleChange} />
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-foreground text-xs font-semibold tabular-nums uppercase tracking-wider">
              System Live
            </span>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
            <History className="h-4 w-4" /> Audit Log
          </Button>
        </div>
      </div>

      {/* Role-Specific Widgets */}
      {selectedRole !== "all" && (
        <div className="space-y-4">
          {selectedRole === "sales" && (
            <SalesRepWidgets deals={deals} leads={leads} campaigns={campaigns} />
          )}
          {selectedRole === "support" && (
            <SupportAgentWidgets tickets={tickets} />
          )}
          {selectedRole === "projects" && (
            <ProjectManagerWidgets projects={allProjects} />
          )}
          {selectedRole === "finance" && (
            <FinanceWidgets invoices={invoices} />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Metric
          title="Revenue Pipeline"
          value={`$${(summaryQuery.data?.deals || 0) / 1000}k`}
          icon={<Target className="h-4 w-4" />}
          trend="+12% growth"
          color="text-primary"
        />
        <Metric
          title="Active Projects"
          value={allProjects.length}
          icon={<FolderKanban className="h-4 w-4" />}
          trend="All on track"
          color="text-violet-400"
        />
        <Metric
          title="Customer Base"
          value={summaryQuery.data?.customers || 0}
          icon={<Users className="h-4 w-4" />}
          trend="+5 new leads"
          color="text-sky-400"
        />
        <Metric
          title="Intelligence"
          value="Level 4"
          icon={<Brain className="h-4 w-4" />}
          trend="AI Optimized"
          color="text-amber-400"
        />
        <Metric
          title="Operations"
          value="Nominal"
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="Stable sync"
          color="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                System Health Velocity
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Operational Flow
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "Jan", ops: 82, revenue: 12000 },
                    { month: "Feb", ops: 85, revenue: 18000 },
                    { month: "Mar", ops: 88, revenue: 24000 },
                    { month: "Apr", ops: 92, revenue: 38000 },
                    { month: "May", ops: 95, revenue: 45000 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
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
                    dataKey="revenue"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorIndex)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="ops"
                    stroke="#818cf8"
                    fillOpacity={0}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Resilience & Health
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-2">
              <DonutRing pct={healthScore} color={healthColor} size={100} />
            </div>
            <div className="space-y-4">
              <HealthBar
                label="Helpdesk SLA"
                value={tickets.length - openTickets}
                max={tickets.length || 1}
                color="#38bdf8"
              />
              <HealthBar
                label="Invoice Aging"
                value={invoices.length - overdueInvoices}
                max={invoices.length || 1}
                color="#f472b6"
              />
              <HealthBar
                label="Project Velocity"
                value={activeProjects}
                max={allProjects.length || 1}
                color="#a78bfa"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Executive Briefing */}
      <Card className="border-primary/20 bg-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Brain className="h-24 w-24 text-primary" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Nucleo Intelligence Briefing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                Revenue Performance
              </p>
              <p className="text-sm font-medium">
                Pipeline velocity is{" "}
                <span className="text-success font-bold">+18% higher</span> than
                Q4. Your average deal size has increased by $4.2k in the last 30
                days.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                Risk Assessment
              </p>
              <p className="text-sm font-medium">
                <span className="text-warning font-bold">
                  2 high-priority projects
                </span>{" "}
                are approaching milestone deadlines with {"<"} 40% completion.
                Support load is peaking on Tuesdays.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                Strategic Action
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary">Automate Follow-ups</Badge>
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  Reallocate Support
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module KPI grid with sparklines */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {modules.map((block) => (
          <Link key={block.label} to={block.href}>
            <Card className="group transition-all hover:border-primary/40 hover:bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                      {block.label}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <p className="font-black text-2xl text-foreground">
                        {block.value}
                      </p>
                      <Sparkline
                        data={seed(block.label)}
                        color={block.accentStroke}
                        fill={block.accentFill}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-2 group-hover:bg-primary/10 transition-colors">
                    <block.icon className={`h-5 w-5 ${block.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Mid row: Health score + Watchlist + Project Distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Project Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-violet-400" /> Project
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Planning",
                count: projByStatus.planning,
                color: "#f59e0b",
                bg: "bg-amber-400/15 text-amber-400",
              },
              {
                label: "Active",
                count: projByStatus.active,
                color: "#22c55e",
                bg: "bg-success/15 text-success",
              },
              {
                label: "On Hold",
                count: projByStatus.on_hold,
                color: "#94a3b8",
                bg: "bg-muted text-muted-foreground",
              },
              {
                label: "Completed",
                count: projByStatus.completed,
                color: "#22d3ee",
                bg: "bg-cyan-400/15 text-cyan-400",
              },
            ].map((s) => {
              const total = Math.max(allProjects.length, 1);
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {s.count}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-center">
              {[
                {
                  label: "HRM Attendance",
                  value: `${hrm.presentToday || 0}/${hrm.headcount || 0}`,
                  icon: UserRoundCog,
                },
                {
                  label: "Monthly Budget IQ",
                  value: `${hrm.pendingLeave || 0} pending`,
                  icon: TrendingUp,
                },
              ].map((i) => (
                <div key={i.label} className="rounded-lg bg-muted/40 p-2">
                  <i.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">{i.label}</p>
                  <p className="font-semibold text-foreground text-xs">
                    {i.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operational Watchlist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Critical Action
              Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                label: "High Priority Tickets",
                value: openTickets,
                href: "/app/helpdesk",
                warn: openTickets > 5,
                icon: LifeBuoy,
              },
              {
                label: "Overdue Receivables",
                value: overdueInvoices,
                href: "/app/invoicing",
                warn: overdueInvoices > 0,
                icon: Receipt,
              },
              {
                label: "SLA Breaches",
                value: "2",
                href: "/app/helpdesk",
                warn: true,
                icon: Clock,
              },
              {
                label: "Unapproved Expenses",
                value: "14",
                href: "/app/finance",
                warn: false,
                icon: TrendingUp,
              },
              {
                label: "New Leads (Last 24h)",
                value: leads.filter(
                  (l: any) =>
                    new Date(l.createdAt).getTime() > now.getTime() - 86400000,
                ).length,
                href: "/app/crm",
                warn: false,
                icon: Mail,
              },
              {
                label: "AI Agent Runs Today",
                value: aiRuns,
                href: "/app/intelligence",
                warn: false,
                icon: Brain,
              },
            ].map((item) => (
              <Link key={item.label} to={item.href}>
                <div
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/40 ${item.warn ? "border-destructive/30 bg-destructive/5" : "border-border"}`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon
                      className={`h-3.5 w-3.5 ${item.warn ? "text-destructive" : "text-muted-foreground"}`}
                    />
                    <span className="text-muted-foreground text-xs">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold text-sm ${item.warn ? "text-destructive" : "text-foreground"}`}
                    >
                      {item.value}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                </div>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground mt-1"
            >
              View Full Watchlist
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Activity Feed</CardTitle>
            <span className="text-muted-foreground text-xs">
              {recent.length} recent events
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                No recent activity. Start by creating a project, ticket, or
                campaign.
              </p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {recent.map((item) => (
                <Link key={item.id} to={item.href}>
                  <div className="group flex flex-col gap-1 rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.color}`}
                      >
                        {item.label}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {timeAgo(item.time)}
                      </span>
                    </div>
                    <p className="text-foreground text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {item.text}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
            {icon || <Building2 className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
