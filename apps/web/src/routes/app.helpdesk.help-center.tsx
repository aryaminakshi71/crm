import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpenText, ExternalLink, Globe, Search, Settings,
  AlertCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/help-center")({
  component: HelpCenterPage,
});

function HelpCenterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  const { data: articlesData, isLoading, refetch, isError} = useQuery({
    queryKey: ["helpdesk", "knowledge", "published"],
    queryFn: () =>
      helpdeskApi.knowledge.list({ page: 1, limit: 100, status: "published" }),
    retry: false,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["helpdesk", "knowledge-categories"],
    queryFn: () => helpdeskApi.knowledgeCategories.list({ page: 1, limit: 100 }),
    retry: false,
  });

  const createArticleMutation = useMutation({
    mutationFn: (data: { title: string; body: string }) =>
      helpdeskApi.knowledge.create({ ...data, status: "published" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "knowledge", "published"] });
      toast.success("Article published successfully");
      setIsModalOpen(false);
      setForm({ title: "", body: "" });
    },
    onError: () => toast.error("Failed to publish article"),
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => helpdeskApi.knowledge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "knowledge", "published"] });
      toast.success("Article deleted");
    },
    onError: () => toast.error("Failed to delete article"),
  });

  if (isLoading) return <Loading text="Loading help center..." />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const articles: any[] = articlesData?.data ?? [];
  const categories: any[] = categoriesData?.data ?? [];

  const filtered = articles.filter((a: any) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(s) || a.body?.toLowerCase().includes(s)
    );
  });

  // Group articles by category
  const byCategory: Record<string, any[]> = {};
  for (const article of filtered) {
    const key = article.categoryId ?? "uncategorized";
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(article);
  }

  const getCategoryName = (id: string) => {
    if (id === "uncategorized") return "General";
    return categories.find((c: any) => c.id === id)?.name ?? "General";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Help Center</h1>
          <p className="text-muted-foreground">
            Public-facing knowledge base — published articles visible to customers.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Article
        </Button>
      </div>

      {/* New Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border border-border p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">New Article</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title *</label>
                <Input
                  className="mt-1"
                  placeholder="Article title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content *</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px] resize-y"
                  placeholder="Write the article content here..."
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!form.title.trim() || !form.body.trim() || createArticleMutation.isPending}
                onClick={() => createArticleMutation.mutate(form)}
              >
                {createArticleMutation.isPending ? "Publishing..." : "Publish Article"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <>
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="No published articles"
            description="Publish knowledge base articles to populate the help center. Go to Knowledge Base to create and publish articles."
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Help Center Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Public Knowledge Base",
                    desc: "Publish knowledge articles as a searchable help center for customers.",
                  },
                  {
                    title: "Ticket Submission Portal",
                    desc: "Let customers submit tickets directly from the help center.",
                  },
                  {
                    title: "Custom Domain",
                    desc: "Host the help center on your own domain (e.g. help.yourcompany.com).",
                  },
                  {
                    title: "Branding",
                    desc: "Apply your logo, colors, and theme to match your brand.",
                  },
                  {
                    title: "SEO & Sitemap",
                    desc: "Auto-generate sitemaps and meta tags for discoverability.",
                  },
                  {
                    title: "Search",
                    desc: "Full-text search across all published articles.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="font-medium text-foreground">
                      {feature.title}
                    </p>
                    <p className="text-xs mt-1">{feature.desc}</p>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
                onClick={() => {
                  window.location.href = "/app/helpdesk/knowledge";
                }}
              >
                Go to Knowledge Base
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search help articles..."
              />
            </div>
            <Badge variant="outline">
              {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {Object.entries(byCategory).map(([categoryId, categoryArticles]) => (
            <div key={categoryId} className="space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpenText className="h-4 w-4 text-muted-foreground" />
                {getCategoryName(categoryId)}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {categoryArticles.map((article: any) => (
                  <Card key={article.id} className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {article.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {article.body?.slice(0, 120)}
                            {article.body?.length > 120 ? "…" : ""}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{article.views ?? 0} views</span>
                            {article.publishedAt && (
                              <span>
                                {new Date(
                                  article.publishedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <ExternalLink className="h-3 w-3 text-muted-foreground mt-1" />
                          <button
                            className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                            disabled={deleteArticleMutation.isPending}
                            onClick={() => deleteArticleMutation.mutate(article.id)}
                            title="Delete article"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
