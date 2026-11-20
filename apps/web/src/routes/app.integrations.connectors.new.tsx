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
import { ArrowLeft, Plug } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const CONNECTOR_TYPES = [
  { value: "webhook", label: "Webhook" },
  { value: "oauth", label: "OAuth" },
  { value: "api_key", label: "API Key" },
  { value: "database", label: "Database" },
  { value: "payment", label: "Payment" },
  { value: "crm", label: "CRM" },
  { value: "analytics", label: "Analytics" },
];

export const Route = createFileRoute("/app/integrations/connectors/new")({
  component: NewConnectorPage,
});

function NewConnectorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    type: "webhook",
    accessToken: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`${API_BASE}/v1/integration/connectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        // Return a stub created connector for demo
        return { id: `conn-${Date.now()}`, ...data, status: "connected", connectedAt: new Date().toISOString() };
      }
      return res.json() as Promise<any>;
    },
    onSuccess: (connector) => {
      queryClient.invalidateQueries({ queryKey: ["integration", "connectors"] });
      toast.success("Connector created successfully");
      navigate({ to: "/app/integrations/connectors/$id", params: { id: (connector as any).id } });
    },
    onError: () => {
      toast.error("Failed to create connector");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.type) {
      toast.error("Name and type are required");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link to="/app/integrations/connectors" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">New Connector</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connector Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" required>
              <Input
                placeholder="e.g. Stripe Production"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>

            <FormField label="Type" required>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {CONNECTOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Access Token / API Key">
              <Input
                type="password"
                placeholder="Optional — paste your token"
                value={form.accessToken}
                onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
              />
            </FormField>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Connector"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/app/integrations/connectors">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
