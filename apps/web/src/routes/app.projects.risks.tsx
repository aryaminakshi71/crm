import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
  Textarea,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Flag,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
}

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/risks")({
  component: RiskRegisterPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Risk = {
  id: string;
  title: string;
  description: string;
  category: "scope" | "resource" | "timeline" | "technical" | "budget" | "external";
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  status: "identified" | "mitigating" | "resolved" | "accepted";
  owner?: string;
  mitigation?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function RiskRegisterPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"probability" | "impact" | "date">("probability");

  const [newRisk, setNewRisk] = useState({
    title: "",
    description: "",
    category: "scope" as Risk["category"],
    probability: "medium" as Risk["probability"],
    impact: "medium" as Risk["impact"],
    owner: "",
    mitigation: "",
  });

  const risksQuery = useQuery({
    queryKey: ["projects", "risks"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/projects/risks`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch risks");
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
    retry: false,
  });
  if (risksQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => risksQuery.refetch()}>Retry</Button>
    </div>
  );

  const risks: Risk[] = (risksQuery as any).data?.data ?? [];

  // Filter and sort risks
  const filteredRisks = risks
    .filter((r) => {
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "probability") {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.probability] - order[a.probability];
      }
      if (sortBy === "impact") {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.impact] - order[a.impact];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Calculate risk score
  const getRiskScore = (risk: Risk) => {
    const probScore = { low: 1, medium: 2, high: 3 }[risk.probability];
    const impactScore = { low: 1, medium: 2, high: 3 }[risk.impact];
    return probScore * impactScore;
  };

  // Get risk level
  const getRiskLevel = (score: number) => {
    if (score >= 6) return { label: "Critical", color: "text-destructive", bg: "bg-destructive/10" };
    if (score >= 4) return { label: "High", color: "text-warning", bg: "bg-warning/10" };
    if (score >= 2) return { label: "Medium", color: "text-primary", bg: "bg-primary/10" };
    return { label: "Low", color: "text-success", bg: "bg-success/10" };
  };

  // Get level colors
  const getLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-warning";
      default:
        return "bg-success";
    }
  };

  // Category icons and colors
  const categoryConfig: Record<string, { icon: string; color: string }> = {
    scope: { icon: "🎯", color: "bg-purple-500/10 text-purple-500" },
    resource: { icon: "👥", color: "bg-blue-500/10 text-blue-500" },
    timeline: { icon: "⏰", color: "bg-amber-500/10 text-amber-500" },
    technical: { icon: "🔧", color: "bg-cyan-500/10 text-cyan-500" },
    budget: { icon: "💰", color: "bg-emerald-500/10 text-emerald-500" },
    external: { icon: "🌐", color: "bg-pink-500/10 text-pink-500" },
  };

  // Stats
  const criticalRisks = risks.filter((r) => getRiskScore(r) >= 6).length;
  const highRisks = risks.filter((r) => getRiskScore(r) >= 4 && getRiskScore(r) < 6).length;
  const mitigatedRisks = risks.filter((r) => r.status === "resolved" || r.status === "accepted").length;

  // Heatmap data
  const heatmapData = [
    { name: "Scope", critical: 1, high: 2, medium: 3, low: 1 },
    { name: "Resource", critical: 0, high: 1, medium: 2, low: 0 },
    { name: "Timeline", critical: 0, high: 1, medium: 1, low: 2 },
    { name: "Technical", critical: 1, high: 0, medium: 2, low: 1 },
    { name: "Budget", critical: 0, high: 1, medium: 1, low: 1 },
    { name: "External", critical: 0, high: 0, medium: 1, low: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Risk Register</h2>
          <p className="text-muted-foreground text-sm">
            Identify, assess, and mitigate project risks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Risk
          </Button>
        </div>
      </div>

      {/* Risk Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalRisks}</p>
                <p className="text-xs text-muted-foreground">Critical Risks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Flag className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highRisks}</p>
                <p className="text-xs text-muted-foreground">High Risks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{risks.length}</p>
                <p className="text-xs text-muted-foreground">Total Risks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mitigatedRisks}</p>
                <p className="text-xs text-muted-foreground">Mitigated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Risk Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2">
                    Category
                  </th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-destructive pb-2 px-2">
                    Critical
                  </th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-warning pb-2 px-2">
                    High
                  </th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-primary pb-2 px-2">
                    Medium
                  </th>
                  <th className="text-center text-xs font-bold uppercase tracking-wider text-success pb-2 px-2">
                    Low
                  </th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.name} className="border-t border-border/50">
                    <td className="py-2 text-sm font-medium">{row.name}</td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center">
                        {row.critical > 0 ? (
                          <div className="h-6 w-6 rounded bg-destructive/20 border border-destructive flex items-center justify-center">
                            <span className="text-xs font-bold text-destructive">
                              {row.critical}
                            </span>
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted/20" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center">
                        {row.high > 0 ? (
                          <div className="h-6 w-6 rounded bg-warning/20 border border-warning flex items-center justify-center">
                            <span className="text-xs font-bold text-warning">
                              {row.high}
                            </span>
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted/20" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center">
                        {row.medium > 0 ? (
                          <div className="h-6 w-6 rounded bg-primary/20 border border-primary flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {row.medium}
                            </span>
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted/20" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center">
                        {row.low > 0 ? (
                          <div className="h-6 w-6 rounded bg-success/20 border border-success flex items-center justify-center">
                            <span className="text-xs font-bold text-success">
                              {row.low}
                            </span>
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted/20" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-destructive" />
              <span className="text-muted-foreground">Critical (6-9)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-warning" />
              <span className="text-muted-foreground">High (4-5)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-primary" />
              <span className="text-muted-foreground">Medium (2-3)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-success" />
              <span className="text-muted-foreground">Low (1)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          <option value="scope">Scope</option>
          <option value="resource">Resource</option>
          <option value="timeline">Timeline</option>
          <option value="technical">Technical</option>
          <option value="budget">Budget</option>
          <option value="external">External</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="identified">Identified</option>
          <option value="mitigating">Mitigating</option>
          <option value="resolved">Resolved</option>
          <option value="accepted">Accepted</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="probability">Sort by Probability</option>
          <option value="impact">Sort by Impact</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {/* Risk List */}
      {risksQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {!risksQuery.isLoading && filteredRisks.map((risk) => {
          const score = getRiskScore(risk);
          const level = getRiskLevel(score);
          const isExpanded = expandedRisk === risk.id;

          return (
            <Card key={risk.id} className={level.bg}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Expand/Collapse */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRisk(isExpanded ? null : risk.id)
                    }
                    className="mt-1 shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Risk Score */}
                  <div className="shrink-0">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold ${level.bg.replace("/10", "")}`}
                    >
                      {score}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{risk.title}</p>
                          <Badge variant="default" size="sm">
                            {risk.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {risk.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            risk.status === "resolved"
                              ? "success"
                              : risk.status === "mitigating"
                                ? "warning"
                                : "default"
                          }
                          size="sm"
                        >
                          {risk.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Assessment
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Probability:
                              </span>
                              <Badge
                                variant={
                                  risk.probability === "high"
                                    ? "danger"
                                    : risk.probability === "medium"
                                      ? "warning"
                                      : "success"
                                }
                                size="sm"
                              >
                                {risk.probability}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Impact:
                              </span>
                              <Badge
                                variant={
                                  risk.impact === "high"
                                    ? "danger"
                                    : risk.impact === "medium"
                                      ? "warning"
                                      : "success"
                                }
                                size="sm"
                              >
                                {risk.impact}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {risk.owner && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Owner
                            </p>
                            <p className="text-sm font-medium">{risk.owner}</p>
                          </div>
                        )}

                        {risk.mitigation && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Mitigation Strategy
                            </p>
                            <p className="text-sm">{risk.mitigation}</p>
                          </div>
                        )}

                        <div className="flex gap-2 col-span-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toast.success("Risk updated")
                            }
                          >
                            Update Status
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toast.success("Risk deleted")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Compact Meta */}
                    {!isExpanded && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          P:{" "}
                          <span
                            className={
                              risk.probability === "high"
                                ? "text-destructive"
                                : risk.probability === "medium"
                                  ? "text-warning"
                                  : "text-success"
                            }
                          >
                            {risk.probability}
                          </span>
                        </span>
                        <span>
                          I:{" "}
                          <span
                            className={
                              risk.impact === "high"
                                ? "text-destructive"
                                : risk.impact === "medium"
                                  ? "text-warning"
                                  : "text-success"
                            }
                          >
                            {risk.impact}
                          </span>
                        </span>
                        {risk.owner && <span>Owner: {risk.owner}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredRisks.length === 0 && !risksQuery.isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No risks found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {filterCategory !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first risk to get started"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Risk Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Risk"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Risk added");
          setIsAddModalOpen(false);
          setNewRisk({
            title: "",
            description: "",
            category: "scope",
            probability: "medium",
            impact: "medium",
            owner: "",
            mitigation: "",
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={newRisk.title}
              onChange={(e) =>
                setNewRisk((r) => ({ ...r, title: e.target.value }))
              }
              placeholder="Risk title..."
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newRisk.description}
              onChange={(e) =>
                setNewRisk((r) => ({ ...r, description: e.target.value }))
              }
              placeholder="Describe the risk..."
              rows={2}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select
                value={newRisk.category}
                onChange={(e) =>
                  setNewRisk((r) => ({
                    ...r,
                    category: e.target.value as Risk["category"],
                  }))
                }
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="scope">Scope</option>
                <option value="resource">Resource</option>
                <option value="timeline">Timeline</option>
                <option value="technical">Technical</option>
                <option value="budget">Budget</option>
                <option value="external">External</option>
              </select>
            </FormField>
            <FormField label="Owner">
              <Input
                value={newRisk.owner}
                onChange={(e) =>
                  setNewRisk((r) => ({ ...r, owner: e.target.value }))
                }
                placeholder="Risk owner..."
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Probability">
              <select
                value={newRisk.probability}
                onChange={(e) =>
                  setNewRisk((r) => ({
                    ...r,
                    probability: e.target.value as Risk["probability"],
                  }))
                }
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormField>
            <FormField label="Impact">
              <select
                value={newRisk.impact}
                onChange={(e) =>
                  setNewRisk((r) => ({
                    ...r,
                    impact: e.target.value as Risk["impact"],
                  }))
                }
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormField>
          </div>
          <FormField label="Mitigation Strategy">
            <Textarea
              value={newRisk.mitigation}
              onChange={(e) =>
                setNewRisk((r) => ({ ...r, mitigation: e.target.value }))
              }
              placeholder="How will this risk be mitigated..."
              rows={2}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
