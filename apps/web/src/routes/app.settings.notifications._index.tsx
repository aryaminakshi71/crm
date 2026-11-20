/**
 * Settings — Notification Preferences
 *
 * Per-channel per-event notification toggles for the current user.
 */

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Loading } from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Bell, Save, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  group: z.enum(["emailNotifications", "inAppNotifications", "pushNotifications"]).optional(),
});

export const Route = createFileRoute("/app/settings/notifications/_index")({
  validateSearch: searchSchema,
  component: NotificationsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return {
    ...(orgId ? { "x-organization-id": orgId } : {}),
    "Content-Type": "application/json",
  };
}

type Channel = "email" | "inApp" | "push";

interface EventPrefs {
  email: boolean;
  inApp: boolean;
  push: boolean;
}

interface PrefsGroup {
  [eventKey: string]: EventPrefs;
}

interface AllPrefs {
  emailNotifications: PrefsGroup;
  inAppNotifications: PrefsGroup;
  pushNotifications: PrefsGroup;
}

const NOTIFICATION_EVENTS = [
  { key: "newTicket", label: "New Ticket", desc: "When a support ticket is created" },
  { key: "ticketAssigned", label: "Ticket Assigned", desc: "When a ticket is assigned to you" },
  { key: "ticketResolved", label: "Ticket Resolved", desc: "When a ticket is marked resolved" },
  { key: "newInvoice", label: "New Invoice", desc: "When an invoice is generated" },
  { key: "paymentReceived", label: "Payment Received", desc: "When a payment is recorded" },
  { key: "newLead", label: "New Lead", desc: "When a new lead enters the pipeline" },
  { key: "dealWon", label: "Deal Won", desc: "When a deal is marked as won" },
  { key: "dealLost", label: "Deal Lost", desc: "When a deal is marked as lost" },
  { key: "systemAlerts", label: "System Alerts", desc: "Critical system and security alerts" },
  { key: "weeklyReport", label: "Weekly Report", desc: "Weekly performance digest" },
];

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "inApp", label: "In-App" },
  { id: "push", label: "Push" },
];

const DEFAULT_PREFS: AllPrefs = {
  emailNotifications: Object.fromEntries(
    NOTIFICATION_EVENTS.map((e) => [e.key, { email: true, inApp: true, push: false }]),
  ),
  inAppNotifications: Object.fromEntries(
    NOTIFICATION_EVENTS.map((e) => [e.key, { email: true, inApp: true, push: false }]),
  ),
  pushNotifications: Object.fromEntries(
    NOTIFICATION_EVENTS.map((e) => [e.key, { email: false, inApp: false, push: false }]),
  ),
};

const GROUP_CONFIG: { id: keyof AllPrefs; label: string; desc: string }[] = [
  {
    id: "emailNotifications",
    label: "Email Notifications",
    desc: "Receive notifications via email",
  },
  {
    id: "inAppNotifications",
    label: "In-App Notifications",
    desc: "Show notifications inside the app",
  },
  {
    id: "pushNotifications",
    label: "Push Notifications",
    desc: "Browser and mobile push notifications",
  },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        on ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NotificationsPage() {
  const { q = "", group: groupFilter } = useSearch({ from: "/app/settings/notifications/_index" });
  const navigate = useNavigate({ from: "/app/settings/notifications/_index" });
  const [prefs, setPrefs] = useState<AllPrefs>(DEFAULT_PREFS);

  const { data, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/user/notification-preferences`, {
        headers: getOrgHeader(),
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    const loaded: any = (data as any)?.data ?? data;
    if (loaded && typeof loaded === "object") {
      setPrefs((prev) => ({ ...prev, ...loaded }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AllPrefs) => {
      const res = await fetch(`${API_BASE}/user/notification-preferences`, {
        method: "PATCH",
        headers: getOrgHeader(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => toast.success("Notification preferences saved"),
    onError: () => toast.error("Failed to save preferences"),
  });

  function toggle(group: keyof AllPrefs, eventKey: string, channel: Channel) {
    setPrefs((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [eventKey]: {
          ...prev[group][eventKey],
          [channel]: !prev[group][eventKey]?.[channel],
        },
      },
    }));
  }

  const filteredEvents = NOTIFICATION_EVENTS.filter(
    (evt) => !q || evt.label.toLowerCase().includes(q.toLowerCase()) || evt.desc.toLowerCase().includes(q.toLowerCase()),
  );
  const visibleGroups = groupFilter ? GROUP_CONFIG.filter((g) => g.id === groupFilter) : GROUP_CONFIG;

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Choose how and when you receive notifications for each event type
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search notification events..."
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
          />
        </div>
        <select
          value={groupFilter ?? ""}
          onChange={(e) =>
            navigate({ search: (prev) => ({ ...prev, group: (e.target.value as typeof groupFilter) || undefined }) })
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All channels</option>
          <option value="emailNotifications">Email</option>
          <option value="inAppNotifications">In-App</option>
          <option value="pushNotifications">Push</option>
        </select>
      </div>

      {visibleGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              {group.label}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{group.desc}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(3,80px)] gap-2 pb-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Event</span>
                {CHANNELS.map((ch) => (
                  <span key={ch.id} className="text-center">
                    {ch.label}
                  </span>
                ))}
              </div>

              {/* Event rows */}
              <div className="space-y-1 mt-2">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.key}
                    className="grid grid-cols-[1fr_repeat(3,80px)] gap-2 items-center py-2 rounded-md hover:bg-muted/30 px-1 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{evt.label}</p>
                      <p className="text-xs text-muted-foreground">{evt.desc}</p>
                    </div>
                    {CHANNELS.map((ch) => (
                      <div key={ch.id} className="flex justify-center">
                        <Toggle
                          on={prefs[group.id]?.[evt.key]?.[ch.id] ?? false}
                          onToggle={() => toggle(group.id, evt.key, ch.id)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          className="gap-1.5"
          onClick={() => saveMutation.mutate(prefs)}
          disabled={saveMutation.isPending}
        >
          <Save className="h-3.5 w-3.5" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
