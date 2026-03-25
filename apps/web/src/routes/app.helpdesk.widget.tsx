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
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Code, Copy, MessageSquare, Settings,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/widget")({
  component: WidgetPage,
});

function getOrgId(): string {
  if (typeof window === "undefined") return "YOUR_ORG_ID";
  return localStorage.getItem("activeOrganizationId") ?? "YOUR_ORG_ID";
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function WidgetPage() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: widgetData, isLoading, refetch, isError} = useQuery({
    queryKey: ["helpdesk", "widget"],
    queryFn: () => helpdeskApi.widget.get(),
    retry: false,
  });

  const [form, setForm] = useState({
    name: "",
    color: "#6366f1",
    position: "bottom-right" as "bottom-right" | "bottom-left",
    greeting: "Hi! How can we help you?",
    isActive: true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => helpdeskApi.widget.update(data),
    onSuccess: () => {
      toast.success("Widget configuration saved");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "widget"] });
      setIsEditOpen(false);
    },
    onError: () => toast.error("Failed to save widget configuration"),
  });

  if (isLoading) return <Loading text="Loading widget configuration..." />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const config = widgetData ?? null;
  const orgId = getOrgId();

  const embedSnippet = `<script>
  window.NucleoWidget = {
    orgId: "${orgId}",
    primaryColor: "${config?.color ?? "#6366f1"}",
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

  function openEdit() {
    if (config) {
      setForm({
        name: config.name ?? "Support Widget",
        color: config.color ?? "#6366f1",
        position: config.position ?? "bottom-right",
        greeting: config.greeting ?? "Hi! How can we help you?",
        isActive: config.isActive ?? true,
      });
    }
    setIsEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Chat Widget</h1>
          <p className="text-muted-foreground">
            Embed the Nucleo helpdesk chat widget on your website.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Settings className="h-4 w-4" />}
          onClick={openEdit}
        >
          Configure Widget
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {config ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Widget Settings</CardTitle>
                  <Badge variant={config.isActive ? "success" : "outline"}>
                    {config.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: config.color }}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Primary Color
                    </p>
                    <p className="font-mono text-foreground">{config.color}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className="font-medium text-foreground capitalize">
                    {config.position?.replace("-", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Greeting Message
                  </p>
                  <p className="text-foreground">{config.greeting}</p>
                </div>
                {config.allowedDomains && config.allowedDomains.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Allowed Domains
                    </p>
                    <p className="text-foreground font-mono text-xs">
                      {config.allowedDomains.join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="font-medium text-foreground">
                  Widget not yet configured
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Configure Widget" to set up your chat widget. The embed
                  snippet below uses default settings until configured.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openEdit}
                >
                  Configure Now
                </Button>
              </CardContent>
            </Card>
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
                <strong className="text-foreground">web</strong> queue by
                default.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <FormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Configure Widget"
        submitText="Save Configuration"
        loading={updateMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate(form);
        }}
      >
        <div className="space-y-4">
          <FormField label="Widget Name">
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Support Widget"
            />
          </FormField>
          <FormField label="Primary Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, color: e.target.value }))
                }
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <Input
                value={form.color}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, color: e.target.value }))
                }
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </FormField>
          <FormField label="Position">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={form.position}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  position: e.target.value as "bottom-right" | "bottom-left",
                }))
              }
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </FormField>
          <FormField label="Greeting Message">
            <Input
              value={form.greeting}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, greeting: e.target.value }))
              }
              placeholder="Hi! How can we help you?"
            />
          </FormField>
          <FormField label="Status">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="widget-active"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <label
                htmlFor="widget-active"
                className="text-sm text-foreground cursor-pointer"
              >
                Widget is active
              </label>
            </div>
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
