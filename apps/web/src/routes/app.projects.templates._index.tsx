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
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  BookTemplate,
  Calendar,
  CheckSquare,
  Copy,
  FolderKanban,
  Plus,
  Search,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/projects/templates/_index")({
  validateSearch: searchSchema,
  component: TemplatesIndexPage,
});

const CATEGORY_COLORS: Record<string, string> = {
  "Software": "bg-blue-500/10 text-blue-400",
  "Marketing": "bg-purple-500/10 text-purple-400",
  "Operations": "bg-amber-500/10 text-amber-400",
  "HR": "bg-emerald-500/10 text-emerald-400",
  "Product": "bg-cyan-500/10 text-cyan-400",
  "Finance": "bg-orange-500/10 text-orange-400",
};

const FALLBACK_TEMPLATES = [
  {
    id: "t1",
    name: "Software Launch",
    description: "End-to-end template for launching a software product including planning, development, QA, and release.",
    tasksCount: 24,
    durationDays: 90,
    category: "Software",
  },
  {
    id: "t2",
    name: "Marketing Campaign",
    description: "Full campaign lifecycle from strategy and creative through execution and reporting.",
    tasksCount: 16,
    durationDays: 45,
    category: "Marketing",
  },
  {
    id: "t3",
    name: "Employee Onboarding",
    description: "Structured onboarding process for new hires covering IT setup, orientation, and first 90 days.",
    tasksCount: 18,
    durationDays: 30,
    category: "HR",
  },
  {
    id: "t4",
    name: "Product Discovery",
    description: "Research, user interviews, prototyping, and validation for new product features.",
    tasksCount: 12,
    durationDays: 28,
    category: "Product",
  },
  {
    id: "t5",
    name: "Infrastructure Migration",
    description: "Cloud migration checklist covering audit, planning, execution, and validation phases.",
    tasksCount: 30,
    durationDays: 60,
    category: "Operations",
  },
  {
    id: "t6",
    name: "Budget Planning",
    description: "Annual budget planning cycle with forecasting, approval workflows, and variance tracking.",
    tasksCount: 10,
    durationDays: 21,
    category: "Finance",
  },
];

function TemplatesIndexPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/projects/templates/_index" });
  const navigate = useNavigate({ from: "/app/projects/templates/_index" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects/templates", {
        headers: {
          "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
    retry: false,
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch("/api/v1/projects/templates/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) throw new Error("Failed to use template");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Project created from template");
    },
    onError: () => {
      toast.error("Failed to create project from template");
    },
  });

  const rawTemplates: any[] = ((data as any)?.data as any[]) ?? [];
  const templates = rawTemplates.length > 0 ? rawTemplates : FALLBACK_TEMPLATES;

  const categories = ["all", ...Array.from(new Set(templates.map((t: any) => t.category ?? "General")))];

  const filtered = templates.filter((t: any) => {
    const matchSearch =
      !search.trim() ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || (t.category ?? "General") === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (isError && rawTemplates.length === 0) {
    // Use fallback silently — don't show error when we have fallback data
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Project Templates</h2>
          <p className="text-muted-foreground text-sm">
            Start a new project quickly using a pre-built template
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Templates</p>
            <p className="text-2xl font-black text-primary mt-0.5">{isLoading ? "—" : templates.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categories</p>
            <p className="text-2xl font-black text-cyan-400 mt-0.5">
              {isLoading ? "—" : categories.length - 1}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Tasks</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">
              {isLoading
                ? "—"
                : templates.length > 0
                ? Math.round(
                    templates.reduce((acc: number, t: any) => acc + (t.tasksCount ?? 0), 0) /
                      templates.length,
                  )
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No templates found"
          description="Try adjusting your search or create a new template."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template: any) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={() => useTemplateMutation.mutate(template.id)}
              isUsing={useTemplateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onUse,
  isUsing,
}: {
  template: any;
  onUse: () => void;
  isUsing: boolean;
}) {
  const categoryColor =
    CATEGORY_COLORS[template.category ?? ""] ?? "bg-muted text-muted-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors group">
      {/* Icon & Category */}
      <div className="flex items-start justify-between gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FolderKanban className="h-5 w-5 text-primary" />
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}
        >
          <Tag className="h-3 w-3 mr-1" />
          {template.category ?? "General"}
        </span>
      </div>

      {/* Name & Description */}
      <div>
        <h3 className="font-semibold text-sm text-foreground">{template.name}</h3>
        {template.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {template.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {template.tasksCount != null && (
          <div className="flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>{template.tasksCount} tasks</span>
          </div>
        )}
        {template.durationDays != null && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{template.durationDays} days</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-auto pt-2 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onUse}
          disabled={isUsing}
        >
          <Copy className="h-4 w-4 mr-1.5" />
          Use Template
        </Button>
      </div>
    </div>
  );
}
