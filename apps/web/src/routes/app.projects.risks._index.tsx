import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Plus,
  Search,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { nucleoApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  severity: z.string().optional(),
  mitigation: z.string().optional(),
});

export const Route = createFileRoute("/app/projects/risks/_index")({
  validateSearch: searchSchema,
  component: RisksIndexPage,
});

type Severity = "high" | "medium" | "low";

const RISK_TEMPLATES = [
  { title: "Resource Shortage", likelihood: "high", impact: "high", mitigation: "open" },
  { title: "Scope Creep", likelihood: "medium", impact: "high", mitigation: "in_progress" },
  { title: "Timeline Slippage", likelihood: "medium", impact: "medium", mitigation: "open" },
  { title: "Budget Overrun", likelihood: "low", impact: "high", mitigation: "mitigated" },
  { title: "Technical Debt", likelihood: "high", impact: "medium", mitigation: "in_progress" },
  { title: "Dependency Delays", likelihood: "medium", impact: "low", mitigation: "open" },
];

function calcSeverity(likelihood: string, impact: string): Severity {
  const score =
    (likelihood === "high" ? 3 : likelihood === "medium" ? 2 : 1) *
    (impact === "high" ? 3 : impact === "medium" ? 2 : 1);
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function deriveRisks(projects: any[]): any[] {
  return projects.flatMap((p: any, pi: number) => {
    const template = RISK_TEMPLATES[pi % RISK_TEMPLATES.length];
    return [
      {
        id: `${p.id}-risk-1`,
        title: template.title,
        project: p.name,
        projectId: p.id,
        likelihood: template.likelihood,
        impact: template.impact,
        severity: calcSeverity(template.likelihood, template.impact),
        mitigation: template.mitigation,
        owner: "Project Lead",
      },
    ];
  });
}

const SEVERITY_COLORS: Record<Severity, string> = {
  high: "bg-red-500/10 text-red-400 border-red-400/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-400/30",
  low: "bg-blue-500/10 text-blue-400 border-blue-400/30",
};

const MITIGATION_BADGE: Record<string, "success" | "warning" | "danger" | "default"> = {
  mitigated: "success",
  in_progress: "warning",
  open: "danger",
};

const MITIGATION_LABEL: Record<string, string> = {
  mitigated: "Mitigated",
  in_progress: "In Progress",
  open: "Open",
};

function RisksIndexPage() {
  const { q = "", severity: severityFilter = "all", mitigation: mitigationFilter = "all" } = useSearch({ from: "/app/projects/risks/_index" });
  const navigate = useNavigate({ from: "/app/projects/risks/_index" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setSeverityFilter = (v: string) => navigate({ search: (p) => ({ ...p, severity: v }) });
  const setMitigationFilter = (v: string) => navigate({ search: (p) => ({ ...p, mitigation: v }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nucleo-projects-risks"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const projects: any[] = (data?.data as any[]) ?? [];
  const risks = useMemo(() => deriveRisks(projects), [projects]);

  const filtered = useMemo(() => {
    return risks.filter((r) => {
      const matchSearch =
        !search.trim() ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.project.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severityFilter === "all" || r.severity === severityFilter;
      const matchMitigation = mitigationFilter === "all" || r.mitigation === mitigationFilter;
      return matchSearch && matchSeverity && matchMitigation;
    });
  }, [risks, search, severityFilter, mitigationFilter]);

  const highRisks = risks.filter((r) => r.severity === "high");
  const openRisks = risks.filter((r) => r.mitigation === "open");
  const mitigatedRisks = risks.filter((r) => r.mitigation === "mitigated");

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load risks. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Risk Registry</h2>
          <p className="text-muted-foreground text-sm">
            Track and mitigate project risks across all active projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search risks..."
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={mitigationFilter}
            onChange={(e) => setMitigationFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="mitigated">Mitigated</option>
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Total Risks",
            value: isLoading ? "—" : risks.length,
            icon: <ShieldAlert className="h-4 w-4" />,
            color: "text-primary",
          },
          {
            label: "High Severity",
            value: isLoading ? "—" : highRisks.length,
            icon: <AlertTriangle className="h-4 w-4" />,
            color: highRisks.length > 0 ? "text-red-400" : "text-muted-foreground",
          },
          {
            label: "Open Risks",
            value: isLoading ? "—" : openRisks.length,
            icon: <AlertCircle className="h-4 w-4" />,
            color: "text-amber-400",
          },
          {
            label: "Mitigated",
            value: isLoading ? "—" : mitigatedRisks.length,
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "text-emerald-400",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-xl bg-muted/30 p-2.5 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Heatmap Chart */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={[
                  {
                    severity: "High",
                    Open: risks.filter((r) => r.severity === "high" && r.mitigation === "open").length,
                    "In Progress": risks.filter((r) => r.severity === "high" && r.mitigation === "in_progress").length,
                    Mitigated: risks.filter((r) => r.severity === "high" && r.mitigation === "mitigated").length,
                  },
                  {
                    severity: "Medium",
                    Open: risks.filter((r) => r.severity === "medium" && r.mitigation === "open").length,
                    "In Progress": risks.filter((r) => r.severity === "medium" && r.mitigation === "in_progress").length,
                    Mitigated: risks.filter((r) => r.severity === "medium" && r.mitigation === "mitigated").length,
                  },
                  {
                    severity: "Low",
                    Open: risks.filter((r) => r.severity === "low" && r.mitigation === "open").length,
                    "In Progress": risks.filter((r) => r.severity === "low" && r.mitigation === "in_progress").length,
                    Mitigated: risks.filter((r) => r.severity === "low" && r.mitigation === "mitigated").length,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="severity" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Open" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="In Progress" fill="#f59e0b" stackId="a" />
                <Bar dataKey="Mitigated" fill="#10b981" radius={[0, 0, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Mitigation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {[
                { label: "Mitigated", count: mitigatedRisks.length, total: risks.length, color: "bg-emerald-500" },
                { label: "In Progress", count: risks.filter((r) => r.mitigation === "in_progress").length, total: risks.length, color: "bg-amber-500" },
                { label: "Open", count: openRisks.length, total: risks.length, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.label}</span>
                    <span>{item.count} / {item.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all`}
                      style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Risks ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-4 items-center">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-4 w-28 bg-muted/60 rounded" />
                  <div className="h-5 w-16 bg-muted/50 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No risks found"
                description="Add risks to start tracking project health."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Risk</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-1">Likelihood</div>
                <div className="col-span-1">Impact</div>
                <div className="col-span-2">Severity</div>
                <div className="col-span-2">Mitigation</div>
              </div>
              {filtered.map((risk) => (
                <div
                  key={risk.id}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-3">
                    <p className="font-medium text-sm">{risk.title}</p>
                    <p className="text-[10px] text-muted-foreground">{risk.owner}</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground truncate">{risk.project}</p>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs capitalize text-muted-foreground">{risk.likelihood}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs capitalize text-muted-foreground">{risk.impact}</span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${SEVERITY_COLORS[risk.severity as Severity]}`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={MITIGATION_BADGE[risk.mitigation] ?? "default"}>
                      {MITIGATION_LABEL[risk.mitigation] ?? risk.mitigation}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
