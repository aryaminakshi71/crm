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
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/knowledge")({
  component: KnowledgeBasePage,
});

function KnowledgeBasePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    title: "",
    body: "",
    status: "draft" as "draft" | "published",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["helpdesk", "knowledge", statusFilter],
    queryFn: () =>
      helpdeskApi.knowledge.list({
        page: 1,
        limit: 200,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["helpdesk", "knowledge-categories"],
    queryFn: () => helpdeskApi.knowledgeCategories.list({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; status: string }) =>
      helpdeskApi.knowledge.create(payload),
    onSuccess: () => {
      toast.success("Knowledge article created");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "knowledge"] });
      setIsCreateOpen(false);
      setForm({ title: "", body: "", status: "draft" });
    },
    onError: () => toast.error("Failed to create article"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      helpdeskApi.knowledge.update(id, { status }),
    onSuccess: () => {
      toast.success("Article updated");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "knowledge"] });
    },
    onError: () => toast.error("Failed to update article"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => helpdeskApi.knowledge.delete(id),
    onSuccess: () => {
      toast.success("Article deleted");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "knowledge"] });
    },
    onError: () => toast.error("Failed to delete article"),
  });

  if (isLoading) return <Loading text="Loading knowledge base..." />;

  if (isError) return (
    <EmptyState variant="error" title="Something went wrong" description="Failed to load data. Please try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
  );

  const articles: any[] = data?.data ?? [];
  const categories: any[] = categoriesData?.data ?? [];

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((c: any) => c.id === categoryId)?.name ?? null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Reusable resolution articles for faster ticket handling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Article
          </Button>
        </div>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon={<BookOpenText className="h-12 w-12" />}
          title="No knowledge articles"
          description="Create articles for recurring support issues so agents can resolve them faster."
          action={<Button onClick={() => setIsCreateOpen(true)}>Create Article</Button>}
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
                      {getCategoryName(article.categoryId) && (
                        <Badge variant="outline" className="text-[10px]">
                          {getCategoryName(article.categoryId)}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          article.status === "published" ? "success" : "outline"
                        }
                        className="text-[10px]"
                      >
                        {article.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {article.views} views
                      </span>
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
                  {article.body}
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
          if (!form.title.trim() || !form.body.trim()) {
            toast.error("Title and content are required");
            return;
          }
          createMutation.mutate({
            title: form.title.trim(),
            body: form.body.trim(),
            status: form.status,
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
          <FormField label="Status">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as "draft" | "published",
                }))
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </FormField>
          <FormField label="Content" required>
            <Textarea
              rows={8}
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder="Step-by-step instructions..."
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
