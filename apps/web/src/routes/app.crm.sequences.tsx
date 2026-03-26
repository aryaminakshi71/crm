import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Plus, Trash2, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/app/crm/sequences")({
  validateSearch: z.object({
    search: z.string().optional(),
    status: z.enum(["active", "inactive", "all"]).optional(),
  }),
  component: CrmSequencesPage,
});

interface Sequence {
  id: string;
  name: string;
  description?: string;
  stepCount: number;
  enrolledCount: number;
  isActive: boolean;
  createdAt: string;
}

function CrmSequencesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Query ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ["crm/sequences"],
    queryFn: () =>
      fetch(`/api/crm/sequences`, {
        headers: { "Content-Type": "application/json" },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch sequences");
        return r.json();
      }),
    retry: false,
  });

  const sequences: Sequence[] = Array.isArray((query.data as any)?.data)
    ? (query.data as any).data
    : [];
  const hasData = sequences.length > 0;

  // ── Create mutation ────────────────────────────────────────────────────────
  const createSequence = useMutation({
    mutationFn: () => {
      if (!newName.trim()) throw new Error("Sequence name is required");
      return fetch(`/api/crm/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() || undefined }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create sequence");
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success("Sequence created");
      queryClient.invalidateQueries({ queryKey: ["crm/sequences"] });
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create sequence"),
  });

  // ── Toggle active mutation ─────────────────────────────────────────────────
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/crm/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update sequence");
        return r.json();
      }),
    onSuccess: (_data, vars) => {
      toast.success(vars.isActive ? "Sequence activated" : "Sequence deactivated");
      queryClient.invalidateQueries({ queryKey: ["crm/sequences"] });
    },
    onError: () => toast.error("Failed to update sequence"),
  });

  // ── Delete mutation ────────────────────────────────────────────────────────
  const deleteSequence = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/crm/sequences/${id}`, {
        method: "DELETE",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete sequence");
      }),
    onSuccess: () => {
      toast.success("Sequence deleted");
      queryClient.invalidateQueries({ queryKey: ["crm/sequences"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete sequence"),
  });

  if (query.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Sequences</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Email Sequences</h1>
          <p className="text-muted-foreground text-sm">
            Automate multi-step outreach sequences for leads.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Sequence
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
          icon={<Zap className="h-8 w-8 text-primary/40" />}
          title="No sequences yet"
          description="Create your first email sequence to automate outreach to leads."
        />
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <Card key={seq.id} className="border-border/60">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{seq.name}</p>
                    {seq.description && (
                      <p className="text-xs text-muted-foreground truncate">{seq.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {seq.stepCount ?? 0} steps
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {seq.enrolledCount ?? 0} enrolled
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      seq.isActive
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {seq.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive.mutate({ id: seq.id, isActive: !seq.isActive })}
                    disabled={toggleActive.isPending}
                  >
                    {seq.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(seq.id)}
                    disabled={deleteSequence.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">New Sequence</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Welcome sequence"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Brief description of this sequence..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={() => createSequence.mutate()} disabled={createSequence.isPending}>
                {createSequence.isPending ? "Creating..." : "Create Sequence"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg">Delete Sequence</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this sequence? All enrolled contacts will be removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteSequence.mutate(deleteId)}
                disabled={deleteSequence.isPending}
              >
                {deleteSequence.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
