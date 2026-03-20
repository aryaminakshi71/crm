/**
 * Tracing
 *
 * Distributed tracing viewer with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Timer,
  Clock,
  ArrowRight,
  Copy,
  Eye,
  Filter,
  Activity,
  Server,
  Database,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/tracing")({
  component: TracingPage,
});

function TracingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch traces from API
  const { data: traces = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "traces"],
    queryFn: () => monitoringApi.getTraces(),
    refetchInterval: 30000,
  });

  const filteredTraces = traces.filter((trace: any) =>
    trace.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trace.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    totalTraces: traces.length,
    avgDuration: traces.length > 0 ? Math.round(traces.reduce((sum: number, t: any) => sum + t.duration, 0) / traces.length) : 0,
    errorRate: traces.length > 0 ? ((traces.filter((t: any) => t.status === "error").length / traces.length) * 100).toFixed(1) : "0",
    totalSpans: traces.reduce((sum: number, t: any) => sum + (t.spans || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge variant="success" size="sm">OK</Badge>;
      case "error":
        return <Badge variant="danger" size="sm">Error</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Distributed Tracing</h2>
          <p className="text-sm text-muted-foreground">
            Trace request flow across services
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
          <Button variant="outline">
            Live Tail
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.totalTraces}</p>
                <p className="text-xs text-muted-foreground">Total Traces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Timer className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : `${summary.avgDuration}ms`}</p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowRight className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.totalSpans}</p>
                <p className="text-xs text-muted-foreground">Total Spans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : `${summary.errorRate}%`}</p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by trace ID or operation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Traces List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="space-y-1 p-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading traces...</div>
            ) : filteredTraces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No traces found</div>
            ) : (
              filteredTraces.map((trace: any) => (
                <div
                  key={trace.id}
                  className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                    trace.status === "error" ? "bg-red-50/50" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{trace.id}</span>
                      {getStatusBadge(trace.status)}
                    </div>
                    <p className="text-sm font-medium text-foreground">{trace.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {trace.startTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        {trace.services} services
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {trace.spans} spans
                      </span>
                    </div>
                  </div>
                  <div className="text-right px-4">
                    <p className={`text-lg font-bold ${trace.duration > 500 ? "text-red-600" : trace.duration > 200 ? "text-yellow-600" : "text-foreground"}`}>
                      {trace.duration}ms
                    </p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trace Detail Preview */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Trace Waterfall (tr-abc123)</h3>
          <div className="space-y-2">
            {[
              { service: "api-gateway", duration: 245, start: 0 },
              { service: "auth-service", duration: 45, start: 10 },
              { service: "order-service", duration: 180, start: 55 },
              { service: "payment-service", duration: 120, start: 70 },
              { service: "notification-service", duration: 30, start: 190 },
            ].map((span, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-32 text-xs text-muted-foreground truncate">{span.service}</div>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(span.duration / 245) * 100}%`, marginLeft: `${(span.start / 245) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-xs text-muted-foreground text-right">{span.duration}ms</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
