/**
 * Queue Management
 *
 * Priority queues, background jobs, and task scheduling.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/app/queue")({
  component: QueuePage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getHeaders = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const MOCK_QUEUES = [
  { id: "email", name: "Email Delivery", pending: 142, running: 8, failed: 3, completed: 4821, concurrency: 10 },
  { id: "sms", name: "SMS Notifications", pending: 56, running: 4, failed: 1, completed: 1923, concurrency: 5 },
  { id: "reports", name: "Report Generation", pending: 12, running: 2, failed: 0, completed: 387, concurrency: 3 },
  { id: "sync", name: "Data Sync", pending: 7, running: 1, failed: 2, completed: 912, concurrency: 2 },
  { id: "webhooks", name: "Webhooks", pending: 34, running: 6, failed: 5, completed: 6204, concurrency: 8 },
];

const MOCK_JOBS = [
  { id: "job-001", queue: "Email Delivery", type: "send_invoice", status: "running", startedAt: "2026-03-23T19:10:00Z", payload: '{"invoiceId":"INV-001"}' },
  { id: "job-002", queue: "SMS Notifications", type: "otp_delivery", status: "completed", startedAt: "2026-03-23T19:09:30Z", payload: '{"phone":"+1555..."}' },
  { id: "job-003", queue: "Data Sync", type: "crm_sync", status: "failed", startedAt: "2026-03-23T19:08:00Z", payload: '{"source":"salesforce"}' },
  { id: "job-004", queue: "Report Generation", type: "monthly_report", status: "pending", startedAt: null, payload: '{"period":"2026-02"}' },
  { id: "job-005", queue: "Webhooks", type: "event_dispatch", status: "running", startedAt: "2026-03-23T19:11:00Z", payload: '{"event":"order.created"}' },
  { id: "job-006", queue: "Email Delivery", type: "marketing_blast", status: "pending", startedAt: null, payload: '{"campaignId":"camp-42"}' },
];

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    running: { label: "Running", className: "bg-blue-500/15 text-blue-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    pending: { label: "Pending", className: "bg-amber-500/15 text-amber-400", icon: <Clock className="h-3 w-3" /> },
    completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { label: "Failed", className: "bg-rose-500/15 text-rose-400", icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {s.icon} {s.label}
    </span>
  );
}

function QueuePage() {
  const queryClient = useQueryClient();
  const orgHeader = getHeaders();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const { data, isRefetching, isError } = useQuery({
    queryKey: ["job-queue"],
    queryFn: () =>
      fetch("/api/v1/queue", { headers: orgHeader })
        .then((r) => r.json())
        .catch(() => null),
    placeholderData: (prev) => prev,
    refetchInterval: 5000,
  });

  const pauseMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const res = await fetch(`/api/v1/queue/${queueId}/pause`, {
        method: "POST",
        headers: orgHeader,
      });
      if (!res.ok) throw new Error("Failed to pause queue");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Queue paused");
      queryClient.invalidateQueries({ queryKey: ["job-queue"] });
    },
    onError: () => toast.error("Failed to pause queue"),
  });

  const resumeMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const res = await fetch(`/api/v1/queue/${queueId}/resume`, {
        method: "POST",
        headers: orgHeader,
      });
      if (!res.ok) throw new Error("Failed to resume queue");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Queue resumed");
      queryClient.invalidateQueries({ queryKey: ["job-queue"] });
    },
    onError: () => toast.error("Failed to resume queue"),
  });

  const clearMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const res = await fetch(`/api/v1/queue/${queueId}/clear`, {
        method: "DELETE",
        headers: orgHeader,
      });
      if (!res.ok) throw new Error("Failed to clear queue");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Queue cleared");
      queryClient.invalidateQueries({ queryKey: ["job-queue"] });
    },
    onError: () => toast.error("Failed to clear queue"),
  });

  // Tick the "seconds ago" counter every second
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const queues = (data as any)?.queues ?? [];
  const jobs = (data as any)?.jobs ?? [];

  const totalPending = queues.reduce((s: number, q: any) => s + (q.pending ?? 0), 0);
  const totalRunning = queues.reduce((s: number, q: any) => s + (q.running ?? 0), 0);
  const totalFailed = queues.reduce((s: number, q: any) => s + (q.failed ?? 0), 0);
  const totalCompleted = queues.reduce((s: number, q: any) => s + (q.completed ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Queue Management</h1>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`relative flex h-2 w-2`}>
                {isError ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </>
                )}
              </span>
              {isError ? "Error" : `Last updated: ${secondsAgo}s ago`}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">Monitor and manage background job queues</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={isRefetching}
          onClick={() => queryClient.invalidateQueries({ queryKey: ["job-queue"] })}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5${isRefetching ? " animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Pending", value: totalPending, color: "text-amber-400", icon: <Clock className="h-4 w-4" /> },
          { label: "Running", value: totalRunning, color: "text-blue-400", icon: <Loader2 className="h-4 w-4" /> },
          { label: "Failed", value: totalFailed, color: "text-rose-400", icon: <AlertCircle className="h-4 w-4" /> },
          { label: "Completed", value: totalCompleted, color: "text-emerald-400", icon: <CheckCircle2 className="h-4 w-4" /> },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>{stat.value.toLocaleString()}</p>
                </div>
                <div className={`${stat.color} opacity-60`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Queues</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Queue</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Pending</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Running</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Failed</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Completed</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Concurrency</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((q: any) => (
                <tr key={q.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{q.name}</td>
                  <td className="px-4 py-3 text-sm text-amber-400">{q.pending}</td>
                  <td className="px-4 py-3 text-sm text-blue-400">{q.running}</td>
                  <td className="px-4 py-3 text-sm text-rose-400">{q.failed}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{q.completed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{q.concurrency}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={pauseMutation.isPending}
                        onClick={() => pauseMutation.mutate(q.id)}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={resumeMutation.isPending}
                        onClick={() => resumeMutation.mutate(q.id)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300"
                        disabled={clearMutation.isPending}
                        onClick={() => clearMutation.mutate(q.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Job ID</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Queue</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Started</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Payload</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: any) => (
                <tr key={job.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{job.id}</td>
                  <td className="px-4 py-3 text-sm">{job.queue}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">{job.type}</td>
                  <td className="px-4 py-3">{statusBadge(job.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground truncate max-w-[200px]">{job.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
