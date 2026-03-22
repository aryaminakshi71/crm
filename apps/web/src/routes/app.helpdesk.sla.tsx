import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/sla")({
  component: SlaPage,
});

// Static SLA policy definitions (SLA policies are config, not DB rows)
const STATIC_SLA_POLICIES = [
  {
    id: "sla-high",
    name: "Critical",
    priority: "high",
    firstResponseHours: 1,
    resolutionHours: 4,
    description: "For urgent issues affecting production or all users.",
    color: "text-destructive",
  },
  {
    id: "sla-medium",
    name: "Standard",
    priority: "medium",
    firstResponseHours: 4,
    resolutionHours: 24,
    description: "For general support requests with moderate impact.",
    color: "text-warning",
  },
  {
    id: "sla-low",
    name: "Low Priority",
    priority: "low",
    firstResponseHours: 24,
    resolutionHours: 72,
    description: "For minor issues, questions, and feature requests.",
    color: "text-muted-foreground",
  },
];

function SlaPage() {
  // Fetch live tickets to compute SLA compliance from real data
  const { data } = useQuery({
    queryKey: ["nucleo-tickets", "all", "all"],
    queryFn: () => nucleoApi.tickets.list({ page: 1, limit: 500 }),
  });

  const tickets: any[] = data?.data ?? [];

  // Compute per-priority stats from real ticket data
  const stats = STATIC_SLA_POLICIES.map((policy) => {
    const priorityTickets = tickets.filter(
      (t: any) => t.priority === policy.priority,
    );
    const closed = priorityTickets.filter((t: any) => t.status === "closed");
    const open = priorityTickets.filter((t: any) => t.status !== "closed");

    // Estimate breached: open tickets older than resolutionHours
    const nowMs = Date.now();
    const breached = open.filter((t: any) => {
      if (!t.createdAt) return false;
      const ageHours =
        (nowMs - new Date(t.createdAt).getTime()) / 1000 / 3600;
      return ageHours > policy.resolutionHours;
    });

    const compliance =
      priorityTickets.length > 0
        ? Math.round(
            ((priorityTickets.length - breached.length) /
              priorityTickets.length) *
              100,
          )
        : 100;

    return {
      ...policy,
      total: priorityTickets.length,
      open: open.length,
      closed: closed.length,
      breached: breached.length,
      compliance,
    };
  });

  const overallTickets = tickets.length;
  const allBreached = stats.reduce((sum, s) => sum + s.breached, 0);
  const overallCompliance =
    overallTickets > 0
      ? Math.round(((overallTickets - allBreached) / overallTickets) * 100)
      : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">SLA Policies</h1>
        <p className="text-muted-foreground">
          Service level agreement targets by ticket priority, computed from live
          ticket data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Overall Compliance
            </p>
            <p className="text-3xl font-black text-emerald-400 mt-1">
              {overallCompliance}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {overallTickets} total tickets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Breached
            </p>
            <p className="text-3xl font-black text-destructive mt-1">
              {allBreached}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              tickets past SLA target
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Open Tickets
            </p>
            <p className="text-3xl font-black text-foreground mt-1">
              {tickets.filter((t: any) => t.status !== "closed").length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              across all priorities
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-12 w-12" />}
          title="No SLA data"
          description="SLA compliance will appear once tickets are created."
        />
      ) : (
        <div className="space-y-4">
          {stats.map((policy) => (
            <Card key={policy.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{policy.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {policy.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      policy.compliance >= 90
                        ? "success"
                        : policy.compliance >= 70
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {policy.compliance}% compliant
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      First Response
                    </p>
                    <p className="font-semibold text-foreground">
                      {policy.firstResponseHours}h target
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resolution</p>
                    <p className="font-semibold text-foreground">
                      {policy.resolutionHours}h target
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tickets</p>
                    <p className="font-semibold text-foreground">
                      {policy.total} total ({policy.open} open)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Breached</p>
                    <p
                      className={`font-semibold ${policy.breached > 0 ? "text-destructive" : "text-emerald-400"}`}
                    >
                      {policy.breached}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted/30">
                  <div
                    className={`h-full rounded-full transition-all ${policy.compliance >= 90 ? "bg-emerald-400" : policy.compliance >= 70 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${policy.compliance}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About SLA Policies</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            SLA targets are calculated based on ticket priority. Tickets are
            considered breached when they exceed the resolution target while
            still open.
          </p>
          <p>
            To customize SLA policies, contact your administrator or configure
            them in your organization settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
