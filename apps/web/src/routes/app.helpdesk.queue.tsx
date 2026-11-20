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
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ListOrdered, Plus,
  AlertCircle
} from "lucide-react";
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/queue")({
  component: QueuePage,
});

function QueuePage() {
  const { data: queueData, isLoading, refetch, isError} = useQuery({
    queryKey: ["helpdesk", "queue"],
    queryFn: () => helpdeskApi.queue({ page: 1, limit: 100 }),
    retry: false,
    // Refresh every 30 seconds since queue changes frequently
    refetchInterval: 30_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ["helpdesk", "stats"],
    queryFn: () => helpdeskApi.stats(),
    retry: false,
  });

  if (isLoading) return <Loading text="Loading queue..." />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const tickets: any[] = queueData?.data ?? [];
  const stats = statsData ?? null;

  const urgentCount = tickets.filter((t: any) => t.priority === "urgent").length;
  const highCount = tickets.filter((t: any) => t.priority === "high").length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-destructive";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityVariant = (priority: string): any => {
    switch (priority) {
      case "urgent":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Queue</h1>
          <p className="text-muted-foreground">
            Priority-ordered tickets awaiting agent assignment.
          </p>
        </div>
        <Link to="/app/helpdesk">
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Ticket
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              In Queue
            </p>
            <p className="text-3xl font-black text-foreground mt-1">
              {tickets.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Urgent
            </p>
            <p className="text-3xl font-black text-destructive mt-1">
              {urgentCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              High Priority
            </p>
            <p className="text-3xl font-black text-orange-400 mt-1">
              {highCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              SLA Breached
            </p>
            <p className="text-3xl font-black text-destructive mt-1">
              {stats?.slaBreached ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="h-12 w-12" />}
          title="Queue is empty"
          description="No open or pending tickets awaiting assignment. Great work!"
          action={<Button onClick={() => {}}>Create Ticket</Button>}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Priority Queue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ordered by priority (urgent → high → medium → low) then age.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {tickets.map((ticket: any, index: number) => (
                <div
                  key={ticket.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                      {index + 1}
                    </span>
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        ticket.priority === "urgent"
                          ? "bg-destructive animate-pulse"
                          : ticket.priority === "high"
                            ? "bg-orange-400"
                            : ticket.priority === "medium"
                              ? "bg-warning"
                              : "bg-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {ticket.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {ticket.contactName && (
                          <span>{ticket.contactName}</span>
                        )}
                        {ticket.contactEmail && (
                          <span>· {ticket.contactEmail}</span>
                        )}
                        <span>
                          · {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleString()
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getPriorityVariant(ticket.priority)}
                      className="text-[10px]"
                    >
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {ticket.status}
                    </Badge>
                    {ticket.slaBreached && (
                      <Badge variant="danger" className="text-[10px]">
                        SLA
                      </Badge>
                    )}
                    <Link to={`/app/helpdesk/tickets/${ticket.id}` as string}>
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
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
