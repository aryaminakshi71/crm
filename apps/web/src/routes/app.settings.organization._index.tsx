/**
 * Settings — Organization
 *
 * Manage organization name, branding, industry, timezone, and danger-zone actions.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  Globe,
  Save,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings/organization/_index")({
  component: OrganizationSettingsPage,
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

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Construction",
  "Transportation",
  "Hospitality",
  "Media & Entertainment",
  "Non-profit",
  "Government",
  "Legal",
  "Consulting",
  "Other",
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  pro: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  starter: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  trial: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  free: "bg-gray-500/15 text-gray-600 border-gray-500/30",
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            {confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function OrganizationSettingsPage() {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["organization-detail"],
    queryFn: () =>
      fetch(`${API_BASE}/organization`, { headers: getOrgHeader() })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
  });

  const org: any = (data as any)?.data ?? data ?? {};

  // Form state — initialised from fetched data
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    if (org?.name) setName(org.name);
    if (org?.website) setWebsite(org.website);
    if (org?.industry) setIndustry(org.industry);
    if (org?.timezone) setTimezone(org.timezone);
    if (org?.logoUrl) setLogoPreview(org.logoUrl);
  }, [org?.name, org?.website, org?.industry, org?.timezone, org?.logoUrl]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/organization`, {
        method: "PATCH",
        headers: getOrgHeader(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Organization updated");
      queryClient.invalidateQueries({ queryKey: ["organization-detail"] });
    },
    onError: () => toast.error("Failed to save changes"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/organization`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Organization deleted");
      localStorage.clear();
      window.location.href = "/";
    },
    onError: () => toast.error("Failed to delete organization"),
  });

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const plan = org?.plan ?? "trial";
  const slug = org?.slug ?? org?.id ?? "—";
  const planClass = PLAN_COLORS[plan] ?? PLAN_COLORS.trial;

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 max-w-2xl">
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Organization"
        description="This will permanently delete your organization, all its data, and remove all team members. This action cannot be undone."
        confirmLabel="Delete Organization"
        onConfirm={() => { setDeleteDialogOpen(false); deleteMutation.mutate(); }}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organization</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your organization profile and settings</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${planClass}`}>
            {plan}
          </span>
          <a
            href="/app/settings/billing"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Upgrade <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── Profile ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Organization Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Org logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Logo
                </Button>
                <p className="text-[11px] text-muted-foreground">PNG, JPG or SVG. Max 2 MB.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
              </div>
            </div>
          </div>

          {/* Name + Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Organization Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Slug <span className="text-[10px] italic font-normal">(read-only)</span>
              </label>
              <Input
                value={slug}
                readOnly
                className="bg-muted/40 text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          {/* Website + Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                <Globe className="inline h-3 w-3 mr-1" />
                Website
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
                type="url"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Timezone */}
          <div className="sm:w-1/2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => saveMutation.mutate({ name, website, industry, timezone })}
            disabled={saveMutation.isPending || !name.trim()}
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transfer Ownership */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Transfer Ownership</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transfer this organization to another member. This action is irreversible.
              </p>
            </div>
            <div className="relative group shrink-0">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-1.5 cursor-not-allowed opacity-60"
              >
                <UserCog className="h-3.5 w-3.5" />
                Transfer
              </Button>
              <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-10">
                <div className="rounded-md bg-popover border border-border shadow-md px-2.5 py-1.5 text-[11px] text-muted-foreground whitespace-nowrap">
                  Contact support to transfer ownership
                </div>
              </div>
            </div>
          </div>

          {/* Delete Organization */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium text-destructive">Delete Organization</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete this organization and all its data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
