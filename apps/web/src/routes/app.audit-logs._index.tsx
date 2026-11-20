import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  action: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/audit-logs/_index")({
  validateSearch: searchSchema,
  component: AuditLogsPage,
});

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  login: "bg-gray-100 text-gray-800",
  export: "bg-purple-100 text-purple-800",
  view: "bg-slate-100 text-slate-800",
};

type DateRange = "today" | "7d" | "30d" | "all";

function AuditLogsPage() {
  const { q = "", action = "all", page = 1 } = useSearch({ from: "/app/audit-logs/_index" });
  const navigate = useNavigate({ from: "/app/audit-logs" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setAction = (v: string) => navigate({ search: (p) => ({ ...p, action: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [moduleFilter, setModuleFilter] = useState("all");
  const LIMIT = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, dateRange, action, moduleFilter],
    queryFn: async () => {
      return nucleoApi.enterprise.auditEvents.list({ page, limit: LIMIT });
    },
    refetchInterval: 60000,
  });

  const logs: any[] = (data as any)?.data ?? (data as any)?.logs ?? (Array.isArray(data) ? data : []);
  const total: number = (data as any)?.total ?? logs.length;
  const hasNext = page * LIMIT < total;
  const hasPrev = page > 1;

  function exportCsv() {
    try {
      const headers = ["Timestamp", "User", "Action", "Resource Type", "Resource Name", "IP Address"];
      const rows = logs.map((log: any) => [
        new Date(log.createdAt ?? log.timestamp).toLocaleString(),
        log.userName ?? log.userId ?? "",
        log.action ?? "",
        log.resourceType ?? log.resource ?? "",
        log.resourceName ?? log.resourceId ?? "",
        log.ipAddress ?? log.ip ?? "",
      ]);
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit log exported");
    } catch {
      toast.error("Failed to export audit log");
    }
  }

  function getInitial(name: string): string {
    return (name ?? "?")[0].toUpperCase();
  }

  if (isLoading) return <Loading text="Loading audit logs..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <FileSearch className="h-6 w-6" /> Audit Log
          </h1>
          <p className="text-muted-foreground text-sm">
            Track all actions and events across your organization.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={exportCsv}
          disabled={logs.length === 0}
        >
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

        <select
          value={dateRange}
          onChange={(e) => { setDateRange(e.target.value as DateRange); setPage(1 as number); }}
          className="flex h-9 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="flex h-9 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
        >
          <option value="all">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="export">Export</option>
          <option value="view">View</option>
        </select>

        <select
          value={moduleFilter}
          onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
          className="flex h-9 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
        >
          <option value="all">All modules</option>
          <option value="crm">CRM</option>
          <option value="helpdesk">Helpdesk</option>
          <option value="projects">Projects</option>
          <option value="invoicing">Invoicing</option>
          <option value="hrm">HRM</option>
          <option value="inventory">Inventory</option>
          <option value="settings">Settings</option>
          <option value="auth">Auth</option>
        </select>

        {total > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {total.toLocaleString()} entries
          </span>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState
              icon={<FileSearch className="h-12 w-12" />}
              title="No audit logs found"
              description="No activity has been recorded matching your current filters."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Resource
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        IP Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log: any, idx: number) => {
                      const action = (log.action ?? "").toLowerCase();
                      const colorCls = actionColors[action] ?? "bg-gray-100 text-gray-800";
                      const userName = log.userName ?? log.userEmail ?? log.userId ?? "System";
                      const ts = log.createdAt ?? log.timestamp;
                      return (
                        <tr key={log.id ?? idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {ts ? new Date(ts).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary shrink-0">
                                {getInitial(userName)}
                              </span>
                              <span className="text-xs text-foreground truncate max-w-[120px]">
                                {userName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${colorCls}`}>
                              {log.action ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                            {log.resourceType ?? log.resource ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-foreground max-w-[160px] truncate">
                            {log.resourceName ?? log.resourceId ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                            {log.ipAddress ?? log.ip ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {log.details || log.metadata ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const detail = log.details ?? log.metadata;
                                  toast.info(
                                    typeof detail === "string"
                                      ? detail
                                      : JSON.stringify(detail, null, 2)
                                  );
                                }}
                                className="text-xs text-primary hover:underline"
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  Page {page} &bull; showing {logs.length} of {total.toLocaleString()} entries
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                    onClick={() => setPage(page - 1)}
                    disabled={!hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasNext}
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
