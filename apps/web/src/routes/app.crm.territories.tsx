import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Globe, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
}

export const Route = createFileRoute("/app/crm/territories")({
  validateSearch: z.object({
    search: z.string().optional(),
  }),
  component: CrmTerritoriesPage,
});

interface Territory {
  id: string;
  name: string;
  description?: string;
  region?: string;
  assignedTo?: string;
  dealCount?: number;
}

const EMPTY_FORM = { name: "", description: "", region: "", assignedTo: "" };

function CrmTerritoriesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Query ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ["crm/territories"],
    queryFn: () =>
      fetch(`${API_BASE}/crm/territories`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch territories");
        return r.json();
      }),
    retry: false,
  });

  const territories: Territory[] = Array.isArray((query.data as any)?.data)
    ? (query.data as any).data
    : [];
  const hasData = territories.length > 0;

  // ── Create mutation ────────────────────────────────────────────────────────
  const createTerritory = useMutation({
    mutationFn: () => {
      if (!form.name.trim()) throw new Error("Territory name is required");
      return fetch(`${API_BASE}/crm/territories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          region: form.region.trim() || undefined,
          assignedTo: form.assignedTo.trim() || undefined,
        }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create territory");
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success("Territory created");
      queryClient.invalidateQueries({ queryKey: ["crm/territories"] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create territory"),
  });

  // ── Update mutation ────────────────────────────────────────────────────────
  const updateTerritory = useMutation({
    mutationFn: (id: string) => {
      if (!form.name.trim()) throw new Error("Territory name is required");
      return fetch(`${API_BASE}/crm/territories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          region: form.region.trim() || undefined,
          assignedTo: form.assignedTo.trim() || undefined,
        }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update territory");
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success("Territory updated");
      queryClient.invalidateQueries({ queryKey: ["crm/territories"] });
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update territory"),
  });

  // ── Delete mutation ────────────────────────────────────────────────────────
  const deleteTerritory = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/crm/territories/${id}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete territory");
      }),
    onSuccess: () => {
      toast.success("Territory deleted");
      queryClient.invalidateQueries({ queryKey: ["crm/territories"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete territory"),
  });

  function openEdit(t: Territory) {
    setForm({
      name: t.name,
      description: t.description ?? "",
      region: t.region ?? "",
      assignedTo: t.assignedTo ?? "",
    });
    setEditingId(t.id);
  }

  if (query.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button>
    </div>
  );

  const isModalOpen = showCreate || editingId !== null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Territories</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Sales Territories</h1>
          <p className="text-muted-foreground text-sm">
            Define and manage geographic or account-based sales territories.
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Territory
        </Button>
      </div>

      {/* Content */}
      {query.isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4">
                <div className="h-14 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={<Globe className="h-8 w-8 text-primary/40" />}
          title="No territories yet"
          description="Create your first territory to assign deals and reps to geographic or account segments."
        />
      ) : (
        <div className="space-y-3">
          {territories.map((t) => (
            <Card key={t.id} className="border-border/60">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {t.region && (
                        <Badge variant="secondary" className="text-xs">{t.region}</Badge>
                      )}
                      {t.assignedTo && (
                        <span className="text-xs text-muted-foreground">Rep: {t.assignedTo}</span>
                      )}
                      {t.dealCount !== undefined && (
                        <span className="text-xs text-muted-foreground">{t.dealCount} deals</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(t.id)}
                    disabled={deleteTerritory.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">
                {editingId ? "Edit Territory" : "New Territory"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowCreate(false); setEditingId(null); setForm(EMPTY_FORM); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="West Coast"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Region</label>
                <Input
                  placeholder="e.g. North America"
                  value={form.region}
                  onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assigned Rep</label>
                <Input
                  placeholder="Rep name or email"
                  value={form.assignedTo}
                  onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Brief description..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setShowCreate(false); setEditingId(null); setForm(EMPTY_FORM); }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editingId
                    ? updateTerritory.mutate(editingId)
                    : createTerritory.mutate()
                }
                disabled={createTerritory.isPending || updateTerritory.isPending}
              >
                {createTerritory.isPending || updateTerritory.isPending
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Create Territory"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg">Delete Territory</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this territory? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteTerritory.mutate(deleteId)}
                disabled={deleteTerritory.isPending}
              >
                {deleteTerritory.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
