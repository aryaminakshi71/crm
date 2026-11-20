import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, LoadingSkeleton } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Video, Plus, Calendar, Users, Clock,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/marketing/webinars")({
  component: MarketingWebinarsPage,
});

const _MOCK_WEBINARS = [
  {
    id: "wb-1",
    name: "Intro to Nucleo CRM: Live Demo",
    status: "upcoming",
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    registered: 284,
    attended: 0,
    host: "Jane Smith",
    topic: "Product Demo",
  },
  {
    id: "wb-2",
    name: "Scaling Sales Operations in 2025",
    status: "completed",
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    registered: 512,
    attended: 389,
    host: "John Doe",
    topic: "Best Practices",
  },
  {
    id: "wb-3",
    name: "Marketing Attribution Masterclass",
    status: "completed",
    scheduledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    registered: 731,
    attended: 598,
    host: "Sarah Lee",
    topic: "Analytics",
  },
  {
    id: "wb-4",
    name: "DevOps for Startups",
    status: "draft",
    scheduledAt: null,
    duration: 60,
    registered: 0,
    attended: 0,
    host: "Alex Kim",
    topic: "DevOps",
  },
];

function MarketingWebinarsPage() {
  const { data: campaignsData, isLoading, refetch, isError} = useQuery({
    queryKey: ["marketing", "campaigns", "webinars"],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/v1/marketing/campaigns?type=webinar&limit=50`,
          { headers: { "Content-Type": "application/json", ...getOrgHeader() } },
        );
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    placeholderData: (prev) => prev,
  });

  const webinars = (campaignsData as any)?.data ?? [];

  const statusColor = (s: string) =>
    s === "upcoming" ? "bg-blue-100 text-blue-800"
    : s === "completed" ? "bg-green-100 text-green-800"
    : s === "live" ? "bg-red-100 text-red-800"
    : "bg-gray-100 text-gray-800";

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => (refetch as () => void)()}>Retry</Button>
    </div>
  );
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <LoadingSkeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Webinars</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-foreground">Webinars</h1>
            <p className="text-muted-foreground text-sm">
              Schedule, host, and track webinar registrations and attendance.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Schedule Webinar
          </Button>
        </div>
      </div>

      {webinars.length === 0 ? (
        <EmptyState
          icon={<Video className="h-8 w-8 text-primary/40" />}
          title="No webinars yet"
          description="Schedule your first webinar to start engaging your audience with live sessions."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {webinars.map((webinar: any) => (
            <Card key={webinar.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">{webinar.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Host: {webinar.host ?? "TBD"}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColor(webinar.status ?? "draft")}>
                    {webinar.status ?? "draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Date
                    </p>
                    <p className="font-bold text-xs mt-0.5">
                      {webinar.scheduledAt
                        ? new Date(webinar.scheduledAt).toLocaleDateString()
                        : "TBD"}
                    </p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      Registered
                    </p>
                    <p className="font-bold text-sm">{(webinar.registered ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duration
                    </p>
                    <p className="font-bold text-sm">{webinar.duration ?? 60}m</p>
                  </div>
                </div>
                {webinar.attended > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Attendance rate:{" "}
                    <span className="font-semibold text-foreground">
                      {Math.round((webinar.attended / webinar.registered) * 100)}%
                    </span>{" "}
                    ({webinar.attended.toLocaleString()} attended)
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    {webinar.status === "upcoming" ? "Manage" : "View Report"}
                  </Button>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
