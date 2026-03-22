import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Plus, Webhook } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_WEBHOOKS = {
  data: [
    { id: "conn-2", name: "Slack", type: "webhook", status: "connected", connectedAt: new Date().toISOString(), rateLimit: { limit: 500, remaining: 498 } },
    { id: "conn-5", name: "PagerDuty Webhook", type: "webhook", status: "active", connectedAt: new Date().toISOString(), rateLimit: { limit: 200, remaining: 199 } },
  ],
};

export const Route = createFileRoute("/app/integrations/webhooks")({
  component: WebhooksPage,
});

function WebhooksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["integration", "connectors", "webhook"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/connectors?type=webhook`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_WEBHOOKS;
      return res.json();
    },
  });

  const webhooks = data?.data ?? MOCK_WEBHOOKS.data;

  const copyEndpoint = (id: string) => {
    const url = `${window.location.origin}/api/v1/webhooks/inbound/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage incoming and outgoing webhook connections.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/integrations/connectors/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No webhooks configured yet.</p>
            <Button className="mt-4" asChild>
              <Link to="/app/integrations/connectors/new">Add your first webhook</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook: any) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    {webhook.name}
                  </CardTitle>
                  <Badge variant={webhook.status === "connected" || webhook.status === "active" ? "default" : "secondary"}>
                    {webhook.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs bg-muted rounded px-3 py-2">
                  <span className="flex-1 truncate text-muted-foreground">
                    {window.location.origin}/api/v1/webhooks/inbound/{webhook.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyEndpoint(webhook.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {webhook.rateLimit && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Rate limit: {webhook.rateLimit.remaining}/{webhook.rateLimit.limit}/hr</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/app/integrations/connectors/$id" params={{ id: webhook.id }}>
                      Configure
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
