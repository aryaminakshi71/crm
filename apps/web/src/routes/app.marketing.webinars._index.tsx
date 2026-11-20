/**
 * Marketing Webinars
 *
 * Webinar list with host, date, registrations, attendees, and
 * status (upcoming/live/ended).
 */

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
import { Calendar, Plus, Radio, Search, TrendingUp, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { marketingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["upcoming", "live", "ended"]).optional(),
});

export const Route = createFileRoute("/app/marketing/webinars/_index")({
  validateSearch: searchSchema,
  component: WebinarsPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "live":
      return (
        <Badge className="bg-red-100 text-red-700 gap-1 animate-pulse">
          <Radio className="h-3 w-3" />
          Live
        </Badge>
      );
    case "upcoming":
      return <Badge className="bg-blue-100 text-blue-700">Upcoming</Badge>;
    case "ended":
      return <Badge className="bg-gray-100 text-gray-700">Ended</Badge>;
    default:
      return <Badge variant="secondary">{status ?? "Unknown"}</Badge>;
  }
}

function WebinarsPage() {
  const { q = "", status: statusFilter } = useSearch({ from: "/app/marketing/webinars/_index" });
  const navigate = useNavigate({ from: "/app/marketing/webinars" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "webinars"],
    queryFn: () =>
      fetch("/api/v1/marketing/webinars", { headers: orgHeader() }).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/v1/marketing/webinars", {
        method: "POST",
        headers: orgHeader(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create webinar");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Webinar created");
      queryClient.invalidateQueries({ queryKey: ["marketing", "webinars"] });
    },
    onError: () => toast.error("Failed to create webinar"),
  });

  const allWebinars: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const webinars = allWebinars.filter((w: any) => {
    const matchesQ = !q || w.title?.toLowerCase().includes(q.toLowerCase()) || w.host?.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = !statusFilter || w.status?.toLowerCase() === statusFilter;
    return matchesQ && matchesStatus;
  });

  const upcomingCount = allWebinars.filter((w) => w.status?.toLowerCase() === "upcoming").length;
  const totalRegistrations = allWebinars.reduce((acc: number, w: any) => acc + (w.registrations ?? 0), 0);

  const endedWebinars = allWebinars.filter(
    (w) => w.status?.toLowerCase() === "ended" && w.registrations && w.attendees,
  );
  const avgAttendanceRate =
    endedWebinars.length > 0
      ? Math.round(
          endedWebinars.reduce(
            (acc, w) => acc + (w.attendees / w.registrations) * 100,
            0,
          ) / endedWebinars.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webinars</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage virtual events for your audience
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() =>
            createMutation.mutate({
              title: "New Webinar",
              scheduledAt: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
              status: "upcoming",
            })
          }
          disabled={createMutation.isPending}
        >
          <Plus className="h-4 w-4" />
          Create Webinar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">{totalRegistrations.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold">
                  {avgAttendanceRate > 0 ? `${avgAttendanceRate}%` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration &amp; Attendance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[
              { month: "Oct", registered: 312, attended: 218 },
              { month: "Nov", registered: 287, attended: 201 },
              { month: "Dec", registered: 198, attended: 142 },
              { month: "Jan", registered: 356, attended: 267 },
              { month: "Feb", registered: 421, attended: 318 },
              { month: "Mar", registered: 489, attended: 371 },
            ]}>
              <defs>
                <linearGradient id="webRegGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="webAttGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="registered" stroke="#6366f1" fill="url(#webRegGrad)" strokeWidth={2} name="Registered" />
              <Area type="monotone" dataKey="attended" stroke="#10b981" fill="url(#webAttGrad)" strokeWidth={2} name="Attended" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle>All Webinars</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9 w-52"
                  placeholder="Search webinars..."
                  value={q}
                  onChange={(e) =>
                    navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
                  }
                />
              </div>
              <select
                value={statusFilter ?? ""}
                onChange={(e) =>
                  navigate({ search: (prev) => ({ ...prev, status: (e.target.value as typeof statusFilter) || undefined }) })
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : webinars.length === 0 ? (
            <EmptyState
              title={allWebinars.length === 0 ? "No webinars yet" : "No webinars match your search"}
              description={allWebinars.length === 0 ? "Create your first webinar to engage your audience." : "Try adjusting your search or filter."}
            />
          ) : (
            <div className="divide-y">
              {webinars.map((webinar: any) => (
                <div key={webinar.id} className="py-4 hover:bg-muted/20 px-2 rounded transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Video className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{webinar.title}</p>
                          {statusBadge(webinar.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {webinar.host && (
                            <span>Host: <span className="font-medium text-foreground">{webinar.host}</span></span>
                          )}
                          {webinar.scheduledAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(webinar.scheduledAt).toLocaleString()}
                            </span>
                          )}
                          {webinar.registrations != null && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {webinar.registrations} registered
                            </span>
                          )}
                          {webinar.attendees != null && webinar.status?.toLowerCase() === "ended" && (
                            <span>{webinar.attendees} attended</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
