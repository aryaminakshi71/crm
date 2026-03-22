/**
 * Workflow List
 *
 * Browse and manage automation workflows.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Workflow,
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Settings,
  Clock,
  TrendingUp,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/workflows")({
  component: WorkflowsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_WORKFLOWS = [
    {
      id: "wf1",
      name: "Lead Sync to Salesforce",
      description: "Automatically sync new leads from landing pages to Salesforce.",
      trigger: "New lead created",
      connector: "Salesforce",
      status: "active",
      lastRun: "2 min ago",
      runs: 1243,
      successRate: 99.2,
    },
    {
      id: "wf2",
      name: "Stripe Payment Alerts",
      description: "Send Slack notifications when payments fail.",
      trigger: "Payment failed",
      connector: "Stripe",
      status: "active",
      lastRun: "5 min ago",
      runs: 456,
      successRate: 98.5,
    },
    {
      id: "wf3",
      name: "Shopify Order Processing",
      description: "Create fulfillment tasks when orders are placed.",
      trigger: "Order created",
      connector: "Shopify",
      status: "active",
      lastRun: "1 min ago",
      runs: 2891,
      successRate: 99.8,
    },
    {
      id: "wf4",
      name: "HubSpot Contact Enrichment",
      description: "Enrich new contacts with company data from Clearbit.",
      trigger: "New contact",
      connector: "HubSpot",
      status: "paused",
      lastRun: "3 days ago",
      runs: 89,
      successRate: 94.2,
    },
    {
      id: "wf5",
      name: "Support Ticket Escalation",
      description: "Escalate high-priority tickets to engineering Slack channel.",
      trigger: "Ticket priority = High",
      connector: "Zendesk",
      status: "active",
      lastRun: "12 min ago",
      runs: 234,
      successRate: 100,
    },
    {
      id: "wf6",
      name: "GitHub Issue Sync",
      description: "Sync GitHub issues to project management tool.",
      trigger: "Issue created",
      connector: "GitHub",
      status: "error",
      lastRun: "1 hour ago",
      runs: 567,
      successRate: 72.1,
    },
    {
      id: "wf7",
      name: "QuickBooks Invoice Creation",
      description: "Create invoices in QuickBooks when deals close.",
      trigger: "Deal closed won",
      connector: "QuickBooks",
      status: "active",
      lastRun: "30 min ago",
      runs: 145,
      successRate: 97.8,
    },
    {
      id: "wf8",
      name: "Mailchimp Segment Update",
      description: "Update Mailchimp segments based on user activity.",
      trigger: "User completed course",
      connector: "Mailchimp",
      status: "active",
      lastRun: "2 hours ago",
      runs: 892,
      successRate: 99.1,
    },
];

function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const workflowsQuery = useQuery({
    queryKey: ["integration", "workflows"],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/integration/workflows?limit=100`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch workflows");
      return res.json();
    },
  });

  const apiWorkflows = workflowsQuery.data?.data;
  const workflows: typeof MOCK_WORKFLOWS = apiWorkflows?.length
    ? apiWorkflows.map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description ?? "",
        trigger: w.triggerType ?? "manual",
        connector: (w.definition as any)?.connector ?? "—",
        status: w.status === "active" ? "active" : w.status === "error" ? "error" : w.status === "paused" ? "paused" : "draft",
        lastRun: w.lastRunAt ? new Date(w.lastRunAt).toLocaleString() : "Never",
        runs: Number(w.runCount ?? 0),
        successRate: 100,
      }))
    : MOCK_WORKFLOWS;

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || wf.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "paused":
        return <Badge variant="warning" size="sm">Paused</Badge>;
      case "error":
        return <Badge variant="danger" size="sm">Error</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    paused: workflows.filter((w) => w.status === "paused").length,
    error: workflows.filter((w) => w.status === "error").length,
  };

  if (workflowsQuery.isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Workflows</h2>
          <p className="text-sm text-muted-foreground">
            {filteredWorkflows.length} workflows / {statusCounts.active} active
          </p>
        </div>
        <Link to="/app/integrations/workflows/new">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="active">Active ({statusCounts.active})</option>
            <option value="paused">Paused ({statusCounts.paused})</option>
            <option value="error">Error ({statusCounts.error})</option>
          </select>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="border-border/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2 mt-1">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to="/app/integrations/workflows/$id"
                      params={{ id: workflow.id }}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {workflow.name}
                    </Link>
                    {getStatusBadge(workflow.status)}
                    {workflow.status === "error" && (
                      <Badge variant="danger" size="sm">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Needs attention
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-foreground">Trigger:</span> {workflow.trigger}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-foreground">Connector:</span> {workflow.connector}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last run: {workflow.lastRun}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {workflow.successRate}% success
                    </span>
                    <span>{workflow.runs.toLocaleString()} total runs</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/app/integrations/workflows/$id" params={{ id: workflow.id }}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {/* toggle pause */}}
                  >
                    {workflow.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No workflows found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <Link to="/app/integrations/workflows/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Create Workflow</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
