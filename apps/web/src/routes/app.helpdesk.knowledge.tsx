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
import { createFileRoute } from "@tanstack/react-router";
import { BookOpenText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/knowledge")({
  component: KnowledgeBasePage,
});

function KnowledgeBasePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "General",
    content: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-knowledge-articles"],
    queryFn: () =>
      nucleoApi.operations.knowledgeArticles.list({ page: 1, limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      category: string;
      content: string;
    }) => nucleoApi.operations.knowledgeArticles.create(payload),
    onSuccess: () => {
      toast.success("Knowledge article created");
      queryClient.invalidateQueries({ queryKey: ["ops-knowledge-articles"] });
      setIsCreateOpen(false);
      setForm({ title: "", category: "General", content: "" });
    },
    onError: () => toast.error("Failed to create article"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.operations.knowledgeArticles.update(id, { status }),
    onSuccess: () => {
      toast.success("Article updated");
      queryClient.invalidateQueries({ queryKey: ["ops-knowledge-articles"] });
    },
    onError: () => toast.error("Failed to update article"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      nucleoApi.operations.knowledgeArticles.delete(id),
    onSuccess: () => {
      toast.success("Article deleted");
      queryClient.invalidateQueries({ queryKey: ["ops-knowledge-articles"] });
    },
    onError: () => toast.error("Failed to delete article"),
  });

  if (isLoading) return <Loading text="Loading knowledge base..." />;

  const articles: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Reusable resolution articles for faster ticket handling.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Article
        </Button>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon={<BookOpenText className="h-12 w-12" />}
          title="No knowledge articles"
          description="Create articles for recurring support issues so agents can resolve them faster."
          action={{
            label: "Create Article",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {articles.map((article: any) => (
            <Card key={article.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm">{article.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {article.category}
                      </Badge>
                      <Badge
                        variant={
                          article.status === "published"
                            ? "success"
                            : article.status === "archived"
                              ? "outline"
                              : "primary"
                        }
                        className="text-[10px]"
                      >
                        {article.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                      value={article.status}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: article.id,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => deleteMutation.mutate(article.id)}
                      loading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {article.content}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated:{" "}
                  {article.updatedAt
                    ? new Date(article.updatedAt).toLocaleString()
                    : "-"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Knowledge Article"
        submitText="Create Article"
        loading={createMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim() || !form.content.trim()) {
            toast.error("Title and content are required");
            return;
          }
          createMutation.mutate({
            title: form.title.trim(),
            category: form.category,
            content: form.content.trim(),
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
              placeholder="How to reset your password"
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
          <FormField label="Content" required>
            <Textarea
              rows={6}
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Step-by-step instructions..."
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
