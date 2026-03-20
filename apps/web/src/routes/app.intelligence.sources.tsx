import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Database,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/sources")({
  component: Sources,
});

const dataSources = [
  { id: 1, name: "Salesforce CRM", type: "CRM", status: "connected", lastSync: "5 min ago", records: "45,234", health: "good" },
  { id: 2, name: "Stripe Payments", type: "Payments", status: "connected", lastSync: "2 min ago", records: "128,456", health: "good" },
  { id: 3, name: "PostgreSQL Database", type: "Database", status: "connected", lastSync: "1 min ago", records: "892,123", health: "good" },
  { id: 4, name: "Google Analytics", type: "Analytics", status: "connected", lastSync: "10 min ago", records: "1.2M", health: "warning" },
  { id: 5, name: "HubSpot Marketing", type: "Marketing", status: "disconnected", lastSync: "3 days ago", records: "0", health: "error" },
  { id: 6, name: "Zendesk Support", type: "Support", status: "connected", lastSync: "5 min ago", records: "34,567", health: "good" },
  { id: 7, name: "Snowflake Warehouse", type: "Warehouse", status: "connected", lastSync: "30 min ago", records: "2.4M", health: "good" },
  { id: 8, name: "Mixpanel Events", type: "Analytics", status: "connected", lastSync: "2 min ago", records: "5.6M", health: "good" },
];

const stats = [
  { label: "Total Sources", value: dataSources.length, icon: Database },
  { label: "Connected", value: dataSources.filter(s => s.status === "connected").length, icon: CheckCircle2 },
  { label: "Total Records", value: "10.4M", icon: Database },
  { label: "Sync Errors", value: "1", icon: AlertCircle },
];

function Sources() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Source Connections</h2>
          <p className="text-sm text-muted-foreground">
            Manage connections to your data warehouses and integrations
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <RefreshCw className="h-4 w-4" />
            Sync All
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Source
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Sources */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="space-y-4">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  source.health === "error" ? "border-red-500/30 bg-red-500/5" :
                  source.health === "warning" ? "border-amber-500/30" :
                  "border-border/40"
                }`}
              >
                <div className={`p-3 rounded-lg ${
                  source.status === "connected" ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <Database className={`h-6 w-6 ${
                    source.status === "connected" ? "text-green-500" : "text-red-500"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{source.name}</p>
                    <span className="px-2 py-0.5 rounded bg-muted text-xs">{source.type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      source.status === "connected" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    }`}>
                      {source.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last sync: {source.lastSync}
                    </span>
                    <span>{source.records} records</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {source.health === "good" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {source.health === "warning" && (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                  {source.health === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Settings">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
