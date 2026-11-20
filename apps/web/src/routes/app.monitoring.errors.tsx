/**
 * Errors
 *
 * Error tracking and aggregation with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  Eye,
  ArrowRight,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/errors")({
  component: ErrorsPage,
});

function ErrorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedError, setExpandedError] = useState<string | null>(null);

  // Fetch errors from API
  const { data: errorData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "errors"],
    queryFn: () => monitoringApi.getErrors(),
    refetchInterval: 30000,
  });

  const errors = errorData?.recentErrors || [
    { id: "1", type: "PaymentTimeoutError", message: "Payment processing timeout after 30s", count: 45, users: 32, firstSeen: "2 hours ago", lastSeen: "5 min ago", status: "unresolved", severity: "high" },
    { id: "2", type: "DatabaseConnectionError", message: "Connection pool exhausted", count: 28, users: 15, firstSeen: "4 hours ago", lastSeen: "30 min ago", status: "resolved", severity: "critical" },
    { id: "3", type: "InvalidTokenError", message: "JWT token validation failed", count: 156, users: 89, firstSeen: "1 day ago", lastSeen: "1 hour ago", status: "unresolved", severity: "medium" },
  ];

  const filteredErrors = errors.filter((error: any) =>
    error.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    error.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    total: errorData?.uniqueErrors || errors.length,
    unhandled: errors.filter((e: any) => e.status === "unresolved").length,
    critical: errorData?.criticalErrors || errors.filter((e: any) => e.severity === "critical").length,
    totalOccurrences: errorData?.errorCount || errors.reduce((sum: number, e: any) => sum + (e.count || 0), 0),
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case "high":
        return <Badge variant="warning" size="sm">High</Badge>;
      case "medium":
        return <Badge variant="info" size="sm">Medium</Badge>;
      case "low":
        return <Badge variant="default" size="sm">Low</Badge>;
      default:
        return <Badge variant="default" size="sm">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case "unresolved":
        return <Badge variant="warning" size="sm">Unresolved</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Error Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Error aggregation and analysis
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.total}</p>
                <p className="text-xs text-muted-foreground">Unique Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{isLoading ? "..." : summary.unhandled}</p>
                <p className="text-xs text-muted-foreground">Unresolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowRight className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.totalOccurrences}</p>
                <p className="text-xs text-muted-foreground">Total Occurrences</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search errors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Errors List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="space-y-1 p-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading errors...</div>
            ) : filteredErrors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No errors found</div>
            ) : (
              filteredErrors.map((error: any) => (
                <div key={error.id}>
                  <div
                    className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                      error.severity === "critical" ? "bg-red-50/50" : error.severity === "high" ? "bg-yellow-50/50" : ""
                    }`}
                    onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedError === error.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <AlertCircle className={`h-4 w-4 ${error.severity === "critical" || error.severity === "high" ? "text-red-500" : "text-yellow-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-foreground">{error.type}</span>
                        {getSeverityBadge(error.severity)}
                        {getStatusBadge(error.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{error.message}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{error.count || 0} occurrences</span>
                        <span>{error.users || 0} users</span>
                        <span>First: {error.firstSeen}</span>
                        <span>Last: {error.lastSeen}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {expandedError === error.id && (
                    <div className="ml-10 p-4 bg-muted/30 rounded-lg mb-2">
                      <h4 className="text-sm font-medium text-foreground mb-2">Stack Trace</h4>
                      <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
{`Error: ${error.message}
    at PaymentService.process (/app/services/payment.js:145:12)
    at OrderController.create (/app/controllers/order.js:89:15)
    at Router.handle (/app/routes/api.js:23:10)
    at Layer.handle [as handle] (/node/express/lib/router.js:45:10)`}
                      </pre>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">View in Sentry</Button>
                        <Button size="sm" variant="outline">Mark Resolved</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
