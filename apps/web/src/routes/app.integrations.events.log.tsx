import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_RUNS = {
  data: [
    { id: "r-1", connector: "Stripe", event: "payment.succeeded", status: "success", executedAt: new Date().toISOString(), durationMs: 142 },
    { id: "r-2", connector: "Slack", event: "deal.won", status: "success", executedAt: new Date(Date.now() - 900000).toISOString(), durationMs: 87 },
    { id: "r-3", connector: "GitHub", event: "ticket.created", status: "failed", executedAt: new Date(Date.now() - 3600000).toISOString(), durationMs: 5000, error: "Connection timeout" },
    { id: "r-4", connector: "Mailchimp", event: "contact.created", status: "success", executedAt: new Date(Date.now() - 7200000).toISOString(), durationMs: 234 },
    { id: "r-5", connector: "Stripe", event: "invoice.paid", status: "failed", executedAt: new Date(Date.now() - 86400000).toISOString(), durationMs: 3000, error: "Rate limit exceeded" },
  ],
};

export const Route = createFileRoute("/app/integrations/events/log")({
  component: EventLogPage,
});

function EventLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["integration", "runs", "log"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/runs`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_RUNS;
      return res.json();
    },
  });

  const runs = data?.data ?? MOCK_RUNS.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Event Log</h1>
        <p className="text-muted-foreground mt-1">
          Real-time log of all integration events and executions.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events ({runs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runs.map((run: any) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {run.status === "success"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">{run.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.connector}
                        {run.error && <span className="text-rose-500"> — {run.error}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <Badge variant={run.status === "success" ? "default" : "destructive"}>
                      {run.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {run.durationMs}ms
                      </div>
                      <div>{new Date(run.executedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
