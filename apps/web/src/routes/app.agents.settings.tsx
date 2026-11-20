import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Settings,
  Key,
  Shield,
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
  Loader2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agents/settings")({
  component: SettingsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

// API keys fetched from the API

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
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

  // GET /api/api-keys
  const { data: apiKeysData, isLoading: apiKeysLoading, isError, refetch} = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api-keys`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json() as Promise<{
        data: Array<{
          id: string;
          name: string;
          keyPrefix: string;
          createdAt: string;
          lastUsedAt: string | null;
          expiresAt: string | null;
          isActive: boolean;
        }>;
      }>;
    },
  });

  // POST /api/api-keys — create new API key
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API_BASE}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? "Failed to create API key");
      }
      return res.json() as Promise<{ id: string; name: string; key: string; keyPrefix: string }>;
    },
    onSuccess: (data) => {
      toast.success(`API key created. Copy it now — it won't be shown again.`, {
        description: data.key,
        duration: 15000,
      });
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // DELETE /api/api-keys/:id
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api-keys/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to delete API key");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("API key deleted");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const apiKeys = apiKeysData?.data ?? [];

  const handleCopy = (keyId: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate(newKeyName.trim());
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
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
                    onClick={() =>
                      setSettings({
                        ...settings,
                        [feature.key]: !settings[feature.key as keyof typeof settings],
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings[feature.key as keyof typeof settings] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings[feature.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
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
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeysLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
                  ))}
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div key={key.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{key.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(key.id, key.keyPrefix)}
                        >
                          {copiedKey === key.id ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          disabled={deleteKeyMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <code className="text-xs text-muted-foreground">{key.keyPrefix}</code>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>
                        Created:{" "}
                        {typeof key.createdAt === "string" && key.createdAt.length > 10
                          ? new Date(key.createdAt).toLocaleDateString()
                          : key.createdAt}
                      </span>
                      <span>{key.lastUsedAt ? String(key.lastUsedAt) : "Never used"}</span>
                    </div>
                  </div>
                ))
              )}

              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Key name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim() || createKeyMutation.isPending}
                >
                  {createKeyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
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
