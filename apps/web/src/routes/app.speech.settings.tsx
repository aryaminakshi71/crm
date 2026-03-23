import { Button, Card, CardContent, Input, Select } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Globe,
  Shield,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/speech/settings")({
  component: SettingsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const DEFAULT_MODELS = [
  { id: "nova-2", name: "Nova 2 (Default)" },
  { id: "nova", name: "Nova" },
  { id: "enhanced", name: "Enhanced" },
  { id: "base", name: "Base" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    defaultLanguage: "en",
    audioQuality: "high",
    autoPunctuate: true,
    profanityFilter: false,
    timestamps: true,
    speakerLabels: true,
    sentimentAnalysis: true,
    maxFileSize: "500",
    defaultModel: "nova-2",
  });

  const { data: modelsData, isError, refetch} = useQuery({
    queryKey: ["speech", "models"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/speech/models`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const models = modelsData?.data?.length
    ? modelsData.data.map((m: any) => ({ id: m.id ?? m.modelId, name: m.name ?? m.displayName ?? m.id }))
    : DEFAULT_MODELS;

  const handleSave = () => {
    toast.success("Settings saved!");
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
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Speech Settings</h2>
            <p className="text-muted-foreground text-sm">Configure your speech-to-text preferences</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Language Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Default Language</label>
                <Select
                  value={settings.defaultLanguage}
                  onValueChange={(v) => setSettings({ ...settings, defaultLanguage: v })}
                  className="w-full"
                >
                  <option value="en">English (US)</option>
                  <option value="en-uk">English (UK)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Transcription Model</label>
                <Select
                  value={settings.defaultModel}
                  onValueChange={(v) => setSettings({ ...settings, defaultModel: v })}
                  className="w-full"
                >
                  {models.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Audio Quality</label>
                <Select
                  value={settings.audioQuality}
                  onValueChange={(v) => setSettings({ ...settings, audioQuality: v })}
                  className="w-full"
                >
                  <option value="standard">Standard (64 kbps)</option>
                  <option value="high">High (128 kbps)</option>
                  <option value="lossless">Lossless (256 kbps)</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Max File Size (MB)</label>
                <Input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Privacy & Security</h3>
            </div>

            <div className="space-y-3">
              {[
                { key: "profanityFilter", label: "Profanity Filter", description: "Replace profanity with asterisks" },
                { key: "autoPunctuate", label: "Auto Punctuation", description: "Automatically add punctuation" },
                { key: "timestamps", label: "Timestamps", description: "Include timestamps in transcripts" },
                { key: "speakerLabels", label: "Speaker Labels", description: "Identify different speakers" },
                { key: "sentimentAnalysis", label: "Sentiment Analysis", description: "Analyze emotional tone" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings[item.key as keyof typeof settings] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
