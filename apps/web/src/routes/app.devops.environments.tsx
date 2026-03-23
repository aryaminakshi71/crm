import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  Globe,
  Plus,
  Settings,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Server,
  Activity,
  ExternalLink,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/devops/environments")({
  component: Environments,
});

const ENV_COLORS: Record<string, string> = {
  production: "red",
  staging: "blue",
  development: "green",
  qa: "purple",
};

function Environments() {
  const queryClient = useQueryClient();

  const { data: environments, isLoading, isError, refetch } = useQuery({
    queryKey: ["devops", "environments"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/devops/environments`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch environments");
      return res.json();
    },
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <button onClick={() => refetch()} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Retry</button>
    </div>
  );

  const envList: any[] = Array.isArray(environments) ? environments : (environments?.data ?? []);

  // Helper to get color class based on env name or type
  const getColor = (env: any) => ENV_COLORS[env.name?.toLowerCase()] || ENV_COLORS[env.type?.toLowerCase()] || "gray";

  const colorClasses: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    red:    { border: "border-red-500/30",    bg: "bg-red-500/10",    text: "text-red-500",    icon: "text-red-500" },
    blue:   { border: "border-blue-500/30",   bg: "bg-blue-500/10",   text: "text-blue-500",   icon: "text-blue-500" },
    green:  { border: "border-green-500/30",  bg: "bg-green-500/10",  text: "text-green-500",  icon: "text-green-500" },
    purple: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-500", icon: "text-purple-500" },
    gray:   { border: "border-border/60",     bg: "bg-muted/30",      text: "text-muted-foreground", icon: "text-muted-foreground" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Environment Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage deployment environments and configurations
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Environment
        </button>
      </div>

      {/* Environments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : envList.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No environments configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {envList.map((env: any) => {
            const color = getColor(env);
            const colors = colorClasses[color] || colorClasses.gray;
            return (
              <Card key={env.id} className={`${colors.border} hover:border-primary/30 transition-colors`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Globe className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground capitalize">{env.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            env.status === "healthy" || env.isDefault
                              ? "bg-green-500/10 text-green-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {env.isDefault ? "default" : (env.status || env.type || "active")}
                          </span>
                        </div>
                        {env.url ? (
                          <a href={`https://${env.url}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            {env.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground capitalize">{env.type || "environment"}</p>
                        )}
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <Activity className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm font-bold capitalize">{env.type || "env"}</p>
                      <p className="text-xs text-muted-foreground">Type</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <Server className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm font-bold">
                        {env.variables ? Object.keys(env.variables).length : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Variables</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      {env.autoDeploy ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      )}
                      <p className="text-sm font-bold">{env.autoDeploy ? "On" : "Off"}</p>
                      <p className="text-xs text-muted-foreground">Auto Deploy</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <span className="text-sm text-muted-foreground">
                      {env.updatedAt
                        ? `Updated ${new Date(env.updatedAt).toLocaleDateString()}`
                        : `Created ${new Date(env.createdAt).toLocaleDateString()}`}
                    </span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                        View Logs
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                        Deploy
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
