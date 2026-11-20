import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Activity, Plus, Send, Webhook, X, FlaskConical, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/integrations/webhooks/_index")({
  validateSearch: searchSchema,
  component: WebhooksPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const SAMPLE_PAYLOADS: Record<string, object> = {
  "contact.created": { event: "contact.created", data: { id: "cnt_123", name: "Jane Doe", email: "jane@example.com", createdAt: new Date().toISOString() } },
  "deal.updated": { event: "deal.updated", data: { id: "deal_456", title: "Acme Corp Deal", stage: "proposal", value: 15000, updatedAt: new Date().toISOString() } },
  "invoice.paid": { event: "invoice.paid", data: { id: "inv_789", number: "INV-0042", amount: 2500, currency: "USD", paidAt: new Date().toISOString() } },
  "ticket.created": { event: "ticket.created", data: { id: "tkt_101", subject: "Login issue", priority: "high", createdAt: new Date().toISOString() } },
  "test.event": { event: "test.event", data: { message: "This is a test webhook delivery", timestamp: new Date().toISOString() } },
};

function getSamplePayload(event: string): string {
  const payload = SAMPLE_PAYLOADS[event] ?? SAMPLE_PAYLOADS["test.event"];
  return JSON.stringify(payload, null, 2);
}

interface TestResult {
  status: number;
  latencyMs: number;
  body: string;
}

function TestWebhookModal({ webhook, onClose }: { webhook: any; onClose: () => void }) {
  const events: string[] = webhook.events?.length ? webhook.events : ["test.event"];
  const [selectedEvent, setSelectedEvent] = useState<string>(events[0]);
  const [payload, setPayload] = useState<string>(() => getSamplePayload(events[0]));
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function handleSendTest() {
    setTesting(true);
    setResult(null);
    const start = Date.now();
    try {
      const res = await fetch(`/api/v1/integrations/webhooks/${webhook.id}/test`, {
        method: "POST",
        headers: orgHeader(),
        body: JSON.stringify({ event: selectedEvent, payload: JSON.parse(payload) }),
      });
      const latencyMs = Date.now() - start;
      let body = "";
      try {
        body = JSON.stringify(await res.json(), null, 2);
      } catch {
        body = await res.text();
      }
      setResult({ status: res.status, latencyMs, body });
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      setResult({ status: 0, latencyMs, body: err?.message ?? "Network error" });
    } finally {
      setTesting(false);
    }
  }

  const isSuccess = result && result.status >= 200 && result.status < 300;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background border border-border shadow-xl space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Test Webhook</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-mono truncate">{webhook.url ?? webhook.endpoint}</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Event Type</label>
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setPayload(getSamplePayload(e.target.value));
                setResult(null);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {events.map((ev: string) => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
              {!events.includes("test.event") && (
                <option value="test.event">test.event</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payload</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
        </div>

        {result && (
          <div className={`rounded-lg border px-4 py-3 space-y-2 ${isSuccess ? "border-green-500/40 bg-green-500/5" : "border-destructive/40 bg-destructive/5"}`}>
            <div className="flex items-center gap-2">
              {isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-sm font-semibold ${isSuccess ? "text-green-600" : "text-destructive"}`}>
                {result.status === 0 ? "Connection failed" : `HTTP ${result.status}`}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{result.latencyMs}ms</span>
            </div>
            {result.body && (
              <pre className="text-xs font-mono text-foreground/80 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                {result.body}
              </pre>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSendTest}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send Test
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function WebhooksPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState("");
  const [testingWebhook, setTestingWebhook] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { q = "", page = 1 } = useSearch({ from: "/app/integrations/webhooks/_index" });
  const navigate = useNavigate({ from: "/app/integrations/webhooks/_index" });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "webhooks", page],
    queryFn: () =>
      fetch(`/api/v1/integrations/webhooks?page=${page}&limit=${PAGE_SIZE}`, { headers: orgHeader() }).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (body: { url: string; events: string[] }) => {
      const res = await fetch("/api/v1/integrations/webhooks", {
        method: "POST",
        headers: orgHeader(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create webhook");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Webhook created");
      queryClient.invalidateQueries({ queryKey: ["integrations", "webhooks"] });
      setShowCreate(false);
      setNewUrl("");
      setNewEvents("");
    },
    onError: () => toast.error("Failed to create webhook"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/v1/integrations/webhooks/${id}`, {
        method: "PATCH",
        headers: orgHeader(),
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update webhook");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "webhooks"] });
    },
    onError: () => toast.error("Failed to update webhook"),
  });

  const webhooks: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeCount = webhooks.filter((w) => w.active !== false).length;
  const todayDeliveries = webhooks.reduce((acc, w) => acc + (w.deliveriesToday ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Manage HTTP endpoints for real-time event notifications
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Webhook className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Webhooks</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Deliveries Today</p>
                <p className="text-2xl font-bold">{todayDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showCreate && (
        <Card className="border-dashed border-primary/40">
          <CardContent className="pt-6 space-y-4">
            <p className="font-semibold text-sm">New Webhook</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Endpoint URL</label>
                <Input
                  placeholder="https://your-server.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Events (comma-separated)
                </label>
                <Input
                  placeholder="contact.created, deal.updated, invoice.paid"
                  value={newEvents}
                  onChange={(e) => setNewEvents(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    createMutation.mutate({
                      url: newUrl,
                      events: newEvents.split(",").map((e) => e.trim()).filter(Boolean),
                    })
                  }
                  disabled={!newUrl.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : webhooks.length === 0 ? (
            <EmptyState
              title="No webhooks configured"
              description="Create a webhook to start receiving real-time event notifications."
            />
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => {
                const isActive = wh.active !== false;
                return (
                  <div
                    key={wh.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm truncate text-foreground">
                          {wh.url ?? wh.endpoint ?? "—"}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(wh.events ?? []).map((ev: string) => (
                            <Badge key={ev} className="text-xs bg-blue-100 text-blue-800">
                              {ev}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {wh.lastTriggered && (
                            <span>Last triggered: {new Date(wh.lastTriggered).toLocaleString()}</span>
                          )}
                          {wh.successRate != null && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {wh.successRate}% success
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-7 text-xs"
                          onClick={() => setTestingWebhook(wh)}
                        >
                          <FlaskConical className="h-3 w-3" />
                          Test
                        </Button>
                        <button
                          onClick={() => toggleMutation.mutate({ id: wh.id, active: !isActive })}
                          disabled={toggleMutation.isPending}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              isActive ? "translate-x-4" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {testingWebhook && (
        <TestWebhookModal
          webhook={testingWebhook}
          onClose={() => setTestingWebhook(null)}
        />
      )}
    </div>
  );
}
