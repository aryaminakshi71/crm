import { Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, Plus, Sparkles, CheckCircle, MessageSquare, Code, BarChart3, Headphones } from "lucide-react";

export const Route = createFileRoute("/app/agents/templates")({
  component: AgentTemplatesPage,
});

const TEMPLATES = [
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "AI agent for handling customer support queries with natural language understanding.",
    type: "chatbot",
    icon: Headphones,
    features: ["Natural language understanding", "FAQ responses", "Ticket creation", "Escalation handling"],
  },
  {
    id: "data-analyst",
    name: "Data Analyst Agent",
    description: "AI agent for analyzing data, generating insights, and creating visualizations.",
    type: "data_analysis",
    icon: BarChart3,
    features: ["SQL query generation", "Statistical analysis", "Chart creation", "Report generation"],
  },
  {
    id: "code-assistant",
    name: "Code Assistant Agent",
    description: "AI agent for helping with code reviews, debugging, and code generation.",
    type: "code_execution",
    icon: Code,
    features: ["Code review", "Bug detection", "Code generation", "Documentation"],
  },
  {
    id: "sales-bot",
    name: "Sales Bot Agent",
    description: "AI agent for qualifying leads, answering product questions, and scheduling demos.",
    type: "chatbot",
    icon: MessageSquare,
    features: ["Lead qualification", "Product recommendations", "Demo scheduling", "CRM integration"],
  },
];

function AgentTemplatesPage() {
  const navigate = useNavigate();

  const handleUseTemplate = (templateId: string) => {
    // Navigate to create agent page with template pre-selected
    navigate({ to: "/app/agents/new", search: { template: templateId } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-bold text-xl text-foreground">Agent Templates</h2>
          <p className="text-muted-foreground text-sm">
            Start with a pre-configured agent template.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
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
                      <p className="text-muted-foreground text-sm capitalize">{template.type.replace("_", " ")}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">{template.description}</p>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
