import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Box,
  Plus,
  Search,
  Settings,
  Activity,
  CheckCircle2,
  AlertCircle,
  Play,
  Trash2,
  Clock,
  Zap,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/serverless")({
  component: Serverless,
});

const functions = [
  { id: 1, name: "user-auth", runtime: "Node.js 18", status: "active", invocations: 15420, errors: 2, latency: "45ms", memory: "256MB", lastInvoked: "2 min ago" },
  { id: 2, name: "image-processor", runtime: "Python 3.11", status: "active", invocations: 8921, errors: 12, latency: "234ms", memory: "512MB", lastInvoked: "5 min ago" },
  { id: 3, name: "payment-handler", runtime: "Node.js 18", status: "active", invocations: 3421, errors: 0, latency: "123ms", memory: "512MB", lastInvoked: "12 min ago" },
  { id: 4, name: "email-sender", runtime: "Node.js 18", status: "active", invocations: 12453, errors: 8, latency: "89ms", memory: "128MB", lastInvoked: "1 min ago" },
  { id: 5, name: "data-aggregator", runtime: "Python 3.11", status: "warning", invocations: 2341, errors: 45, latency: "1.2s", memory: "1024MB", lastInvoked: "30 min ago" },
  { id: 6, name: "webhook-processor", runtime: "Node.js 18", status: "active", invocations: 45231, errors: 3, latency: "67ms", memory: "128MB", lastInvoked: "30 sec ago" },
];

function Serverless() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Serverless Functions</h2>
          <p className="text-sm text-muted-foreground">
            Deploy and manage serverless functions
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Function
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Box className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">6</p>
            <p className="text-xs text-muted-foreground">Total Functions</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Activity className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">86.2K</p>
            <p className="text-xs text-muted-foreground">Total Invocations</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">99.9%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">112ms</p>
            <p className="text-xs text-muted-foreground">Avg Latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search functions..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Runtimes</option>
          <option value="node">Node.js</option>
          <option value="python">Python</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="warning">Warning</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Functions List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Function</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Runtime</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Invocations</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Errors</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Latency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Memory</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Invoked</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {functions.map((func) => (
                <tr key={func.id} className={`border-b border-border/40 hover:bg-muted/20 ${
                  func.status === "warning" ? "bg-amber-500/5" : ""
                }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium">{func.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{func.runtime}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      func.status === "active" ? "bg-green-500/10 text-green-500" :
                      func.status === "warning" ? "bg-amber-500/10 text-amber-500" :
                      "bg-muted/10 text-muted-foreground"
                    }`}>
                      {func.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{func.invocations.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${
                      func.errors > 10 ? "text-red-500" :
                      func.errors > 0 ? "text-amber-500" :
                      "text-green-500"
                    }`}>
                      {func.errors}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{func.latency}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{func.memory}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{func.lastInvoked}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-muted" title="Test">
                        <Play className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted" title="Delete">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
