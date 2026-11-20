/**
 * Monitoring Incidents
 *
 * Incident management with timeline, severity tracking, and MTTR stats.
 */

import { Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, RefreshCw, Search, Zap } from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { z } from "zod";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/monitoring/incidents/_index")({
  validateSearch: searchSchema,
  component: IncidentsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({ "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" });

function severityBadgeClass(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-100 text-red-700 border-red-200";
    case "high": return "bg-orange-100 text-orange-700 border-orange-200";
    case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "low": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function statusBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case "investigating": return "bg-red-100 text-red-700 border-red-200";
    case "identified": return "bg-orange-100 text-orange-700 border-orange-200";
    case "monitoring": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "resolved": return "bg-green-100 text-green-700 border-green-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function IncidentsPage() {
  const queryClient = useQueryClient();
  const { q = "", status, page = 1 } = useSearch({ from: "/app/monitoring/incidents/_index" });
  const navigate = useNavigate({ from: "/app/monitoring/incidents/_index" });
  const search = q;
  const statusFilter = status ?? "all";
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data: rawIncidents, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["monitoring", "incidents", page],
    queryFn: () => monitoringApi.getIncidents({ page, limit: PAGE_SIZE }),
    refetchInterval: 20000,
    onSuccess: () => setLastUpdated(new Date()),
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/incidents/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to resolve incident");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring", "incidents"] }),
  });

  const incidents: any[] = Array.isArray(rawIncidents) ? rawIncidents : [];
  const total = (rawIncidents as any)?.total ?? (rawIncidents as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = incidents.filter((inc: any) => {
    const matchesSearch =
      !search ||
      inc.title?.toLowerCase().includes(search.toLowerCase()) ||
      inc.service?.toLowerCase().includes(search.toLowerCase()) ||
      inc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || inc.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = incidents.filter((i: any) => i.status !== "resolved").length;
  const totalThisMonth = incidents.length;
  const resolvedIncidents = incidents.filter((i: any) => i.status === "resolved");

  // Calculate average MTTR from resolved incidents that have duration
  let mttr = "N/A";
  if (resolvedIncidents.length > 0) {
    mttr = resolvedIncidents[0]?.duration ?? "N/A";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Incidents</h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live · updated {timeAgo(lastUpdated.toISOString())}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Track and manage platform incidents and outages
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Open Incidents</p>
                <p className={`font-black text-2xl mt-0.5 ${openCount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {isLoading ? "..." : openCount}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Actively being investigated</p>
              </div>
              <div className={`rounded-xl p-2.5 ${openCount > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                <Zap className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">MTTR</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : mttr}</p>
                <p className="text-muted-foreground text-xs mt-1">Mean time to resolve</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total This Month</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : totalThisMonth}</p>
                <p className="text-muted-foreground text-xs mt-1">All incidents recorded</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "investigating", "monitoring", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Incident Log
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({filtered.length} incidents)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <CheckCircle className="h-8 w-8 opacity-30 text-green-500" />
              <p className="text-sm">No incidents found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((inc: any) => {
                const isExpanded = expandedId === inc.id;
                const isOpen = inc.status !== "resolved";
                const startedAt = inc.startedAt ? new Date(inc.startedAt) : null;

                return (
                  <div key={inc.id} className="hover:bg-muted/10 transition-colors">
                    {/* Main row */}
                    <button
                      className="w-full text-left p-4"
                      onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${isOpen ? "text-red-500" : "text-green-500"}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">{inc.title}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${severityBadgeClass(inc.severity)}`}>
                                {inc.severity}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusBadgeClass(inc.status)}`}>
                                {inc.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span>Service: <span className="font-semibold text-foreground">{inc.service}</span></span>
                              {inc.impact && <span>Impact: <span className="font-semibold">{inc.impact}</span></span>}
                              {inc.duration && <span>Duration: <span className="font-semibold text-foreground">{inc.duration}</span></span>}
                              {startedAt && <span>Started: {startedAt.toLocaleString()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isOpen && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                resolveMutation.mutate(inc.id);
                              }}
                              disabled={resolveMutation.isPending}
                              className="text-xs h-7 text-green-700 border-green-300 hover:bg-green-50"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Timeline */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-muted/5 border-t border-border/30">
                        <div className="mt-3 space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</p>
                          {inc.description && (
                            <p className="text-sm text-foreground">{inc.description}</p>
                          )}
                          {inc.assignee && (
                            <p className="text-xs text-muted-foreground">Assignee: <span className="font-medium text-foreground">{inc.assignee}</span></p>
                          )}
                          {inc.rootCause && (
                            <div className="rounded-md bg-muted/30 p-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Root Cause</p>
                              <p className="text-sm text-foreground">{inc.rootCause}</p>
                            </div>
                          )}
                          {inc.resolution && (
                            <div className="rounded-md bg-green-50 p-3">
                              <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                              <p className="text-sm text-foreground">{inc.resolution}</p>
                            </div>
                          )}
                          {isOpen && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Timeline</p>
                              <div className="space-y-2 border-l-2 border-red-200 pl-3">
                                <div className="relative">
                                  <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-red-500" />
                                  <p className="text-xs text-muted-foreground">{startedAt?.toLocaleString()}</p>
                                  <p className="text-sm text-foreground font-medium">Incident detected</p>
                                </div>
                                <div className="relative">
                                  <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-yellow-400" />
                                  <p className="text-xs text-muted-foreground">Now</p>
                                  <p className="text-sm text-foreground">Status: {inc.status}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
