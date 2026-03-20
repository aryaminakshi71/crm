import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Settings,
  Key,
  Shield,
  Bell,
  Users,
  Globe,
  Clock,
  Database,
  Lock,
  Eye,
  Save,
  Copy,
  CheckCircle,
  Trash2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/settings")({
  component: SettingsPage,
});

const API_KEYS = [
  { id: "key-1", name: "Production API Key", prefix: "sk-agent-prod-xxxx", created: "Jan 15, 2024", lastUsed: "2 min ago" },
  { id: "key-2", name: "Development API Key", prefix: "sk-agent-dev-xxxx", created: "Feb 20, 2024", lastUsed: "1 hour ago" },
  { id: "key-3", name: "Testing API Key", prefix: "sk-agent-test-xxxx", created: "Mar 1, 2024", lastUsed: "3 days ago" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    defaultModel: "gpt-4-turbo",
    maxConcurrentAgents: "10",
    requestTimeout: "60",
    enableStreaming: true,
    enableMemory: true,
    enableAnalytics: true,
    ipWhitelist: "",
    rateLimitRequests: "1000",
    rateLimitWindow: "60",
  });

  const handleCopy = (keyId: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Agent Settings</h2>
            <p className="text-muted-foreground text-sm">Configure global settings for all agents</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Save className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default AI Model</label>
                  <Select
                    value={settings.defaultModel}
                    onValueChange={(v) => setSettings({ ...settings, defaultModel: v })}
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Concurrent Agents</label>
                  <Input
                    type="number"
                    value={settings.maxConcurrentAgents}
                    onChange={(e) => setSettings({ ...settings, maxConcurrentAgents: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Request Timeout (seconds)</label>
                  <Input
                    type="number"
                    value={settings.requestTimeout}
                    onChange={(e) => setSettings({ ...settings, requestTimeout: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate Limit (requests)</label>
                  <Input
                    type="number"
                    value={settings.rateLimitRequests}
                    onChange={(e) => setSettings({ ...settings, rateLimitRequests: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "enableStreaming", label: "Streaming Responses", description: "Allow agents to stream responses in real-time" },
                { key: "enableMemory", label: "Agent Memory", description: "Enable persistent memory across conversations" },
                { key: "enableAnalytics", label: "Usage Analytics", description: "Collect and display usage analytics" },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{feature.label}</p>
                      <p className="text-muted-foreground text-xs">{feature.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [feature.key]: !settings[feature.key as keyof typeof settings] })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings[feature.key as keyof typeof settings] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings[feature.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">IP Whitelist</label>
                <Input
                  placeholder="Comma-separated IP addresses (leave empty for all)"
                  value={settings.ipWhitelist}
                  onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                />
                <p className="text-muted-foreground text-xs">Restrict API access to specific IP addresses</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm text-amber-800">Audit Logging</p>
                  <p className="text-muted-foreground text-xs text-amber-700">
                    All agent interactions are logged for security and compliance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* API Keys */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" /> API Keys
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {API_KEYS.map((key) => (
                <div key={key.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{key.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(key.id, key.prefix)}
                    >
                      {copiedKey === key.id ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <code className="text-xs text-muted-foreground">{key.prefix}</code>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>Created: {key.created}</span>
                    <span>{key.lastUsed}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" leftIcon={<Plus className="h-4 w-4" />}>
                Create New Key
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Data Retention: 90 days</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">API Rate Limit: 1000/min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Encryption: AES-256</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Audit Logs: Enabled</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
