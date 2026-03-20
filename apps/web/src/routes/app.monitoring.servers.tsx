/**
 * Servers
 *
 * Infrastructure and server monitoring with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Server,
  Search,
  Plus,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { SkeletonCard } from "@crm/ui";

export const Route = createFileRoute("/app/monitoring/servers")({
  component: () => (
    <ErrorBoundaryWrapper>
      <ServerGrid />
    </ErrorBoundaryWrapper>
  ),
});

function ServerGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch servers from API
  const { data: servers = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "servers"],
    queryFn: () => monitoringApi.getServers(),
    refetchInterval: 30000,
  });

  const filteredServers = servers.filter((server: any) => {
    const matchesSearch = server.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || server.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: servers.length,
    healthy: servers.filter((s: any) => s.status === "healthy").length,
    warning: servers.filter((s: any) => s.status === "warning").length,
    critical: servers.filter((s: any) => s.status === "critical").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="success" size="sm">Healthy</Badge>;
      case "warning":
        return <Badge variant="warning" size="sm">Warning</Badge>;
      case "critical":
        return <Badge variant="danger" size="sm">Critical</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Servers</h2>
          <p className="text-sm text-muted-foreground">
            Infrastructure monitoring and server health
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh All"}
          </button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Add Server
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Servers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{isLoading ? "..." : summary.healthy}</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
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
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
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
            placeholder="Search servers..."
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
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Servers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredServers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No servers found</div>
        ) : (
          filteredServers.map((server: any) => (
            <Card key={server.id} className={`border-border/60 ${server.status === "critical" ? "border-red-200" : server.status === "warning" ? "border-yellow-200" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${server.status === "critical" ? "bg-red-100" : server.status === "warning" ? "bg-yellow-100" : "bg-blue-100"}`}>
                      <Server className={`h-5 w-5 ${server.status === "critical" ? "text-red-600" : server.status === "warning" ? "text-yellow-600" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{server.name}</h3>
                      <p className="text-xs text-muted-foreground">{server.type} - {server.region}</p>
                    </div>
                  </div>
                  {getStatusBadge(server.status)}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">CPU</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${server.cpu > 80 ? "bg-red-500" : server.cpu > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${server.cpu}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{server.cpu}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Memory</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${server.memory > 80 ? "bg-red-500" : server.memory > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${server.memory}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{server.memory}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Disk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${server.disk > 80 ? "bg-red-500" : server.disk > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${server.disk}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{server.disk}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(server.status)}
                      {server.uptime}%
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
