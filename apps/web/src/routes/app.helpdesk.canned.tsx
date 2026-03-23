import {
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
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Plus, Trash2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/canned")({
  component: CannedResponsesPage,
});

function CannedResponsesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shortcut: "",
    body: "",
    category: "General",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["helpdesk", "canned"],
    queryFn: () => helpdeskApi.canned.list({ page: 1, limit: 200 }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      shortcut?: string;
      body: string;
      category?: string;
    }) => helpdeskApi.canned.create(payload),
    onSuccess: () => {
      toast.success("Canned response created");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "canned"] });
      setIsCreateOpen(false);
      setForm({ name: "", shortcut: "", body: "", category: "General" });
    },
    onError: () => toast.error("Failed to create canned response"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => helpdeskApi.canned.delete(id),
    onSuccess: () => {
      toast.success("Canned response deleted");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "canned"] });
    },
    onError: () => toast.error("Failed to delete canned response"),
  });

  if (isLoading) return <Loading text="Loading canned responses..." />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const responses: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Canned Responses
          </h1>
          <p className="text-muted-foreground">
            Pre-written replies for common support questions.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Response
        </Button>
      </div>

      {responses.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="No canned responses yet"
          description="Canned responses let agents reply faster to common questions."
          action={{
            label: "Create Response",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {responses.map((resp: any) => (
            <Card key={resp.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">{resp.name}</CardTitle>
                    {resp.shortcut && (
                      <p className="text-xs text-muted-foreground">
                        Shortcut:{" "}
                        <span className="font-mono text-primary">
                          /{resp.shortcut}
                        </span>
                      </p>
                    )}
                    {resp.category && (
                      <p className="text-xs text-muted-foreground">
                        {resp.category}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => deleteMutation.mutate(resp.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{resp.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Canned Response"
        submitText="Create"
        loading={createMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim() || !form.body.trim()) {
            toast.error("Name and body are required");
            return;
          }
          createMutation.mutate({
            name: form.name.trim(),
            shortcut: form.shortcut.trim() || undefined,
            body: form.body.trim(),
            category: form.category,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Password reset instructions"
            />
          </FormField>
          <FormField label="Shortcut">
            <Input
              value={form.shortcut}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, shortcut: e.target.value }))
              }
              placeholder="pwd-reset"
            />
          </FormField>
          <FormField label="Category">
            <Input
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
              placeholder="General"
            />
          </FormField>
          <FormField label="Body" required>
            <Textarea
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder="Hi, here are the steps to reset your password..."
              rows={5}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
