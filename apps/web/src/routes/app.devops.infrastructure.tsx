import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Server,
  Plus,
  Search,
  Settings,
  Cpu,
  HardDrive,
  Network,
  Activity,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Play,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/infrastructure")({
  component: Infrastructure,
});

const servers = [
  { id: 1, name: "web-prod-01", type: "Web Server", status: "healthy", ip: "10.0.1.15", cpu: "23%", memory: "45%", disk: "62%", region: "us-east-1", instances: 1 },
  { id: 2, name: "web-prod-02", type: "Web Server", status: "healthy", ip: "10.0.1.16", cpu: "31%", memory: "52%", disk: "58%", region: "us-east-1", instances: 1 },
  { id: 3, name: "api-prod-01", type: "API Server", status: "healthy", ip: "10.0.2.15", cpu: "45%", memory: "67%", disk: "41%", region: "us-west-2", instances: 2 },
  { id: 4, name: "api-prod-02", type: "API Server", status: "warning", ip: "10.0.2.16", cpu: "78%", memory: "82%", disk: "73%", region: "us-west-2", instances: 2 },
  { id: 5, name: "db-prod-01", type: "Database", status: "healthy", ip: "10.0.3.15", cpu: "18%", memory: "72%", disk: "85%", region: "us-east-1", instances: 3 },
  { id: 6, name: "cache-prod-01", type: "Cache", status: "healthy", ip: "10.0.4.15", cpu: "12%", memory: "58%", disk: "23%", region: "us-east-1", instances: 2 },
];

const resources = [
  { label: "Total Servers", value: "24", icon: Server, trend: "+2 this month" },
  { label: "CPU Usage", value: "34%", icon: Cpu, trend: "-5% from avg" },
  { label: "Memory Usage", value: "58%", icon: HardDrive, trend: "+2% from avg" },
  { label: "Storage", value: "2.4 TB", icon: HardDrive, trend: "+120 GB" },
];

function Infrastructure() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Infrastructure</h2>
          <p className="text-sm text-muted-foreground">
            Manage servers, provisioning, and resource allocation
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Configure
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Provision Server
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((resource) => (
          <Card key={resource.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">{resource.label}</p>
                  <p className="font-black text-2xl text-foreground mt-0.5">{resource.value}</p>
                  <p className="text-muted-foreground text-xs mt-1">{resource.trend}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-2.5">
                  <resource.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search servers..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="web">Web Server</option>
          <option value="api">API Server</option>
          <option value="db">Database</option>
          <option value="cache">Cache</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Regions</option>
          <option value="us-east">US East</option>
          <option value="us-west">US West</option>
        </select>
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {servers.map((server) => (
          <Card key={server.id} className={`border-border/60 hover:border-primary/30 transition-colors ${
            server.status === "warning" ? "border-amber-500/30" :
            server.status === "critical" ? "border-red-500/30" : ""
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    server.status === "healthy" ? "bg-green-500/10" :
                    server.status === "warning" ? "bg-amber-500/10" :
                    "bg-red-500/10"
                  }`}>
                    <Server className={`h-5 w-5 ${
                      server.status === "healthy" ? "text-green-500" :
                      server.status === "warning" ? "text-amber-500" :
                      "text-red-500"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{server.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        server.status === "healthy" ? "bg-green-500/10 text-green-500" :
                        server.status === "warning" ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {server.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{server.type} - {server.region}</p>
                  </div>
                </div>
                <button className="p-1 hover:bg-muted rounded">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">IP: {server.ip}</span>
                  <span className="text-muted-foreground">{server.instances} instance(s)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">CPU</span>
                    <span className={`font-medium ${
                      parseInt(server.cpu) > 70 ? "text-amber-500" : ""
                    }`}>{server.cpu}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${parseInt(server.cpu) > 70 ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: server.cpu }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Memory</span>
                    <span className={`font-medium ${
                      parseInt(server.memory) > 80 ? "text-amber-500" : ""
                    }`}>{server.memory}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${parseInt(server.memory) > 80 ? "bg-amber-500" : "bg-blue-500"}`}
                      style={{ width: server.memory }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Disk</span>
                    <span className={`font-medium ${
                      parseInt(server.disk) > 80 ? "text-amber-500" : ""
                    }`}>{server.disk}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${parseInt(server.disk) > 80 ? "bg-amber-500" : "bg-purple-500"}`}
                      style={{ width: server.disk }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  Details
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  Restart
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
