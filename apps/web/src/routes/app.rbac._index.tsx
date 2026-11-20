import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Edit,
  Lock,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  tab: z.enum(["roles", "permissions"]).optional(),
});

export const Route = createFileRoute("/app/rbac/_index")({
  validateSearch: searchSchema,
  component: RbacPage,
});

const ORG_HEADER = {
  "Content-Type": "application/json",
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupPermsByModule(permissions: any[]): Record<string, any[]> {
  return permissions.reduce((acc: Record<string, any[]>, perm: any) => {
    const mod = perm.module ?? perm.resource ?? "general";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});
}

// ─── Page ────────────────────────────────────────────────────────────────────

function RbacPage() {
  const { q = "", tab: tabParam } = useSearch({ from: "/app/rbac/_index" });
  const navigate = useNavigate({ from: "/app/rbac/_index" });
  const activeTab: "roles" | "permissions" = tabParam ?? "roles";
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data: rolesData, isLoading: loadingRoles } = useQuery({
    queryKey: ["rbac-roles"],
    queryFn: async () => {
      const res = await fetch("/api/v1/rbac/roles", { headers: ORG_HEADER });
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const { data: permsData, isLoading: loadingPerms } = useQuery({
    queryKey: ["rbac-permissions"],
    queryFn: async () => {
      const res = await fetch("/api/v1/rbac/permissions", { headers: ORG_HEADER });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json();
    },
  });

  const createRole = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const res = await fetch("/api/v1/rbac/roles", {
        method: "POST",
        headers: ORG_HEADER,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create role");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      setIsCreateOpen(false);
      setNewRole({ name: "", description: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create role"),
  });

  const updateRolePerms = useMutation({
    mutationFn: async ({ roleId, permIds }: { roleId: string; permIds: string[] }) => {
      const res = await fetch(`/api/v1/rbac/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: ORG_HEADER,
        body: JSON.stringify({ permissionIds: permIds }),
      });
      if (!res.ok) throw new Error("Failed to update permissions");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Permissions updated");
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      setEditRoleId(null);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update permissions"),
  });

  const allRoles: any[] = (rolesData as any)?.data ?? (rolesData as any)?.roles ?? (Array.isArray(rolesData) ? rolesData : []);
  const allPermissions: any[] = (permsData as any)?.data ?? (permsData as any)?.permissions ?? (Array.isArray(permsData) ? permsData : []);

  const roles = allRoles.filter((r: any) =>
    !q || r.name?.toLowerCase().includes(q.toLowerCase()) || r.description?.toLowerCase().includes(q.toLowerCase()),
  );
  const permissions = allPermissions.filter((p: any) =>
    !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.description?.toLowerCase().includes(q.toLowerCase()),
  );
  const permsByModule = useMemo(() => groupPermsByModule(allPermissions), [allPermissions]);

  const editingRole = editRoleId ? roles.find((r: any) => r.id === editRoleId) : null;

  function openEditPerms(role: any) {
    setEditRoleId(role.id);
    const current = new Set<string>(role.permissions?.map((p: any) => p.id ?? p) ?? []);
    setSelectedPerms(current);
  }

  function togglePerm(permId: string) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  }

  if (loadingRoles || loadingPerms) return <Loading text="Loading RBAC data..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-6 w-6" /> Roles & Permissions
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage access control roles and permission assignments.
          </p>
        </div>
        {activeTab === "roles" && (
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Role
          </Button>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 w-fit">
          {(["roles", "permissions"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => navigate({ search: (prev) => ({ ...prev, tab }) })}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder={`Search ${activeTab}...`}
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
          />
        </div>
      </div>

      {/* ── Roles Tab ──────────────────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <Card>
          <CardContent className="p-0">
            {roles.length === 0 ? (
              <EmptyState
                icon={<Shield className="h-12 w-12" />}
                title="No roles found"
                description="Create your first role to manage access control."
                action={<Button onClick={() => setIsCreateOpen(true)}>Create Role</Button>}
              />
            ) : (
              <div className="divide-y divide-border">
                {roles.map((role: any) => (
                  <div key={role.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{role.name}</p>
                          {role.system || role.isSystem ? (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800">
                              System
                            </span>
                          ) : (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-800">
                              Custom
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            {role.permissions?.length ?? role.permissionsCount ?? 0} permissions
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {role.usersCount ?? role.users?.length ?? 0} users
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Edit className="h-3.5 w-3.5" />}
                        onClick={() => openEditPerms(role)}
                      >
                        Edit Permissions
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Permissions Tab ────────────────────────────────────────────────────── */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          {permissions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No permissions found.
              </CardContent>
            </Card>
          ) : (
            Object.entries(permsByModule).map(([module, perms]) => (
              <Card key={module}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold capitalize flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {module}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {perms.length} permissions
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {perms.map((perm: any) => (
                      <div
                        key={perm.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{perm.name}</p>
                          {perm.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {perm.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                          {perm.rolesCount ?? 0} roles
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Create Role Modal ──────────────────────────────────────────────────── */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Role"
        submitText="Create Role"
        loading={createRole.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newRole.name.trim()) {
            toast.error("Role name is required");
            return;
          }
          createRole.mutate(newRole);
        }}
      >
        <div className="space-y-4">
          <FormField label="Role Name" required>
            <Input
              value={newRole.name}
              onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Support Manager"
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newRole.description}
              onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
              placeholder="What can this role do?"
              rows={3}
            />
          </FormField>
        </div>
      </FormModal>

      {/* ── Edit Permissions Modal ─────────────────────────────────────────────── */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <div>
                <h2 className="font-semibold text-foreground">Edit Permissions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Role: <span className="font-medium">{editingRole.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditRoleId(null)}
                className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {Object.entries(permsByModule).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 capitalize">
                    {module}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                    {perms.map((perm: any) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-3 cursor-pointer rounded-lg border border-border/60 p-2.5 hover:bg-muted/20 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPerms.has(perm.id)}
                          onChange={() => togglePerm(perm.id)}
                          className="mt-0.5 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{perm.name}</p>
                          {perm.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-4">
              <Button variant="outline" onClick={() => setEditRoleId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={updateRolePerms.isPending}
                onClick={() =>
                  updateRolePerms.mutate({
                    roleId: editingRole.id,
                    permIds: Array.from(selectedPerms),
                  })
                }
              >
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
