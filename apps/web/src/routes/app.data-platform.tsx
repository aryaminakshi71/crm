/**
 * Data Platform
 *
 * Unified data management, pipelines, and warehousing.
 */

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  GitMerge,
  Layers,
  RefreshCw,
  Server,
  Table2,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/app/data-platform")({
  component: DataPlatformPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getHeaders = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

function statusChip(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    warning: "bg-amber-500/15 text-amber-400",
    inactive: "bg-muted text-muted-foreground",
    failed: "bg-rose-500/15 text-rose-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? map.inactive}`}>
      {status}
    </span>
  );
}

function DataPlatformPage() {
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["data-platform"],
    queryFn: () =>
      fetch("/api/v1/data-platform", {
        headers: { "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" },
      })
        .then((r) => r.json())
        .catch(() => null),
    placeholderData: (prev) => prev,
    refetchInterval: 15000,
  });

  const pipelines: any[] = (data as any)?.pipelines ?? [];
  const tables: any[] = (data as any)?.tables ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Data Platform</h1>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">Unified data pipelines, warehousing, and analytics</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5${isRefetching ? " animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Active Pipelines", value: "4", icon: <GitMerge className="h-4 w-4" />, color: "text-primary" },
          { label: "Tables", value: "127", icon: <Table2 className="h-4 w-4" />, color: "text-emerald-400" },
          { label: "Total Records", value: "2.1M", icon: <Database className="h-4 w-4" />, color: "text-blue-400" },
          { label: "Data Sources", value: "12", icon: <Layers className="h-4 w-4" />, color: "text-violet-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
                <div className={`${s.color} opacity-60`}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipelines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Data Pipelines
          </CardTitle>
          <Button size="sm">
            <Zap className="h-3.5 w-3.5 mr-1.5" /> New Pipeline
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Pipeline</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Target</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Last Run</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Records</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.source}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.target}</td>
                  <td className="px-4 py-3">{statusChip(p.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.lastRun}</td>
                  <td className="px-4 py-3 text-sm">{p.records.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Data Tables
          </CardTitle>
          <Button size="sm" variant="outline">
            <Server className="h-3.5 w-3.5 mr-1.5" /> Query Editor
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Table</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Schema</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rows</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Size</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.name} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">{t.schema}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{t.rows}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{t.size}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
