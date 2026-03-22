import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Code, Copy, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/helpdesk/widget")({
  component: WidgetPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.companyId) return { "x-organization-id": user.companyId };
    } catch {}
  }
  return {};
}

async function fetchWidgetConfig() {
  const res = await fetch(`${API_BASE}/v1/helpdesk/widget/config`, {
    headers: { ...getOrgHeader() },
  });
  if (!res.ok) throw new Error("No widget endpoint");
  return res.json();
}

function getOrgId(): string | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.companyId ?? null;
    } catch {}
  }
  return null;
}

function WidgetPage() {
  const { data: widgetData, isLoading, error } = useQuery({
    queryKey: ["helpdesk", "widget", "config"],
    queryFn: fetchWidgetConfig,
    retry: false,
  });

  if (isLoading) return <Loading text="Loading widget configuration..." />;

  const config = error ? null : widgetData;
  const orgId = getOrgId();

  // Generate the embed snippet using org ID
  const embedSnippet = `<script>
  window.NucleoWidget = {
    orgId: "${orgId ?? "YOUR_ORG_ID"}",
    primaryColor: "${config?.primaryColor ?? "#6366f1"}",
    position: "${config?.position ?? "bottom-right"}",
    greeting: "${config?.greeting ?? "Hi! How can we help you?"}",
  };
</script>
<script src="${API_BASE}/widget/nucleo.js" async></script>`;

  function copySnippet() {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      toast.success("Embed snippet copied to clipboard");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Chat Widget</h1>
        <p className="text-muted-foreground">
          Embed the Nucleo helpdesk chat widget on your website.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {config ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Widget Settings</CardTitle>
                  <Badge variant={config.enabled ? "success" : "outline"}>
                    {config.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {config.primaryColor && (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-6 w-6 rounded-full border border-border"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Primary Color
                      </p>
                      <p className="font-mono text-foreground">
                        {config.primaryColor}
                      </p>
                    </div>
                  </div>
                )}
                {config.position && (
                  <div>
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="font-medium text-foreground capitalize">
                      {config.position.replace("-", " ")}
                    </p>
                  </div>
                )}
                {config.greeting && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Greeting Message
                    </p>
                    <p className="text-foreground">{config.greeting}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={<MessageSquare className="h-12 w-12" />}
              title="Widget not configured"
              description="The widget configuration endpoint is not yet available. Use the embed snippet below to add the default widget to your website."
            />
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Embed Snippet</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Copy className="h-3 w-3" />}
                  onClick={copySnippet}
                >
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted/40 p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                {embedSnippet}
              </pre>
              <p className="mt-3 text-xs text-muted-foreground">
                Paste this snippet before the closing{" "}
                <code className="font-mono">&lt;/body&gt;</code> tag of your
                website.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Widget Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {[
                "Live chat with support agents",
                "Ticket creation from chat",
                "Knowledge base search",
                "Custom branding & colors",
                "Mobile responsive",
                "Offline message collection",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Code className="h-3 w-3 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                The widget connects to your Nucleo helpdesk workspace
                automatically using your organization ID.
              </p>
              <p>
                Tickets submitted via the widget appear in the{" "}
                <strong className="text-foreground">general</strong> queue by
                default.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
