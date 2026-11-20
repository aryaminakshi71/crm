/**
 * Settings — Team
 *
 * View team members, invite new members, and remove existing ones.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  MailPlus,
  Search,
  Trash2,
  UserCheck,
  Users2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  role: z.enum(["admin", "member", "viewer"]).optional(),
});

export const Route = createFileRoute("/app/settings/team/_index")({
  validateSearch: searchSchema,
  component: TeamSettingsPage,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamRole = "admin" | "member" | "viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
  avatarInitial?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: TeamMember[] = [
  { id: "u-1", name: "Alice Johnson", email: "alice@acme.com", role: "admin", joinedAt: "2024-01-15" },
  { id: "u-2", name: "Bob Martinez", email: "bob@acme.com", role: "member", joinedAt: "2024-02-20" },
  { id: "u-3", name: "Carla Singh", email: "carla@acme.com", role: "member", joinedAt: "2024-03-10" },
  { id: "u-4", name: "David Kim", email: "david@acme.com", role: "viewer", joinedAt: "2024-04-05" },
  { id: "u-5", name: "Eva Thompson", email: "eva@acme.com", role: "admin", joinedAt: "2024-05-01" },
];

// ─── Badge helpers ────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<TeamRole, string> = {
  admin: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  member: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  viewer: "bg-gray-500/15 text-gray-600 border-gray-500/30",
};

function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_COLORS[role]}`}>
      {role}
    </span>
  );
}

function avatarInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    "bg-violet-500/20 text-violet-700",
    "bg-blue-500/20 text-blue-700",
    "bg-emerald-500/20 text-emerald-700",
    "bg-amber-500/20 text-amber-700",
    "bg-rose-500/20 text-rose-700",
    "bg-cyan-500/20 text-cyan-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/team/invite`, {
        method: "POST",
        headers: getOrgHeader(),
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error("Invite failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      setRole("member");
      onInvited();
      onClose();
    },
    onError: () => toast.error("Failed to send invite"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <MailPlus className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Invite Team Member</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Email address <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="admin">Admin — full access</option>
              <option value="member">Member — standard access</option>
              <option value="viewer">Viewer — read-only access</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={!email.trim() || inviteMutation.isPending}
            >
              <MailPlus className="h-3.5 w-3.5" />
              {inviteMutation.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function TeamSettingsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { q = "", role: roleFilter } = useSearch({ from: "/app/settings/team/_index" });
  const navigate = useNavigate({ from: "/app/settings/team/_index" });

  const { data, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: () =>
      fetch(`${API_BASE}/team`, { headers: getOrgHeader() })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    placeholderData: (prev) => prev,
  });

  const allMembers: TeamMember[] =
    (data as any)?.data ?? (data as any)?.members ?? [];

  const members = allMembers.filter((m) => {
    const matchesQ = !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.email.toLowerCase().includes(q.toLowerCase());
    const matchesRole = !roleFilter || m.role === roleFilter;
    return matchesQ && matchesRole;
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_BASE}/team/${userId}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("Remove failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const adminCount = allMembers.filter((m) => m.role === "admin").length;

  return (
    <div className="space-y-6 max-w-3xl">
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => queryClient.invalidateQueries({ queryKey: ["team-members"] })}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {members.length} member{members.length !== 1 ? "s" : ""} · {adminCount} admin{adminCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setInviteOpen(true)}
        >
          <MailPlus className="h-3.5 w-3.5" />
          Invite Member
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search by name or email..."
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
          />
        </div>
        <select
          value={roleFilter ?? ""}
          onChange={(e) =>
            navigate({ search: (prev) => ({ ...prev, role: (e.target.value as TeamRole) || undefined }) })
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users2 className="h-4 w-4 text-primary" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Users2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">{allMembers.length === 0 ? "No team members yet. Invite someone!" : "No members match your search."}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {members.map((member) => {
                const initial = avatarInitial(member.name);
                const colorClass = avatarColor(member.name);
                const isOnlyAdmin = member.role === "admin" && adminCount === 1;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm ${colorClass}`}
                    >
                      {initial}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>

                    {/* Role */}
                    <RoleBadge role={member.role} />

                    {/* Joined */}
                    <span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                      Joined {new Date(member.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>

                    {/* Remove */}
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          if (isOnlyAdmin) return;
                          removeMutation.mutate(member.id);
                        }}
                        disabled={isOnlyAdmin || removeMutation.isPending}
                        className={`rounded-md p-1.5 transition-colors ${
                          isOnlyAdmin
                            ? "cursor-not-allowed opacity-30 text-muted-foreground"
                            : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        }`}
                        title={isOnlyAdmin ? "Cannot remove the only admin" : "Remove member"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {isOnlyAdmin && (
                        <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-10">
                          <div className="rounded-md bg-popover border border-border shadow-md px-2.5 py-1.5 text-[11px] text-muted-foreground whitespace-nowrap">
                            Cannot remove the only admin
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {(
              [
                { role: "admin" as TeamRole, label: "Admin", desc: "Full access: manage settings, billing, team, and all modules." },
                { role: "member" as TeamRole, label: "Member", desc: "Standard access: create and edit records across all modules." },
                { role: "viewer" as TeamRole, label: "Viewer", desc: "Read-only access: view data but cannot create or modify records." },
              ] as const
            ).map((r) => (
              <div key={r.role} className="rounded-lg border border-border p-3 space-y-1.5">
                <RoleBadge role={r.role} />
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
