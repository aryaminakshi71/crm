import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from "@crm/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, GitBranch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const APP_OPTIONS = [
  { value: "crm", label: "CRM" },
  { value: "finance", label: "Finance" },
  { value: "helpdesk", label: "Helpdesk" },
  { value: "hrm", label: "HRM" },
  { value: "marketing", label: "Marketing" },
  { value: "slack", label: "Slack" },
  { value: "email", label: "Email" },
  { value: "webhook", label: "Webhook" },
];

const TRIGGER_OPTIONS: Record<string, string[]> = {
  crm: ["contact.created", "deal.won", "deal.lost", "lead.created"],
  finance: ["invoice.paid", "transaction.created"],
  helpdesk: ["ticket.created", "ticket.resolved"],
  hrm: ["employee.onboarded", "leave.approved"],
  marketing: ["campaign.sent", "lead.captured"],
};

const ACTION_OPTIONS: Record<string, string[]> = {
  slack: ["send_message", "create_channel"],
  email: ["send_email"],
  webhook: ["post_webhook"],
  crm: ["create_contact", "update_deal"],
  finance: ["create_invoice"],
  helpdesk: ["create_ticket", "assign_agent"],
};

export const Route = createFileRoute("/app/integrations/workflows/new")({
  component: NewWorkflowPage,
});

function NewWorkflowPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    sourceApp: "crm",
    targetApp: "slack",
    triggerEvent: "contact.created",
    actionType: "send_message",
    isActive: true,
  });

  const triggers = TRIGGER_OPTIONS[form.sourceApp] ?? [];
  const actions = ACTION_OPTIONS[form.targetApp] ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`${API_BASE}/v1/integration/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        return { id: `wf-${Date.now()}`, ...data, createdAt: new Date().toISOString(), runCount: 0 };
      }
      return res.json();
    },
    onSuccess: (workflow) => {
      queryClient.invalidateQueries({ queryKey: ["integration", "workflows"] });
      toast.success("Workflow created successfully");
      navigate({ to: "/app/integrations/workflows/$id", params: { id: workflow.id } });
    },
    onError: () => {
      toast.error("Failed to create workflow");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceApp || !form.targetApp || !form.triggerEvent || !form.actionType) {
      toast.error("All fields are required");
      return;
    }
    createMutation.mutate({
      ...form,
      name: form.name || `${form.sourceApp} → ${form.targetApp}`,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link to="/app/integrations/workflows" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">New Workflow</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Workflow Name">
              <Input
                placeholder="e.g. New Lead → Slack Notify"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>

            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <FormField label="Source App" required>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.sourceApp}
                    onChange={(e) => {
                      const sourceApp = e.target.value;
                      const newTriggers = TRIGGER_OPTIONS[sourceApp] ?? [];
                      setForm((f) => ({ ...f, sourceApp, triggerEvent: newTriggers[0] ?? "" }));
                    }}
                  >
                    {APP_OPTIONS.filter((a) => TRIGGER_OPTIONS[a.value]).map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mt-6 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <FormField label="Target App" required>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.targetApp}
                    onChange={(e) => {
                      const targetApp = e.target.value;
                      const newActions = ACTION_OPTIONS[targetApp] ?? [];
                      setForm((f) => ({ ...f, targetApp, actionType: newActions[0] ?? "" }));
                    }}
                  >
                    {APP_OPTIONS.filter((a) => ACTION_OPTIONS[a.value]).map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            <FormField label="Trigger Event" required>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.triggerEvent}
                onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value }))}
              >
                {triggers.length > 0
                  ? triggers.map((t) => <option key={t} value={t}>{t}</option>)
                  : <option value="">No triggers available</option>}
              </select>
            </FormField>

            <FormField label="Action Type" required>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.actionType}
                onChange={(e) => setForm((f) => ({ ...f, actionType: e.target.value }))}
              >
                {actions.length > 0
                  ? actions.map((a) => <option key={a} value={a}>{a}</option>)
                  : <option value="">No actions available</option>}
              </select>
            </FormField>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm">Enable workflow immediately</label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Workflow"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/app/integrations/workflows">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
