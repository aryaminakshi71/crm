/**
 * Synthetics
 *
 * Synthetic monitoring tests with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Timer,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/synthetics")({
  component: SyntheticsPage,
});

function SyntheticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch synthetics tests from API
  const { data: tests = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "synthetics"],
    queryFn: () => monitoringApi.getSynthetics(),
    refetchInterval: 60000,
  });

  const filteredTests = tests.filter((test: any) => {
    const matchesSearch = test.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.url?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || test.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: tests.length,
    passing: tests.filter((t: any) => t.status === "passing").length,
    failing: tests.filter((t: any) => t.status === "failing").length,
    warning: tests.filter((t: any) => t.status === "warning").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passing":
        return <Badge variant="success" size="sm">Passing</Badge>;
      case "failing":
        return <Badge variant="danger" size="sm">Failing</Badge>;
      case "warning":
        return <Badge variant="warning" size="sm">Warning</Badge>;
      case "paused":
        return <Badge variant="default" size="sm">Paused</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passing":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failing":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Pause className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Synthetics</h2>
          <p className="text-sm text-muted-foreground">
            Synthetic monitoring and uptime tests
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
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Test
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
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{isLoading ? "..." : summary.passing}</p>
                <p className="text-xs text-muted-foreground">Passing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.failing}</p>
                <p className="text-xs text-muted-foreground">Failing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{isLoading ? "..." : summary.warning}</p>
                <p className="text-xs text-muted-foreground">Warning</p>
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
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="passing">Passing</option>
            <option value="failing">Failing</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      </div>

      {/* Tests List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading synthetics tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No tests found</div>
        ) : (
          filteredTests.map((test: any) => (
            <Card key={test.id} className={`border-border/60 ${test.status === "failing" ? "border-red-200" : test.status === "warning" ? "border-yellow-200" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${test.status === "failing" ? "bg-red-100" : test.status === "warning" ? "bg-yellow-100" : "bg-green-100"}`}>
                      {getStatusIcon(test.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{test.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {test.url}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(test.status)}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{test.avgLatency}ms</p>
                    <p className="text-xs text-muted-foreground">Avg Latency</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{test.uptime?.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{test.frequency}</p>
                    <p className="text-xs text-muted-foreground">Frequency</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last run: {test.lastRun}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Pause className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
