import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Progress,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Database,
} from "lucide-react";

export const Route = createFileRoute("/admin/monitoring")({
  component: AdminMonitoringPage,
});

const statusConfig: Record<
  string,
  { color: string; icon: any; label: string; dot: string }
> = {
  up: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Operational",
    dot: "bg-green-500",
  },
  degraded: {
    color: "bg-amber-100 text-amber-800",
    icon: AlertTriangle,
    label: "Degraded",
    dot: "bg-amber-500",
  },
  down: {
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Down",
    dot: "bg-red-500",
  },
};

const severityConfig: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
};

const incidentStatusConfig: Record<string, string> = {
  investigating: "bg-red-100 text-red-800",
  monitoring: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
};

function AdminMonitoringPage() {
  const { data: apiData } = useQuery({
    queryKey: ["admin-monitoring"],
    queryFn: async () => {
      const res = await fetch("/api/admin/monitoring");
      if (!res.ok) return null;
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const health = (apiData as any)?.health ?? [];
  const errorRate = (apiData as any)?.errorRate ?? [];
  const incidents = (apiData as any)?.incidents ?? [];
  const resources = (apiData as any)?.resources ?? { cpu: 0, memory: 0, dbConnections: 0 };

  const upCount = health.filter((h: any) => h.status === "up").length;
  const degradedCount = health.filter((h: any) => h.status === "degraded").length;
  const downCount = health.filter((h: any) => h.status === "down").length;
  const overallStatus =
    downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "up";

  const overallConfig = statusConfig[overallStatus];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground flex items-center gap-2">
            <Activity className="h-7 w-7" />
            Monitoring
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time system health and incident tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${overallConfig.dot} animate-pulse`} />
          <Badge className={overallConfig.color}>
            <OverallIcon className="h-3 w-3 mr-1" />
            {overallConfig.label}
          </Badge>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-green-600">{upCount}</p>
            <p className="text-xs text-muted-foreground">Operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{degradedCount}</p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-red-600">{downCount}</p>
            <p className="text-xs text-muted-foreground">Down</p>
          </CardContent>
        </Card>
      </div>

      {/* API Health Cards */}
      <Card>
        <CardHeader>
          <CardTitle>API Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {health.map((endpoint: any) => {
              const cfg = statusConfig[endpoint.status] ?? statusConfig["up"];
              const Icon = cfg.icon;
              return (
                <div
                  key={endpoint.name}
                  className="p-4 rounded-lg border border-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-foreground">
                      {endpoint.name}
                    </p>
                    <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {endpoint.endpoint}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-[10px] ${cfg.color}`}>
                      <Icon className="h-2.5 w-2.5 mr-0.5" />
                      {cfg.label}
                    </Badge>
                    {endpoint.latency > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {endpoint.latency}ms
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Uptime</span>
                      <span>{endpoint.uptime}%</span>
                    </div>
                    <Progress value={endpoint.uptime} className="h-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Rate Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Error Rate (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={errorRate}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, "Error Rate"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#errorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">CPU Usage</span>
                </div>
                <span
                  className={
                    resources.cpu > 80
                      ? "text-red-600 font-bold"
                      : resources.cpu > 60
                        ? "text-amber-600 font-bold"
                        : "text-green-600 font-bold"
                  }
                >
                  {resources.cpu}%
                </span>
              </div>
              <Progress value={resources.cpu} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Memory</span>
                </div>
                <span
                  className={
                    resources.memory > 80
                      ? "text-red-600 font-bold"
                      : resources.memory > 60
                        ? "text-amber-600 font-bold"
                        : "text-green-600 font-bold"
                  }
                >
                  {resources.memory}%
                </span>
              </div>
              <Progress value={resources.memory} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">DB Connections</span>
                </div>
                <span
                  className={
                    resources.dbConnections > 80
                      ? "text-red-600 font-bold"
                      : resources.dbConnections > 60
                        ? "text-amber-600 font-bold"
                        : "text-green-600 font-bold"
                  }
                >
                  {resources.dbConnections}%
                </span>
              </div>
              <Progress value={resources.dbConnections} className="h-2" />
            </div>

            <div className="pt-2 border-t border-border space-y-1">
              <p className="text-xs text-muted-foreground">
                All values reflect current pool utilization
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Refreshes every 30s
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc: any) => (
                <TableRow key={inc.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {inc.id}
                  </TableCell>
                  <TableCell className="font-medium">{inc.title}</TableCell>
                  <TableCell>
                    <Badge className={severityConfig[inc.severity] ?? ""}>
                      {inc.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={incidentStatusConfig[inc.status] ?? ""}>
                      {inc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inc.affected}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inc.started}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inc.duration}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
