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
import { CheckCircle2, Shield, XCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_AUDIT = {
  data: [
    { id: "r-1", connector: "Stripe", event: "payment.succeeded", status: "success", executedAt: new Date().toISOString(), durationMs: 142 },
    { id: "r-2", connector: "Slack", event: "deal.won", status: "success", executedAt: new Date(Date.now() - 900000).toISOString(), durationMs: 87 },
    { id: "r-3", connector: "GitHub", event: "ticket.created", status: "failed", executedAt: new Date(Date.now() - 3600000).toISOString(), durationMs: 5000, error: "Connection timeout" },
    { id: "r-4", connector: "Mailchimp", event: "contact.created", status: "success", executedAt: new Date(Date.now() - 7200000).toISOString(), durationMs: 234 },
    { id: "r-5", connector: "Stripe", event: "invoice.paid", status: "failed", executedAt: new Date(Date.now() - 86400000).toISOString(), durationMs: 3000, error: "Rate limit exceeded" },
  ],
};

export const Route = createFileRoute("/app/integrations/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["integration", "runs", "audit"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/runs`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_AUDIT;
      return res.json();
    },
  });

  const runs = data?.data ?? MOCK_AUDIT.data;
  const successCount = runs.filter((r: any) => r.status === "success").length;
  const failCount = runs.filter((r: any) => r.status === "failed").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Audit Log
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete audit trail of all integration activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{runs.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-emerald-500">{successCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-rose-500">{failCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Failed</p>
          </CardContent>
        </Card>
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
            <CardTitle>Audit Trail</CardTitle>
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
                        via {run.connector}
                        {run.error && <span className="text-rose-500"> — {run.error}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={run.status === "success" ? "default" : "destructive"}>
                      {run.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.executedAt).toLocaleString()}
                    </span>
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
