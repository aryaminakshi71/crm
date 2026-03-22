/**
 * New Alert Rule
 *
 * Create a new alert rule for monitoring.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Mail,
  MessageSquare,
  Plus,
  Slack,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/monitoring/alerts/new")({
  component: NewAlertPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const metricOptions = [
  { value: "cpu", label: "CPU Usage", icon: Cpu },
  { value: "memory", label: "Memory Usage", icon: HardDrive },
  { value: "error_rate", label: "Error Rate", icon: Zap },
  { value: "latency", label: "Response Latency", icon: Globe },
  { value: "disk", label: "Disk Usage", icon: Database },
  { value: "requests", label: "Request Count", icon: Globe },
];

const channelOptions = [
  { value: "email", label: "Email", icon: Mail },
  { value: "slack", label: "Slack", icon: Slack },
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "sms", label: "SMS", icon: MessageSquare },
];

function NewAlertPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [alertName, setAlertName] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("");
  const [condition, setCondition] = useState("<");
  const [threshold, setThreshold] = useState("");
  const [duration, setDuration] = useState("5");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email"]);
  const [severity, setSeverity] = useState("warning");

  const createAlertMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      metric: string;
      condition: string;
      threshold: number;
      duration: number;
      severity: "info" | "warning" | "critical";
      channels: string[];
    }) => {
      const res = await fetch(`${API_BASE}/monitoring/alerts`, {
        method: "POST",
        headers: getOrgHeader(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-alerts"] });
      navigate({ to: "/app/monitoring/alerts" });
    },
  });

  const handleCreate = () => {
    if (!alertName || !selectedMetric || !threshold) return;
    createAlertMutation.mutate({
      name: alertName,
      metric: selectedMetric,
      condition,
      threshold: parseFloat(threshold),
      duration: parseInt(duration, 10),
      severity: severity as "info" | "warning" | "critical",
      channels: selectedChannels,
    });
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/app/monitoring/alerts">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Create Alert Rule</h1>
          <p className="text-sm text-muted-foreground">
            Set up automated alerts for your infrastructure
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Alert Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Alert Name
                </label>
                <Input
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  placeholder="High CPU Alert"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Description (optional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Alert when CPU usage exceeds 80% for 5 minutes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Metric
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {metricOptions.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <button
                        key={metric.value}
                        onClick={() => setSelectedMetric(metric.value)}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                          selectedMetric === metric.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {metric.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <option value=">">Greater than (&gt;)</option>
                    <option value="<">Less than (&lt;)</option>
                    <option value=">=">Greater or equal (&gt;=)</option>
                    <option value="<=">Less or equal (&lt;=)</option>
                    <option value="==">Equals (=)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Threshold
                  </label>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Duration (min)
                  </label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Notification Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {channelOptions.map((channel) => {
                  const Icon = channel.icon;
                  const isSelected = selectedChannels.includes(channel.value);
                  return (
                    <button
                      key={channel.value}
                      onClick={() => toggleChannel(channel.value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {channel.label}
                    </button>
                  );
                })}
              </div>

              {selectedChannels.includes("email") && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Email Recipients
                  </label>
                  <Input placeholder="team@example.com, ops@example.com" />
                </div>
              )}

              {selectedChannels.includes("slack") && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Slack Channel
                  </label>
                  <Input placeholder="#alerts" />
                </div>
              )}

              {selectedChannels.includes("webhook") && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Webhook URL
                  </label>
                  <Input placeholder="https://hooks.example.com/alerts" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Severity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Severity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { value: "info", label: "Info", color: "text-blue-400" },
                { value: "warning", label: "Warning", color: "text-amber-400" },
                { value: "critical", label: "Critical", color: "text-red-400" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value)}
                  className={`w-full flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                    severity === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${option.color} ${severity === option.value ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`} />
                  <span className={severity === option.value ? "text-primary font-medium" : "text-muted-foreground"}>
                    {option.label}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Alert Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-amber-400" />
                  <span className="font-medium text-sm">{alertName || "Alert Name"}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  When <span className="font-medium text-foreground">{selectedMetric || "metric"}</span> is{" "}
                  <span className="font-medium text-foreground">{condition}</span>{" "}
                  <span className="font-medium text-foreground">{threshold || "?"}</span> for{" "}
                  <span className="font-medium text-foreground">{duration}</span> minutes
                </p>
                <div className="flex items-center gap-1">
                  {selectedChannels.map((ch) => (
                    <Badge key={ch} variant="outline" size="sm" className="capitalize">
                      {ch}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full"
              disabled={!alertName || !selectedMetric || !threshold || createAlertMutation.isPending}
              onClick={handleCreate}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {createAlertMutation.isPending ? "Creating…" : "Create Alert"}
            </Button>
            {createAlertMutation.isError && (
              <p className="text-xs text-red-500 text-center">
                Failed to create alert. Please try again.
              </p>
            )}
            <Link to="/app/monitoring/alerts">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
