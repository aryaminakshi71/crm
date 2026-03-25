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
import { AlertCircle, Search, Send, User, Wrench } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fieldServiceApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  priority: z.enum(["all", "urgent", "high", "medium", "low"]).optional(),
});

export const Route = createFileRoute("/app/field-service/dispatch/_index")({
  validateSearch: searchSchema,
  component: DispatchPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

function priorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case "high":
    case "urgent": return "bg-red-100 text-red-700";
    case "medium": return "bg-yellow-100 text-yellow-700";
    case "low": return "bg-gray-100 text-gray-700";
    default: return "bg-muted text-muted-foreground";
  }
}

function DispatchPage() {
  const queryClient = useQueryClient();
  const { q = "", priority = "all" } = useSearch({ from: "/app/field-service/dispatch/_index" });
  const navigate = useNavigate({ from: "/app/field-service/dispatch/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setPriority = (v: string) => navigate({ search: (p) => ({ ...p, priority: v === "all" ? undefined : (v as any) }) });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["field-service", "jobs"],
    queryFn: () => fieldServiceApi.jobs.list(),
  });

  const { data: techData, isLoading: techLoading } = useQuery({
    queryKey: ["field-service", "technicians"],
    queryFn: () => fieldServiceApi.technicians.list(),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ jobId, technicianId }: { jobId: string; technicianId: string }) => {
      const res = await fetch(`/api/v1/field-service/jobs/${jobId}`, {
        method: "PUT",
        headers: orgHeader(),
        body: JSON.stringify({ technicianId }),
      });
      if (!res.ok) throw new Error("Failed to assign job");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Job assigned");
      queryClient.invalidateQueries({ queryKey: ["field-service", "jobs"] });
    },
    onError: () => toast.error("Failed to assign job"),
  });

  const jobs: any[] = (jobsData as any)?.data ?? (Array.isArray(jobsData) ? jobsData : []);
  const technicians: any[] = (techData as any)?.data ?? (Array.isArray(techData) ? techData : []);

  const unassignedJobs = jobs
    .filter((j: any) => !j.technicianId)
    .filter((j: any) => !q || (j.title ?? "").toLowerCase().includes(q.toLowerCase()) || (j.customerName ?? "").toLowerCase().includes(q.toLowerCase()))
    .filter((j: any) => priority === "all" || (j.priority ?? "").toLowerCase() === priority);
  const availableTechs = technicians.filter(
    (t: any) => t.status === "available" || !t.status,
  );

  function handleAutoAssign(jobId: string) {
    const tech = availableTechs[0];
    if (!tech) {
      toast.error("No available technicians");
      return;
    }
    assignMutation.mutate({ jobId, technicianId: tech.id });
  }

  const isLoading = jobsLoading || techLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dispatch Center</h1>
        <p className="text-muted-foreground mt-1">
          Assign unassigned jobs to available technicians
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title or customer..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "urgent", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                priority === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p === "all" ? "All Priorities" : p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unassigned Jobs</p>
                <p className="text-2xl font-bold">{unassignedJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available Techs</p>
                <p className="text-2xl font-bold">{availableTechs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Queue & SLA Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Job Queue & SLA Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[
              { time: "8am", queued: 12, inProgress: 8, slaCompliance: 94 },
              { time: "9am", queued: 18, inProgress: 11, slaCompliance: 91 },
              { time: "10am", queued: 24, inProgress: 14, slaCompliance: 88 },
              { time: "11am", queued: 19, inProgress: 16, slaCompliance: 92 },
              { time: "12pm", queued: 14, inProgress: 12, slaCompliance: 95 },
              { time: "1pm", queued: 21, inProgress: 13, slaCompliance: 90 },
              { time: "2pm", queued: 17, inProgress: 15, slaCompliance: 93 },
              { time: "3pm", queued: 11, inProgress: 10, slaCompliance: 96 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[80, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="queued" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} name="Queued" />
              <Area yAxisId="left" type="monotone" dataKey="inProgress" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} name="In Progress" />
              <Line yAxisId="right" type="monotone" dataKey="slaCompliance" stroke="#10b981" strokeWidth={2} dot={false} name="SLA %" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Unassigned Jobs ({unassignedJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedJobs.length === 0 ? (
                <EmptyState
                  title="No unassigned jobs"
                  description="All jobs have been assigned to technicians."
                />
              ) : (
                <div className="space-y-3">
                  {unassignedJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="border border-border rounded-lg p-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-xs text-muted-foreground">#{(job.id ?? "").slice(0, 8)}</p>
                            {job.priority && (
                              <Badge className={`text-xs ${priorityColor(job.priority)}`}>
                                {job.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-sm mt-0.5 truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.customerName ?? "No customer"}</p>
                          <p className="text-xs text-muted-foreground truncate">{job.customerAddress ?? "No address"}</p>
                        </div>
                        <Button
                          size="sm"
                          className="gap-1.5 shrink-0"
                          onClick={() => handleAutoAssign(job.id)}
                          disabled={assignMutation.isPending || availableTechs.length === 0}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Technicians */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                Available Technicians ({availableTechs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableTechs.length === 0 ? (
                <EmptyState
                  title="No technicians available"
                  description="All technicians are currently on jobs or off duty."
                />
              ) : (
                <div className="space-y-3">
                  {availableTechs.map((tech: any) => (
                    <div
                      key={tech.id}
                      className="border border-border rounded-lg p-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{tech.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(tech.skills ?? []).slice(0, 3).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="text-[10px]">
                                <Wrench className="h-2.5 w-2.5 mr-0.5" />
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="ml-auto shrink-0 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-xs text-green-600">Available</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
