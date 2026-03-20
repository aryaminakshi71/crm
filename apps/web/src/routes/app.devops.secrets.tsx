import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Key,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Lock,
  Clock,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/secrets")({
  component: Secrets,
});

const secrets = [
  { id: 1, name: "DATABASE_URL", type: "env", environment: "production", lastRotated: "Mar 15, 2026", createdBy: "John Smith", accessCount: 45 },
  { id: 2, name: "API_SECRET_KEY", type: "env", environment: "production", lastRotated: "Mar 10, 2026", createdBy: "Jane Doe", accessCount: 123 },
  { id: 3, name: "STRIPE_API_KEY", type: "api", environment: "production", lastRotated: "Feb 28, 2026", createdBy: "John Smith", accessCount: 89 },
  { id: 4, name: "SENDGRID_API_KEY", type: "api", environment: "production", lastRotated: "Mar 5, 2026", createdBy: "Mike Wilson", accessCount: 34 },
  { id: 5, name: "JWT_SECRET", type: "env", environment: "staging", lastRotated: "Mar 1, 2026", createdBy: "Sarah Johnson", accessCount: 12 },
  { id: 6, name: "AWS_ACCESS_KEY", type: "cloud", environment: "production", lastRotated: "Feb 20, 2026", createdBy: "Tom Brown", accessCount: 67 },
  { id: 7, name: "REDIS_PASSWORD", type: "env", environment: "production", lastRotated: "Mar 12, 2026", createdBy: "Lisa Chen", accessCount: 56 },
  { id: 8, name: "TWILIO_AUTH_TOKEN", type: "api", environment: "production", lastRotated: "Mar 8, 2026", createdBy: "John Smith", accessCount: 23 },
];

function Secrets() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Secrets Management</h2>
          <p className="text-sm text-muted-foreground">
            Securely manage API keys, passwords, and sensitive data
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Lock className="h-4 w-4" />
            Vault Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Secret
          </button>
        </div>
      </div>

      {/* Security Alert */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-foreground">Security Recommendation</p>
              <p className="text-xs text-muted-foreground">
                3 secrets haven't been rotated in over 30 days. Consider rotating them for better security.
              </p>
            </div>
            <button className="ml-auto px-3 py-1 rounded-lg bg-amber-500/20 text-amber-500 text-xs font-medium hover:bg-amber-500/30 transition-colors">
              View All
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Key className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{secrets.length}</p>
            <p className="text-xs text-muted-foreground">Total Secrets</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Lock className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Environments</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Rotations This Month</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Needs Rotation</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search secrets..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="env">Environment Variable</option>
          <option value="api">API Key</option>
          <option value="cloud">Cloud Credential</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Environments</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
      </div>

      {/* Secrets List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Environment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Rotated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Access Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret) => (
                <tr key={secret.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      <span className="font-medium font-mono">{secret.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-muted text-xs capitalize">
                      {secret.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      secret.environment === "production" ? "bg-red-500/10 text-red-500" :
                      secret.environment === "staging" ? "bg-blue-500/10 text-blue-500" :
                      "bg-green-500/10 text-green-500"
                    }`}>
                      {secret.environment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{secret.lastRotated}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{secret.accessCount}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{secret.createdBy}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-muted" title="Reveal">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted" title="Copy">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted" title="Rotate">
                        <Clock className="h-4 w-4 text-muted-foreground" />
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
