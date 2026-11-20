/**
 * Monitoring Logs
 *
 * Real-time log viewer with level/service filtering and monospace display.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Database, Download, RefreshCw, Search, X } from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { z } from "zod";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  level: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/monitoring/logs/_index")({
  validateSearch: searchSchema,
  component: LogsPage,
});

function levelBadgeClass(level: string): string {
  switch (level?.toLowerCase()) {
    case "error": return "bg-red-100 text-red-700 border-red-200";
    case "warn":
    case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "info": return "bg-blue-100 text-blue-700 border-blue-200";
    case "debug": return "bg-gray-100 text-gray-600 border-gray-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function levelRowAccent(level: string): string {
  switch (level?.toLowerCase()) {
    case "error": return "border-l-2 border-l-red-400";
    case "warn":
    case "warning": return "border-l-2 border-l-yellow-400";
    case "info": return "border-l-2 border-l-blue-400";
    case "debug": return "border-l-2 border-l-gray-300";
    default: return "";
  }
}


function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LogsPage() {
  const { q = "", level, page = 1 } = useSearch({ from: "/app/monitoring/logs/_index" });
  const navigate = useNavigate({ from: "/app/monitoring/logs" });
  const search = q;
  const levelFilter = level ?? "all";
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setLevelFilter = (v: string) => navigate({ search: (p) => ({ ...p, level: v === "all" ? undefined : v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [serviceFilter, setServiceFilter] = useState("all");

  const { data: rawLogs, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["monitoring", "logs", page],
    queryFn: () => monitoringApi.getLogs({ page, limit: PAGE_SIZE }),
    refetchInterval: 15000,
  });

  const logs: any[] = Array.isArray(rawLogs) ? rawLogs : [];
  const total = (rawLogs as any)?.total ?? (rawLogs as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const services = Array.from(
    new Set(logs.map((l: any) => l.source || l.service).filter(Boolean)),
  );

  const filtered = logs.filter((l: any) => {
    const svc = l.source || l.service || "";
    const matchesSearch =
      !search ||
      l.message?.toLowerCase().includes(search.toLowerCase()) ||
      svc.toLowerCase().includes(search.toLowerCase());
    const matchesLevel =
      levelFilter === "all" || l.level?.toLowerCase() === levelFilter;
    const matchesService = serviceFilter === "all" || svc === serviceFilter;
    return matchesSearch && matchesLevel && matchesService;
  });

  const errorCount = logs.filter((l: any) => l.level?.toLowerCase() === "error").length;
  const warnCount = logs.filter((l: any) => ["warn", "warning"].includes(l.level?.toLowerCase())).length;
  const infoCount = logs.filter((l: any) => l.level?.toLowerCase() === "info").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Log Viewer</h2>
          <p className="text-sm text-muted-foreground">
            Real-time application and infrastructure logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
          <button
            onClick={() => {
              const headers = ["Timestamp", "Level", "Service", "Message"];
              const rows = filtered.map((l: any) => {
                const svc = l.source || l.service || "unknown";
                const ts = l.timestamp ? new Date(l.timestamp).toISOString().replace("T", " ").substring(0, 19) : "";
                return [ts, l.level ?? "", svc, l.message ?? ""];
              });
              exportToCsv("logs.csv", headers, rows);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Logs
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Errors</p>
                <p className="font-black text-2xl text-red-600 mt-0.5">{isLoading ? "..." : errorCount}</p>
                <p className="text-muted-foreground text-xs mt-1">In current view</p>
              </div>
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <Database className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Warnings</p>
                <p className="font-black text-2xl text-yellow-600 mt-0.5">{isLoading ? "..." : warnCount}</p>
                <p className="text-muted-foreground text-xs mt-1">In current view</p>
              </div>
              <div className="rounded-xl bg-yellow-50 p-2.5 text-yellow-600">
                <Database className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Info</p>
                <p className="font-black text-2xl text-blue-600 mt-0.5">{isLoading ? "..." : infoCount}</p>
                <p className="text-muted-foreground text-xs mt-1">In current view</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Database className="h-4 w-4" />
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
            placeholder="Search log messages..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "error", "warn", "info", "debug"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => { setLevelFilter(lvl); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                levelFilter === lvl
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        {services.length > 0 && (
          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Services</option>
            {services.map((svc: string) => (
              <option key={svc} value={svc}>{svc}</option>
            ))}
          </select>
        )}
      </div>

      {/* Log Stream */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              Log Stream
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({filtered.length} entries)
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-normal text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Auto-refresh every 10s
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
              <Database className="h-8 w-8 opacity-30" />
              <p className="text-sm">No log entries found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30 font-mono text-xs">
              {filtered.map((log: any, idx: number) => {
                const svc = log.source || log.service || "unknown";
                const ts = log.timestamp ? new Date(log.timestamp) : null;
                return (
                  <div
                    key={log.id ?? idx}
                    className={`flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors ${levelRowAccent(log.level)}`}
                  >
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {ts ? ts.toISOString().replace("T", " ").substring(0, 19) : "—"}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase shrink-0 ${levelBadgeClass(log.level)}`}
                    >
                      {log.level ?? "—"}
                    </span>
                    <span className="text-primary/80 shrink-0">[{svc}]</span>
                    <span className="text-foreground break-all leading-relaxed">{log.message}</span>
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
