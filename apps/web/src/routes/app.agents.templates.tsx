import { Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;
import {
  ArrowLeft,
  Plus,
  Sparkles,
  CheckCircle,
  MessageSquare,
  Code,
  BarChart3,
  Headphones,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agents/templates")({
  component: AgentTemplatesPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  customer_support: Headphones,
  data_analysis: BarChart3,
  code_execution: Code,
  chatbot: MessageSquare,
};

const LOCAL_TEMPLATES = [
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "AI agent for handling customer support queries with natural language understanding.",
    agentType: "chatbot",
    icon: "customer_support",
    features: ["Natural language understanding", "FAQ responses", "Ticket creation", "Escalation handling"],
  },
  {
    id: "data-analyst",
    name: "Data Analyst Agent",
    description: "AI agent for analyzing data, generating insights, and creating visualizations.",
    agentType: "data_analysis",
    icon: "data_analysis",
    features: ["SQL query generation", "Statistical analysis", "Chart creation", "Report generation"],
  },
  {
    id: "code-assistant",
    name: "Code Assistant Agent",
    description: "AI agent for helping with code reviews, debugging, and code generation.",
    agentType: "code_execution",
    icon: "code_execution",
    features: ["Code review", "Bug detection", "Code generation", "Documentation"],
  },
  {
    id: "sales-bot",
    name: "Sales Bot Agent",
    description: "AI agent for qualifying leads, answering product questions, and scheduling demos.",
    agentType: "chatbot",
    icon: "chatbot",
    features: ["Lead qualification", "Product recommendations", "Demo scheduling", "CRM integration"],
  },
];

function AgentTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // GET /api/agents/templates
  const { data: templatesData, isLoading, isError, refetch} = useQuery({
    queryKey: ["agents", "templates", page],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents/templates?page=${page}&limit=${PAGE_SIZE}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json() as Promise<{
        data: Array<{
          id: string;
          name: string;
          description: string;
          agentType: string;
          defaultConfig?: Record<string, unknown>;
          isPublic?: string;
        }>;
      }>;
    },
  });

  // useMutation — create agent from template via POST /api/agents
  const createAgentMutation = useMutation({
    mutationFn: async (template: { name: string; description: string; agentType: string }) => {
      const res = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          agentType: template.agentType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? "Failed to create agent");
      }
      return res.json();
    },
    onSuccess: (agent) => {
      toast.success("Agent created from template");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      navigate({ to: "/app/agents/$agentId", params: { agentId: (agent as any).id } });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const total = (templatesData as any)?.total ?? (templatesData as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Merge API templates with local templates, prefer API data
  const apiTemplates = templatesData?.data ?? [];
  const templates =
    apiTemplates.length > 0
      ? apiTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          agentType: t.agentType,
          icon: t.agentType,
          features: LOCAL_TEMPLATES.find((lt) => lt.agentType === t.agentType)?.features ?? [],
        }))
      : LOCAL_TEMPLATES;

  const handleUseTemplate = (template: (typeof templates)[number]) => {
    createAgentMutation.mutate({
      name: template.name,
      description: template.description,
      agentType: template.agentType,
    });
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-bold text-xl text-foreground">Agent Templates</h2>
          <p className="text-muted-foreground text-sm">Start with a pre-configured agent template.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => {
            const Icon = ICON_MAP[template.icon] ?? MessageSquare;
            const isCreating =
              createAgentMutation.isPending && createAgentMutation.variables?.name === template.name;
            return (
              <Card key={template.id} className="border-border/60 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-muted-foreground text-sm capitalize">
                          {template.agentType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{template.description}</p>
                  {template.features.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium">Features:</p>
                      <ul className="grid grid-cols-2 gap-1">
                        {template.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUseTemplate(template)}
                    disabled={createAgentMutation.isPending}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isCreating ? "Creating..." : "Use Template"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Card className="border-border/60 bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Need a custom agent?</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Create a fully customized agent tailored to your specific requirements.
              </p>
            </div>
            <Link to="/app/agents/new">
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                Create Custom Agent
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
