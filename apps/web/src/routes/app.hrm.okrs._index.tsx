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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { hrmApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/hrm/okrs/_index")({
  validateSearch: searchSchema,
  component: OkrsIndexPage,
});

const STATUS_BADGE: Record<string, "primary" | "success" | "warning" | "danger" | "default"> = {
  on_track: "success",
  at_risk: "warning",
  behind: "danger",
  completed: "primary",
  draft: "default",
  active: "success",
};

const QUARTER_OPTIONS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2025", "Q2 2025"];

function OkrsIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", status, page = 1 } = useSearch({ from: "/app/hrm/okrs/_index" });
  const navigate = useNavigate({ from: "/app/hrm/okrs" });
  const search = q;
  const quarterFilter = status ?? "all";
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setQuarterFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v, page: 1 }) });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // OKRs API — load from HRM API
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrm", "okrs"],
    queryFn: () => hrmApi.okrs.list(),
    placeholderData: (prev) => prev,
  });

  const objectives: any[] = ((data as any)?.data as any[]) ?? [];

  const quarters = useMemo(() => {
    const qs = new Set(objectives.map((o: any) => o.quarter || "").filter(Boolean));
    return ["all", ...Array.from(qs).sort().reverse()];
  }, [objectives]);

  const filtered = useMemo(() => {
    return objectives.filter((o: any) => {
      const matchSearch =
        !search.trim() ||
        o.title?.toLowerCase().includes(search.toLowerCase()) ||
        o.objective?.toLowerCase().includes(search.toLowerCase()) ||
        o.owner?.toLowerCase().includes(search.toLowerCase()) ||
        o.ownerName?.toLowerCase().includes(search.toLowerCase());
      const matchQuarter = quarterFilter === "all" || o.quarter === quarterFilter;
      return matchSearch && matchQuarter;
    });
  }, [objectives, search, quarterFilter]);

  const onTrack = objectives.filter((o: any) => o.status === "on_track" || o.status === "active").length;
  const atRisk = objectives.filter((o: any) => o.status === "at_risk").length;
  const avgProgress =
    objectives.length > 0
      ? Math.round(
          objectives.reduce((acc, o: any) => acc + (o.progress ?? o.completion ?? 0), 0) /
            objectives.length,
        )
      : 0;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load OKRs. Please try again.</p>
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
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl text-foreground">OKRs</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Objectives and Key Results — track goals and progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search objectives..."
            />
          </div>
          <select
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q === "all" ? "All Quarters" : q}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Objective
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Total Objectives",
            value: isLoading ? "—" : objectives.length,
            icon: <Target className="h-4 w-4" />,
            color: "text-primary",
          },
          {
            label: "On Track",
            value: isLoading ? "—" : onTrack,
            icon: <Zap className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "At Risk",
            value: isLoading ? "—" : atRisk,
            icon: <AlertCircle className="h-4 w-4" />,
            color: atRisk > 0 ? "text-amber-400" : "text-muted-foreground",
          },
          {
            label: "Avg Progress",
            value: isLoading ? "—" : `${avgProgress}%`,
            icon: <TrendingUp className="h-4 w-4" />,
            color: "text-cyan-400",
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

      {/* OKR List */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No objectives found"
          description="Create your first OKR to start tracking goals."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((objective: any) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              expanded={expandedIds.has(objective.id)}
              onToggle={() => toggleExpand(objective.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ObjectiveCard({
  objective,
  expanded,
  onToggle,
}: {
  objective: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const title = objective.title || objective.objective || "Untitled Objective";
  const owner = objective.owner || objective.ownerName || "—";
  const progress = objective.progress ?? objective.completion ?? 0;
  const keyResults: any[] = objective.keyResults ?? objective.key_results ?? [];
  const krCount = keyResults.length || objective.keyResultsCount || 0;
  const quarter = objective.quarter || "—";

  const progressColor =
    objective.status === "at_risk" || objective.status === "behind"
      ? "bg-amber-400"
      : objective.status === "completed"
      ? "bg-emerald-400"
      : "bg-primary";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Objective Row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="mt-0.5 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Target className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm">{title}</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{owner}</span>
                </div>
                {krCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {krCount} key result{krCount !== 1 ? "s" : ""}
                  </span>
                )}
                {quarter !== "—" && (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                    {quarter}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={STATUS_BADGE[objective.status] ?? "default"}>
                {objective.status ?? "active"}
              </Badge>
              <span className="text-sm font-bold text-foreground w-12 text-right">
                {progress}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressColor}`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      </button>

      {/* Key Results */}
      {expanded && keyResults.length > 0 && (
        <div className="border-t border-border/60 divide-y divide-border/40">
          {keyResults.map((kr: any, i: number) => {
            const krProgress = kr.progress ?? kr.completion ?? kr.current ?? 0;
            const krTitle = kr.title || kr.description || kr.name || `Key Result ${i + 1}`;
            return (
              <div key={kr.id ?? i} className="flex items-center gap-4 px-4 py-3 bg-muted/20">
                <div className="w-6 shrink-0 text-center">
                  <span className="text-[10px] font-bold text-muted-foreground">KR{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{krTitle}</p>
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full"
                      style={{ width: `${Math.min(100, krProgress)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground w-10 text-right shrink-0">
                  {krProgress}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {expanded && keyResults.length === 0 && (
        <div className="border-t border-border/60 px-4 py-3 bg-muted/10">
          <p className="text-xs text-muted-foreground italic">No key results defined yet.</p>
        </div>
      )}
    </div>
  );
}
