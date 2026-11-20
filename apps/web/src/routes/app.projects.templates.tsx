import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
  Textarea,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  Copy,
  FileText,
  Flag,
  Plus,
  Search,
  Trash2,
  Users,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
}

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/templates")({
  component: TemplatesPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Template = {
  id: string;
  name: string;
  description: string;
  category: "software" | "marketing" | "research" | "operations" | "custom";
  tasks: TemplateTask[];
  milestones: TemplateMilestone[];
  teamRoles: { role: string; count: number }[];
  estimatedDuration: string;
  budget?: string;
  usageCount: number;
  createdAt: string;
  isFeatured?: boolean;
};

type TemplateTask = {
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  estimatedHours: number;
  assigneeRole?: string;
};

type TemplateMilestone = {
  title: string;
  dayOffset: number;
  description?: string;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "software" as Template["category"],
    estimatedDuration: "",
    budget: "",
  });

  const templatesQuery = useQuery({
    queryKey: ["projects", "templates"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/projects/templates`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
    placeholderData: (prev) => prev,
    retry: false,
  });
  if (templatesQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => templatesQuery.refetch()}>Retry</Button>
    </div>
  );

  const templates: Template[] = (templatesQuery as any).data?.data ?? [];

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterCategory !== "all" && t.category !== filterCategory) {
      return false;
    }
    return true;
  });

  const handleUseTemplate = (template: Template) => {
    toast.success(`Creating project from "${template.name}" template`);
  };

  const handleDuplicateTemplate = (template: Template) => {
    toast.success(`Template "${template.name}" duplicated`);
  };

  // Category colors
  const categoryColors: Record<string, string> = {
    software: "bg-primary/10 text-primary",
    marketing: "bg-warning/10 text-warning",
    research: "bg-cyan-400/10 text-cyan-400",
    operations: "bg-success/10 text-success",
    custom: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Project Templates</h2>
          <p className="text-muted-foreground text-sm">
            Start projects faster with pre-built templates
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          <option value="software">Software</option>
          <option value="marketing">Marketing</option>
          <option value="research">Research</option>
          <option value="operations">Operations</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Featured Template */}
      {search === "" && filterCategory === "all" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <Badge variant="primary" size="sm" className="mb-2">
                    Featured
                  </Badge>
                  <h3 className="text-xl font-bold">
                    {templates.find((t) => t.isFeatured)?.name}
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-xl">
                    {templates.find((t) => t.isFeatured)?.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {templates.find((t) => t.isFeatured)?.tasks.length} tasks
                    </div>
                    <div className="flex items-center gap-1">
                      <Flag className="h-4 w-4" />
                      {templates.find((t) => t.isFeatured)?.milestones.length} milestones
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {templates.find((t) => t.isFeatured)?.teamRoles.length} roles
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {templates.find((t) => t.isFeatured)?.estimatedDuration}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const featured = templates.find((t) => t.isFeatured);
                    if (featured) setSelectedTemplate(featured);
                    setIsPreviewOpen(true);
                  }}
                >
                  Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const featured = templates.find((t) => t.isFeatured);
                    if (featured) handleUseTemplate(featured);
                  }}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {templatesQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                  <div className="h-5 w-16 bg-muted rounded" />
                </div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Templates Grid */}
      {!templatesQuery.isLoading && (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            hover
            className="cursor-pointer"
            onClick={() => {
              setSelectedTemplate(template);
              setIsPreviewOpen(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <Badge
                  className={categoryColors[template.category]}
                  size="sm"
                >
                  {template.category}
                </Badge>
              </div>

              <h3 className="font-semibold mt-3">{template.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {template.tasks.length}
                </div>
                <div className="flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  {template.milestones.length}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {template.usageCount} uses
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {template.estimatedDuration}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateTemplate(template);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success("Template deleted");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedTemplate(null);
          }}
          onUse={() => handleUseTemplate(selectedTemplate)}
        />
      )}

      {/* Create Template Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Template"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Template created");
          setIsCreateModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <FormField label="Template Name" required>
            <Input
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate((t) => ({ ...t, name: e.target.value }))
              }
              placeholder="Enter template name..."
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newTemplate.description}
              onChange={(e) =>
                setNewTemplate((t) => ({ ...t, description: e.target.value }))
              }
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </FormField>
          <FormField label="Category">
            <select
              value={newTemplate.category}
              onChange={(e) =>
                setNewTemplate((t) => ({
                  ...t,
                  category: e.target.value as Template["category"],
                }))
              }
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="software">Software</option>
              <option value="marketing">Marketing</option>
              <option value="research">Research</option>
              <option value="operations">Operations</option>
              <option value="custom">Custom</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estimated Duration">
              <Input
                value={newTemplate.estimatedDuration}
                onChange={(e) =>
                  setNewTemplate((t) => ({
                    ...t,
                    estimatedDuration: e.target.value,
                  }))
                }
                placeholder="e.g., 4 weeks"
              />
            </FormField>
            <FormField label="Budget (optional)">
              <Input
                value={newTemplate.budget}
                onChange={(e) =>
                  setNewTemplate((t) => ({ ...t, budget: e.target.value }))
                }
                placeholder="$0"
              />
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

// ─── Template Preview Modal ─────────────────────────────────────────────────

function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUse,
}: {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onUse: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-3xl rounded-xl bg-card shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{template.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {template.description}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{template.tasks.length}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{template.milestones.length}</p>
                <p className="text-xs text-muted-foreground">Milestones</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{template.teamRoles.length}</p>
                <p className="text-xs text-muted-foreground">Team Roles</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{template.estimatedDuration}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            {/* Tasks */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Tasks ({template.tasks.length})
              </h4>
              <div className="space-y-2">
                {template.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.category}</p>
                    </div>
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "danger"
                          : task.priority === "medium"
                            ? "warning"
                            : "default"
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {task.estimatedHours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Milestones ({template.milestones.length})
              </h4>
              <div className="space-y-3">
                {template.milestones.map((milestone, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <Flag className="h-3 w-3 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{milestone.title}</p>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" size="sm">
                      Day {milestone.dayOffset}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Roles */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Team Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {template.teamRoles.map((role, i) => (
                  <Badge key={i} variant="outline">
                    {role.role} ({role.count})
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 bg-card border-t border-border p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={onUse}>
              Use This Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
