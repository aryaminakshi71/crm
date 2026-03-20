import { createFileRoute } from "@tanstack/react-router";
import {
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
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/settings")({
  component: SettingsPage,
});

function SettingsPage() {
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
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                <Settings className="h-4 w-4" />
                General
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
                <Webhook className="h-4 w-4" />
                Webhooks
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
                <Bell className="h-4 w-4" />
                Notifications
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
                <Key className="h-4 w-4" />
                Access Tokens
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
                <Globe className="h-4 w-4" />
                Environments
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
                <Server className="h-4 w-4" />
                Runners
              </button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Default Branch</label>
                  <select className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm">
                    <option value="main">main</option>
                    <option value="master">master</option>
                    <option value="develop">develop</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Pipeline Concurrency</label>
                  <input
                    type="number"
                    defaultValue="4"
                    className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum parallel pipeline runs</p>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">Auto-cancel outdated runs</p>
                    <p className="text-xs text-muted-foreground">Cancel previous runs when new commit is pushed</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">Require approval for production</p>
                    <p className="text-xs text-muted-foreground">Manual approval before deploying to production</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">Email on pipeline failure</p>
                    <p className="text-xs text-muted-foreground">Send email when a pipeline fails</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">Slack notifications</p>
                    <p className="text-xs text-muted-foreground">Post updates to Slack channel</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">Deployment webhooks</p>
                    <p className="text-xs text-muted-foreground">Trigger external services on deployment</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
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
        </div>
      </div>
    </div>
  );
}
