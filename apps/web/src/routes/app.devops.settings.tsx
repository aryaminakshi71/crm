import { createFileRoute } from "@tanstack/react-router";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  Settings,
  Bell,
  Key,
  Globe,
  Server,
  Webhook,
  Save,
  AlertCircle
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/devops/settings")({
  component: SettingsPage,
});

interface DevOpsSettings {
  defaultBranch: string;
  pipelineConcurrency: number;
  autoCancelOutdated: boolean;
  requireApprovalForProduction: boolean;
  emailOnFailure: boolean;
  slackNotifications: boolean;
  deploymentWebhooks: boolean;
}

const DEFAULT_SETTINGS: DevOpsSettings = {
  defaultBranch: "main",
  pipelineConcurrency: 4,
  autoCancelOutdated: true,
  requireApprovalForProduction: true,
  emailOnFailure: true,
  slackNotifications: true,
  deploymentWebhooks: false,
};

function SettingsPage() {
  const [form, setForm] = useState<DevOpsSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState("general");

  // Load existing org settings (preferences key: devops)
  const { data: orgSettings, isError, refetch} = useQuery({
    queryKey: ["org-settings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/settings/organization`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return null;
      return res.json() as Promise<any>;
    },
  });

  useEffect(() => {
    if ((orgSettings as any)?.preferences?.devops) {
      setForm((prev) => ({
        ...prev,
        ...((orgSettings as any).preferences.devops as Partial<DevOpsSettings>),
      }));
    }
  }, [orgSettings]);

  const saveSettings = useMutation({
    mutationFn: async (settings: DevOpsSettings) => {
      const existingPrefs = (orgSettings as any)?.preferences ?? {};
      const res = await fetch(`${API_BASE}/v1/settings/organization`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          preferences: { ...existingPrefs, devops: settings },
        }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("DevOps settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save settings");
    },
  });

  const handleSave = () => {
    saveSettings.mutate(form);
  };

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "tokens", label: "Access Tokens", icon: Key },
    { id: "environments", label: "Environments", icon: Globe },
    { id: "runners", label: "Runners", icon: Server },
  ];

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">DevOps Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure CI/CD settings, integrations, and notifications
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveSettings.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saveSettings.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          {activeSection === "general" && (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Default Branch</label>
                    <select
                      value={form.defaultBranch}
                      onChange={(e) => setForm((f) => ({ ...f, defaultBranch: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm"
                    >
                      <option value="main">main</option>
                      <option value="master">master</option>
                      <option value="develop">develop</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Pipeline Concurrency</label>
                    <input
                      type="number"
                      value={form.pipelineConcurrency}
                      onChange={(e) => setForm((f) => ({ ...f, pipelineConcurrency: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum parallel pipeline runs</p>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">Auto-cancel outdated runs</p>
                      <p className="text-xs text-muted-foreground">Cancel previous runs when new commit is pushed</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.autoCancelOutdated}
                      onChange={(e) => setForm((f) => ({ ...f, autoCancelOutdated: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">Require approval for production</p>
                      <p className="text-xs text-muted-foreground">Manual approval before deploying to production</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.requireApprovalForProduction}
                      onChange={(e) => setForm((f) => ({ ...f, requireApprovalForProduction: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeSection === "notifications" && (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">Email on pipeline failure</p>
                      <p className="text-xs text-muted-foreground">Send email when a pipeline fails</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.emailOnFailure}
                      onChange={(e) => setForm((f) => ({ ...f, emailOnFailure: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">Slack notifications</p>
                      <p className="text-xs text-muted-foreground">Post updates to Slack channel</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.slackNotifications}
                      onChange={(e) => setForm((f) => ({ ...f, slackNotifications: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">Deployment webhooks</p>
                      <p className="text-xs text-muted-foreground">Trigger external services on deployment</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.deploymentWebhooks}
                      onChange={(e) => setForm((f) => ({ ...f, deploymentWebhooks: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webhook Configuration */}
          {activeSection === "webhooks" && (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">Webhooks</h3>
                  <button className="text-xs text-primary hover:underline">Add Webhook</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                    <div className="flex items-center gap-3">
                      <Webhook className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Production Deploy Webhook</p>
                        <p className="text-xs text-muted-foreground font-mono">https://api.example.com/webhooks/deploy</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-500/10 text-green-500 px-2 py-1 text-xs">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                    <div className="flex items-center gap-3">
                      <Webhook className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Slack Integration</p>
                        <p className="text-xs text-muted-foreground font-mono">https://hooks.slack.com/services/xxx</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-500/10 text-green-500 px-2 py-1 text-xs">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Placeholder for other sections */}
          {!["general", "notifications", "webhooks"].includes(activeSection) && (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-2 capitalize">{activeSection.replace("-", " ")}</h3>
                <p className="text-sm text-muted-foreground">Configuration for this section will be available soon.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
