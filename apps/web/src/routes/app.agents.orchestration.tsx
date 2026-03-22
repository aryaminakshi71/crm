import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Plus,
  Users,
  Play,
  Settings,
  Trash2,
  ArrowRight,
  GitBranch,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/orchestration")({
  component: OrchestrationDashboard,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

interface Workflow {
  id: string;
  name: string;
  description: string;
  agents: string[];
  status: "active" | "paused" | "draft";
  executions: number;
  successRate: number;
  lastRun: string;
}

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: "wf-1",
    name: "Customer Support Pipeline",
    description: "Routes support tickets to appropriate agents based on category",
    agents: ["Support Bot", "Data Analyst", "Escalation Agent"],
    status: "active",
    executions: 1247,
    successRate: 94.2,
    lastRun: "5 min ago",
  },
  {
    id: "wf-2",
    name: "Lead Qualification Flow",
    description: "Qualifies leads and schedules demos automatically",
    agents: ["Lead Qualifier", "CRM Updater", "Scheduler"],
    status: "active",
    executions: 892,
    successRate: 98.1,
    lastRun: "12 min ago",
  },
  {
    id: "wf-3",
    name: "Data Processing Pipeline",
    description: "Processes incoming data files and generates reports",
    agents: ["Data Collector", "Data Analyst", "Report Generator"],
    status: "paused",
    executions: 456,
    successRate: 89.5,
    lastRun: "2 hours ago",
  },
  {
    id: "wf-4",
    name: "Content Creation Workflow",
    description: "Generates and reviews content across multiple channels",
    agents: ["Research Agent", "Writer", "Editor", "Publisher"],
    status: "draft",
    executions: 0,
    successRate: 0,
    lastRun: "Never",
  },
];

function OrchestrationDashboard() {
  const navigate = useNavigate();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // GET /api/agents — use real agents for the available agents panel
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents", "list"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents?limit=50`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json() as Promise<{
        data: Array<{ id: string; name: string; agentType: string; status: string }>;
      }>;
    },
  });

  // No workflows endpoint exists yet — use mock data with real agent list for the panel
  const workflows = MOCK_WORKFLOWS;
  const availableAgents = agentsData?.data ?? [];

  const getStatusColor = (status: Workflow["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-amber-100 text-amber-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalExecutions = workflows.reduce((s, w) => s + w.executions, 0);
  const avgSuccessRate =
    workflows.filter((w) => w.executions > 0).reduce((s, w) => s + w.successRate, 0) /
    Math.max(workflows.filter((w) => w.executions > 0).length, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Multi-Agent Orchestration</h2>
            <p className="text-muted-foreground text-sm">Coordinate multiple agents in complex workflows</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          New Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <GitBranch className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{workflows.filter((w) => w.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{totalExecutions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Success Rate</p>
                <p className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workflows List */}
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`p-4 border rounded-xl transition-colors cursor-pointer ${
                    selectedWorkflow?.id === workflow.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <p className="text-muted-foreground text-sm">{workflow.description}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground">Agents:</span>
                    <div className="flex flex-wrap gap-1">
                      {workflow.agents.map((agent, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-muted rounded text-xs">
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{workflow.executions.toLocaleString()} executions</span>
                      <span>{workflow.successRate > 0 ? `${workflow.successRate}%` : "N/A"} success</span>
                      <span>Last: {workflow.lastRun}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Available Agents */}
        <div>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Available Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse bg-muted rounded-lg" />
                  ))}
                </div>
              ) : availableAgents.length > 0 ? (
                availableAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{agent.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {agent.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No agents found</p>
              )}
              <Button variant="outline" className="w-full mt-2" onClick={() => navigate({ to: "/app/agents/new" })}>
                <Plus className="h-4 w-4 mr-2" /> Add Agent
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  Connect agents using conditional logic
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  Set up error handling for each step
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  Monitor execution in real-time
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                  Use shared memory between agents
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
