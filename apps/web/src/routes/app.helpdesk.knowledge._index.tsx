import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  BookOpen,
  BookOpenText,
  Eye,
  Plus,
  Search,
  ThumbsUp,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/helpdesk/knowledge/_index")({
  validateSearch: searchSchema,
  component: KnowledgeBasePage,
});

const STATUS_VARIANTS: Record<string, string> = {
  published: "success",
  draft: "outline",
  archived: "destructive",
};

function KnowledgeBasePage() {
  const { q = "", category = "all", page = 1 } = useSearch({ from: "/app/helpdesk/knowledge/_index" });
  const navigate = useNavigate({ from: "/app/helpdesk/knowledge/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setCategory = (v: string) => navigate({ search: (p) => ({ ...p, category: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    body: "",
    slug: "",
    status: "draft",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["helpdesk-knowledge", category],
    queryFn: () =>
      helpdeskApi.knowledge.list({
        page: 1,
        limit: 100,
        status: category !== "all" ? category : undefined,
      }),
  });

  const createArticle = useMutation({
    mutationFn: (payload: { title: string; body: string; slug?: string; status?: string }) =>
      helpdeskApi.knowledge.create(payload),
    onSuccess: () => {
      toast.success("Article created");
      qc.invalidateQueries({ queryKey: ["helpdesk-knowledge"] });
      setIsCreateOpen(false);
      setNewArticle({ title: "", body: "", slug: "", status: "draft" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create article"),
  });

  const deleteArticle = useMutation({
    mutationFn: (id: string) => helpdeskApi.knowledge.delete(id),
    onSuccess: () => {
      toast.success("Article deleted");
      qc.invalidateQueries({ queryKey: ["helpdesk-knowledge"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete article"),
  });

  const articles: any[] = (data as any)?.data ?? [];

  const totalViews = articles.reduce((s: number, a: any) => s + (Number(a.viewCount) || 0), 0);
  const publishedCount = articles.filter((a: any) => a.status === "published").length;
  const totalVotes = articles.reduce((s: number, a: any) => s + (Number(a.helpfulVotes) || 0), 0);

  const filtered = useMemo(() => {
    return articles.filter((a: any) => {
      if (category !== "all" && a.status !== category) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return [a.title, a.body, a.category, a.slug].some((v) => String(v ?? "").toLowerCase().includes(s));
    });
  }, [articles, q, category]);

  if (isLoading) return <Loading text="Loading knowledge base..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <BookOpenText className="h-6 w-6" /> Knowledge Base
          </h1>
          <p className="text-muted-foreground text-sm">Manage help articles and self-service content.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Article
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Total Articles" value={articles.length} icon={<BookOpen className="h-4 w-4" />} color="text-primary" />
        <Metric title="Total Views" value={totalViews.toLocaleString()} icon={<Eye className="h-4 w-4" />} trend={`${publishedCount} published`} color="text-cyan-400" />
        <Metric title="Helpful Votes" value={totalVotes.toLocaleString()} icon={<ThumbsUp className="h-4 w-4" />} color="text-emerald-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpenText className="h-12 w-12" />}
              title="No articles found"
              description={q ? "Try adjusting your search." : "Create your first knowledge base article."}
              action={<Button onClick={() => setIsCreateOpen(true)}>New Article</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((article: any) => (
                <div key={article.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{article.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {article.category && (
                        <span className="text-xs text-muted-foreground">{article.category}</span>
                      )}
                      {article.viewCount != null && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {article.viewCount} views
                        </span>
                      )}
                      {article.helpfulVotes != null && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> {article.helpfulVotes} helpful
                        </span>
                      )}
                      {article.updatedAt && (
                        <span className="text-xs text-muted-foreground">
                          Updated {new Date(article.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant={(STATUS_VARIANTS[article.status] ?? "outline") as any}>
                      {article.status ?? "draft"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => deleteArticle.mutate(article.id)}
                      loading={deleteArticle.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Article"
        submitText="Create Article"
        loading={createArticle.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newArticle.title.trim()) {
            toast.error("Title is required");
            return;
          }
          if (!newArticle.body.trim()) {
            toast.error("Article body is required");
            return;
          }
          createArticle.mutate({
            title: newArticle.title.trim(),
            body: newArticle.body.trim(),
            slug: newArticle.slug.trim() || undefined,
            status: newArticle.status,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={newArticle.title}
              onChange={(e) => setNewArticle((p) => ({ ...p, title: e.target.value }))}
              placeholder="How to reset your password"
              required
            />
          </FormField>
          <FormField label="Body" required>
            <RichTextEditor
              value={newArticle.body}
              onChange={(val) => setNewArticle((p) => ({ ...p, body: val }))}
              placeholder="Write article content..."
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Slug">
              <Input
                value={newArticle.slug}
                onChange={(e) => setNewArticle((p) => ({ ...p, slug: e.target.value }))}
                placeholder="how-to-reset-password"
              />
            </FormField>
            <FormField label="Status">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newArticle.status}
                onChange={(e) => setNewArticle((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <BookOpen className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
