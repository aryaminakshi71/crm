/**
 * Logs
 *
 * Log viewer and analysis with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Download,
  Filter,
  Clock,
  AlertCircle,
  Info,
  AlertTriangle,
  FileText,
  Copy,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/logs")({
  component: LogsPage,
});

function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  // Fetch logs from API
  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "logs"],
    queryFn: () => monitoringApi.getLogs(),
    refetchInterval: 30000,
  });

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.traceId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const summary = {
    total: logs.length,
    errors: logs.filter((l: any) => l.level === "error").length,
    warnings: logs.filter((l: any) => l.level === "warn").length,
    info: logs.filter((l: any) => l.level === "info").length,
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="danger" size="sm">ERROR</Badge>;
      case "warn":
        return <Badge variant="warning" size="sm">WARN</Badge>;
      case "info":
        return <Badge variant="info" size="sm">INFO</Badge>;
      default:
        return <Badge variant="default" size="sm">{level.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Logs</h2>
          <p className="text-sm text-muted-foreground">
            Log viewer and analysis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{isLoading ? "..." : summary.warnings}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Info className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{isLoading ? "..." : summary.info}</p>
                <p className="text-xs text-muted-foreground">Info</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="space-y-1 p-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No logs found</div>
            ) : (
              filteredLogs.map((log: any) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                    log.level === "error" ? "bg-red-50/50" : log.level === "warn" ? "bg-yellow-50/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 w-8 pt-0.5">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{log.timestamp || new Date().toISOString()}</span>
                      {getLevelBadge(log.level)}
                      <Badge variant="outline" size="sm">{log.service}</Badge>
                    </div>
                    <p className="text-sm text-foreground break-all">{log.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Trace: {log.traceId || log.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
