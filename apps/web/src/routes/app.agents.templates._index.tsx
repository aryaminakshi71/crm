import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Bot,
  FileText,
  Layers,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import { z } from "zod";
import { Pagination } from "@/components/ui/pagination";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/agents/templates/_index")({
  validateSearch: searchSchema,
  component: AgentTemplatesPage,
});

const CATEGORY_COLORS: Record<string, string> = {
  "customer-service": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sales: "bg-green-500/10 text-green-400 border-green-500/20",
  operations: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  marketing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  support: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const PAGE_SIZE = 12;

function AgentTemplatesPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/agents/templates/_index" });
  const navigate = useNavigate({ from: "/app/agents/templates/_index" });
  const setQ = (v: string) =>
    navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) =>
    navigate({ search: (p) => ({ ...p, page: v }) });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["agents", "templates"],
    queryFn: () =>
      fetch("/api/v1/agents/templates", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const useTemplateMutation = useMutation({
    mutationFn: (templateId: string) =>
      fetch("/api/v1/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify({ templateId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  const allTemplates: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const filtered = allTemplates.filter((t) =>
    !q ||
    t.name?.toLowerCase().includes(q.toLowerCase()) ||
    t.description?.toLowerCase().includes(q.toLowerCase()) ||
    t.category?.toLowerCase().includes(q.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedTemplates = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categories = [...new Set(allTemplates.map((t) => t.category).filter(Boolean))];

  const stats = [
    { label: "Available Templates", value: allTemplates.length, icon: FileText, color: "text-blue-400" },
    { label: "Categories", value: categories.length, icon: Layers, color: "text-purple-400" },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load templates.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Templates</h1>
          <p className="text-muted-foreground mt-1">
            Pre-built agent configurations ready to deploy
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search templates..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-40" />
          ))}
        </div>
      ) : paginatedTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
          <Bot className="h-8 w-8" />
          <p className="text-sm">No templates available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedTemplates.map((template) => {
            const tools: string[] = Array.isArray(template.tools)
              ? template.tools
              : [];
            return (
              <Card
                key={template.id}
                className="hover:border-primary/50 transition-colors flex flex-col"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm font-medium leading-snug">
                        {template.name ?? "Unnamed Template"}
                      </CardTitle>
                    </div>
                    {template.category && (
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${
                          CATEGORY_COLORS[template.category] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {template.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description ?? "No description provided."}
                  </p>
                  {tools.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      {tools.slice(0, 4).map((tool) => (
                        <Badge
                          key={tool}
                          variant="outline"
                          className="text-xs bg-muted text-muted-foreground"
                        >
                          {tool}
                        </Badge>
                      ))}
                      {tools.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{tools.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  {template.createdBy && (
                    <p className="text-xs text-muted-foreground">
                      By {template.createdBy}
                    </p>
                  )}
                  <div className="mt-auto pt-2">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => useTemplateMutation.mutate(template.id)}
                      disabled={useTemplateMutation.isPending}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
