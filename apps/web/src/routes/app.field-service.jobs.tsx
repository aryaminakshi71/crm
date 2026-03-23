import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/orpc";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

export const Route = createFileRoute("/app/field-service/jobs")({
  component: FieldServiceJobs,
});

function FieldServiceJobs() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const createJobMutation = useMutation({
    mutationFn: async (data: { title: string; type: string; priority: string }) => {
      const res = await fetch(`${API_BASE}/v1/field-service/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create job");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fieldService", "jobs"] }),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["fieldService", "jobs", statusFilter, priorityFilter],
    queryFn: () =>
      api.fieldService.listJobs({
        page: 1,
        limit: 100,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      }),
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <button onClick={() => refetch()} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Retry</button>
    </div>
  );

  const jobs = data?.data || [];

  const statusColor: Record<string, string> = {
    scheduled: "bg-amber-500/10 text-amber-500",
    in_progress: "bg-blue-500/10 text-blue-500",
    completed: "bg-green-500/10 text-green-500",
    canceled: "bg-muted/10 text-muted-foreground",
    on_hold: "bg-purple-500/10 text-purple-500",
  };

  const priorityColor: Record<string, string> = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-amber-500/10 text-amber-500",
    high: "bg-red-500/10 text-red-500",
    urgent: "bg-red-700/10 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Service Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Manage all service jobs and work orders
          </p>
        </div>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={createJobMutation.isPending}
          onClick={() => {
            const title = window.prompt("Job title:");
            if (!title) return;
            createJobMutation.mutate({ title, type: "maintenance", priority: "medium" });
          }}
        >
          {createJobMutation.isPending ? "Creating..." : "Create Job"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
          <option value="on_hold">On Hold</option>
        </select>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="rounded-lg border border-border/60 bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No jobs found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Job #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Scheduled</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Priority</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: any) => (
                <tr key={job.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">
                    <Link
                      to="/app/field-service/jobs/$id"
                      params={{ id: job.id }}
                      className="text-primary hover:underline font-medium"
                    >
                      {job.jobNumber || job.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{job.title}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{job.customerName || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {job.scheduledStart
                      ? new Date(job.scheduledStart).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor[job.status] || "bg-muted/10 text-muted-foreground"}`}>
                      {job.status?.replace("_", " ") || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColor[job.priority] || "bg-muted/10 text-muted-foreground"}`}>
                      {job.priority || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
