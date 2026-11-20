/**
 * Settings Index
 *
 * General, security, notifications, billing, and API key management.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CreditCard,
  Key,
  Lock,
  Save,
  Shield,
  User,
  Users2,
  Monitor,
  Smartphone,
  MapPin,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings/_index")({
  component: SettingsPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const MOCK_SESSIONS = [
  { id: "s1", device: "Chrome on macOS", ip: "192.168.1.1", location: "San Francisco, US", lastActive: new Date().toISOString(), current: true },
  { id: "s2", device: "Safari on iPhone", ip: "10.0.0.2", location: "San Francisco, US", lastActive: new Date(Date.now() - 3600000).toISOString(), current: false },
  { id: "s3", device: "Firefox on Windows", ip: "203.45.67.89", location: "New York, US", lastActive: new Date(Date.now() - 86400000).toISOString(), current: false },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

const TABS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const NOTIFICATION_EVENTS = [
  { key: "newLead", label: "New Lead", desc: "When a new lead is created" },
  { key: "dealClosed", label: "Deal Closed", desc: "When a deal is marked as closed" },
  { key: "invoicePaid", label: "Invoice Paid", desc: "When an invoice is paid" },
  { key: "ticketCreated", label: "Ticket Created", desc: "When a new support ticket arrives" },
  { key: "jobCompleted", label: "Job Completed", desc: "When a field service job completes" },
];

function SettingsPage() {
  const [tab, setTab] = useState("general");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: () =>
      fetch("/api/v1/organization-settings", { headers: orgHeader() }).then((r) => r.json()),
    placeholderData: (prev) => prev,
  });

  const settings: any = (data as any)?.data ?? data ?? {};

  // General form state
  const [orgName, setOrgName] = useState<string>(settings.name ?? settings.orgName ?? "");
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl ?? "");
  const [timezone, setTimezone] = useState<string>(settings.timezone ?? "UTC");
  const [language, setLanguage] = useState<string>(settings.language ?? "en");
  const [currency, setCurrency] = useState<string>(settings.currency ?? "USD");

  // Notification state
  const [notifState, setNotifState] = useState<Record<string, { email: boolean; sms: boolean; push: boolean }>>(
    settings.notifications ?? {},
  );

  // Security state
  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean>(settings.twoFaEnabled ?? false);
  const [sessionTimeout, setSessionTimeout] = useState<string>(String(settings.sessionTimeout ?? "24"));

  // Active sessions
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: () =>
      fetch("/api/v1/user/sessions", { headers: orgHeader() })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .catch(() => ({ data: [] })),
    enabled: tab === "security",
    placeholderData: (prev) => prev,
  });

  const sessions: any[] = (sessionsData as any)?.data ?? [];

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/v1/user/sessions/${sessionId}`, {
        method: "DELETE",
        headers: orgHeader(),
      });
      if (!res.ok) throw new Error("Revoke failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Session revoked");
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: () => toast.error("Failed to revoke session"),
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/user/sessions/all", {
        method: "DELETE",
        headers: orgHeader(),
      });
      if (!res.ok) throw new Error("Revoke all failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("All other sessions revoked");
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: () => toast.error("Failed to revoke sessions"),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/v1/organization-settings", {
        method: "PUT",
        headers: orgHeader(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  function toggleNotif(eventKey: string, channel: "email" | "sms" | "push") {
    setNotifState((prev) => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        [channel]: !(prev[eventKey]?.[channel] ?? false),
      },
    }));
  }

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization preferences and configuration</p>
      </div>
      {/* Quick links to dedicated sub-pages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            to: "/app/settings/profile" as any,
            icon: User,
            label: "Profile",
            desc: "Edit your personal info and password",
          },
          {
            to: "/app/settings/notifications" as any,
            icon: Bell,
            label: "Notifications",
            desc: "Configure per-channel notification prefs",
          },
          {
            to: "/app/settings/api-keys" as any,
            icon: Key,
            label: "API Keys",
            desc: "Generate and manage API keys",
          },
          {
            to: "/app/settings/organization" as any,
            icon: Building2,
            label: "Organization",
            desc: "Manage org name, logo, industry, and danger zone",
          },
          {
            to: "/app/settings/team" as any,
            icon: Users2,
            label: "Team",
            desc: "Invite members and manage roles",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors group"
            >
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
      {/* General */}
      {tab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Organization Name</label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo URL</label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo"].map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => saveMutation.mutate({ name: orgName, logoUrl, timezone, language, currency })}
              disabled={saveMutation.isPending}
            >
              <Save className="h-3.5 w-3.5" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Notifications */}
      {tab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 pb-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Event</span>
                <span className="text-center">Email</span>
                <span className="text-center">SMS</span>
                <span className="text-center">Push</span>
              </div>
              {NOTIFICATION_EVENTS.map((evt) => (
                <div key={evt.key} className="grid grid-cols-4 gap-2 items-center">
                  <div>
                    <p className="text-sm font-medium">{evt.label}</p>
                    <p className="text-xs text-muted-foreground">{evt.desc}</p>
                  </div>
                  {(["email", "sms", "push"] as const).map((ch) => (
                    <div key={ch} className="flex justify-center">
                      <button
                        onClick={() => toggleNotif(evt.key, ch)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          notifState[evt.key]?.[ch] ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            notifState[evt.key]?.[ch] ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              className="gap-1.5 mt-4"
              onClick={() => saveMutation.mutate({ notifications: notifState })}
              disabled={saveMutation.isPending}
            >
              <Save className="h-3.5 w-3.5" />
              {saveMutation.isPending ? "Saving..." : "Save Notifications"}
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Security */}
      {tab === "security" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Require 2FA for all team members</p>
                </div>
                <button
                  onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${twoFaEnabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${twoFaEnabled ? "translate-x-4" : "translate-x-1"}`} />
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Session Timeout (hours)
                </label>
                <Input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-32"
                  min="1"
                  max="720"
                />
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  saveMutation.mutate({
                    twoFaEnabled,
                    sessionTimeout: parseInt(sessionTimeout, 10),
                  })
                }
                disabled={saveMutation.isPending}
              >
                <Lock className="h-3.5 w-3.5" />
                {saveMutation.isPending ? "Saving..." : "Save Security"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  Active Sessions
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1.5"
                  onClick={() => revokeAllSessionsMutation.mutate()}
                  disabled={revokeAllSessionsMutation.isPending || sessions.filter((s) => !s.current).length === 0}
                >
                  Revoke All Other Sessions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <Loading />
              ) : (
                <div className="space-y-2">
                  {sessions.map((session: any) => {
                    const isMobile = /iphone|mobile|android/i.test(session.device ?? "");
                    const DeviceIcon = isMobile ? Smartphone : Monitor;
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{session.device}</p>
                              {session.current && (
                                <Badge variant="primary" className="text-[10px]">Current</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <span>{session.ip}</span>
                              {session.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {session.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(session.lastActive)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 shrink-0"
                          disabled={session.current || revokeSessionMutation.isPending}
                          onClick={() => revokeSessionMutation.mutate(session.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(settings.apiKeys ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No API keys generated yet.</p>
              ) : (
                <div className="space-y-2">
                  {(settings.apiKeys ?? []).map((key: any) => (
                    <div key={key.id} className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{key.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{key.prefix ?? "sk_"}...{key.last4 ?? "****"}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "—"}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5"
                onClick={() => toast.info("API key generation available via CLI")}
              >
                <Key className="h-3.5 w-3.5" />
                Generate API Key
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Billing */}
      {tab === "billing" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing & Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border">
              <div>
                <p className="font-semibold">Current Plan</p>
                <p className="text-2xl font-black text-foreground capitalize">
                  {settings.plan ?? "Pro"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {settings.planPrice ?? "$99"}/month · Renews {settings.renewsAt ? new Date(settings.renewsAt).toLocaleDateString() : "monthly"}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Usage This Month</p>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Users", used: settings.usersUsed ?? 12, limit: settings.usersLimit ?? 25 },
                  { label: "Storage", used: settings.storageUsedGb ?? 4, limit: settings.storageLimitGb ?? 10, unit: "GB" },
                  { label: "API Calls", used: settings.apiCallsUsed ?? 8420, limit: settings.apiCallsLimit ?? 50000 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{item.label}</span>
                      <span>{item.used.toLocaleString()}{item.unit ?? ""} / {item.limit.toLocaleString()}{item.unit ?? ""}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (item.used / item.limit) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => toast.info("Upgrade via your account portal")}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
