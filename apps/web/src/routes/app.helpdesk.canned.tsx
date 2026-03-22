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
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/helpdesk/canned")({
  component: CannedResponsesPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.companyId) return { "x-organization-id": user.companyId };
    } catch {}
  }
  return {};
}

async function fetchCannedResponses() {
  const res = await fetch(`${API_BASE}/v1/nucleo/canned-responses`, {
    headers: { ...getOrgHeader() },
  });
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

async function createCannedResponse(data: {
  title: string;
  shortcut: string;
  message: string;
  category?: string;
}) {
  const res = await fetch(`${API_BASE}/v1/nucleo/canned-responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

async function deleteCannedResponse(id: string) {
  const res = await fetch(`${API_BASE}/v1/nucleo/canned-responses/${id}`, {
    method: "DELETE",
    headers: { ...getOrgHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

function CannedResponsesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    shortcut: "",
    message: "",
    category: "General",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["helpdesk", "canned-responses"],
    queryFn: fetchCannedResponses,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createCannedResponse,
    onSuccess: () => {
      toast.success("Canned response created");
      queryClient.invalidateQueries({
        queryKey: ["helpdesk", "canned-responses"],
      });
      setIsCreateOpen(false);
      setForm({ title: "", shortcut: "", message: "", category: "General" });
    },
    onError: () => toast.error("Failed to create canned response"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCannedResponse,
    onSuccess: () => {
      toast.success("Canned response deleted");
      queryClient.invalidateQueries({
        queryKey: ["helpdesk", "canned-responses"],
      });
    },
    onError: () => toast.error("Failed to delete canned response"),
  });

  if (isLoading) return <Loading text="Loading canned responses..." />;

  const responses: any[] = data?.data ?? [];
  const hasEndpoint = !error;

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
        {hasEndpoint && (
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Response
          </Button>
        )}
      </div>

      {!hasEndpoint || responses.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="No canned responses yet"
          description="Canned responses let agents reply faster to common questions. This feature is coming soon."
        />
      ) : (
        <div className="space-y-3">
          {responses.map((resp: any) => (
            <Card key={resp.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">{resp.title}</CardTitle>
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
                <p className="text-sm text-muted-foreground">{resp.message}</p>
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
          if (!form.title.trim() || !form.message.trim()) {
            toast.error("Title and message are required");
            return;
          }
          createMutation.mutate({
            title: form.title.trim(),
            shortcut: form.shortcut.trim(),
            message: form.message.trim(),
            category: form.category,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
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
          <FormField label="Message" required>
            <Textarea
              value={form.message}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, message: e.target.value }))
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
