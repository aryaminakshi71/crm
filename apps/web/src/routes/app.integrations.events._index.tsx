import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Clock,
  Search,
  XCircle,
} from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["all", "success", "failed", "pending"]).optional(),
});

export const Route = createFileRoute("/app/integrations/events/_index")({
  validateSearch: searchSchema,
  component: IntegrationEventsPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "success":
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    default:
      return <Badge className="bg-gray-100 text-gray-700">{status ?? "unknown"}</Badge>;
  }
}

function IntegrationEventsPage() {
  const { q = "", status: statusFilter = "all" } = useSearch({ from: "/app/integrations/events/_index" });
  const navigate = useNavigate({ from: "/app/integrations/events/_index" });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : (v as any) }) });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "events"],
    queryFn: () =>
      fetch("/api/v1/integrations/events", { headers: orgHeader() }).then((r) => r.json()),
  });

  const events: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const filtered = events.filter((e) => {
    const matchesStatus = statusFilter === "all" || e.status?.toLowerCase() === statusFilter;
    const matchesQ =
      !q ||
      (e.type ?? e.eventType ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (e.source ?? e.integration ?? "").toLowerCase().includes(q.toLowerCase());
    return matchesStatus && matchesQ;
  });

  const today = new Date().toDateString();
  const eventsToday = events.filter(
    (e) => e.timestamp && new Date(e.timestamp).toDateString() === today,
  ).length;

  const failedCount = events.filter((e) => e.status?.toLowerCase() === "failed").length;
  const successCount = events.filter((e) => e.status?.toLowerCase() === "success").length;
  const failureRate = events.length > 0 ? Math.round((failedCount / events.length) * 100) : 0;
  const successRate = events.length > 0 ? Math.round((successCount / events.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integration Events</h1>
        <p className="text-muted-foreground mt-1">
          Real-time log of all integration event deliveries
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Events Today</p>
                <p className="text-2xl font-bold">{eventsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failure Rate</p>
                <p className="text-2xl font-bold">{failureRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle>Event Log</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by type or source..."
                  className="pl-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "success", "failed", "pending"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No events found"
              description="No integration events match your current filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Event Type</th>
                    <th className="pb-3 pr-4 font-medium">Source</th>
                    <th className="pb-3 pr-4 font-medium">Timestamp</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Payload Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((ev) => (
                    <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs">{ev.type ?? ev.eventType ?? "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {ev.source ?? ev.integration ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="py-3 pr-4">{statusBadge(ev.status)}</td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {ev.payloadSize != null
                          ? `${ev.payloadSize} bytes`
                          : ev.payload
                            ? `${JSON.stringify(ev.payload).length} bytes`
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
