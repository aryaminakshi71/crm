import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

function getOrgHeader(): Record<string, string> {
  const isDemo =
    typeof window !== "undefined" &&
    localStorage.getItem("demo_mode") === "true";
  const orgId = isDemo ? "demo-org" : undefined;
  if (!orgId && typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.companyId && !user.isDemo) {
          return { "x-organization-id": user.companyId };
        }
      } catch {}
    }
  }
  return orgId ? { "x-organization-id": orgId } : {};
}

export const Route = createFileRoute("/app/monitoring/incidents/$id")({
  component: IncidentDetailPage,
});

function IncidentDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [timelineNote, setTimelineNote] = useState("");
  const [timelineType, setTimelineType] = useState("update");

  const { data: incident, isLoading } = useQuery({
    queryKey: ["monitoring", "incidents", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/monitoring/incidents/${id}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: timelineData } = useQuery({
    queryKey: ["monitoring", "incidents", id, "timeline"],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/v1/monitoring/incidents/${id}/timeline`,
        { headers: { ...getOrgHeader() } },
      );
      if (!res.ok) return { items: [] };
      return res.json();
    },
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update incident");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "incidents", id] });
      queryClient.invalidateQueries({ queryKey: ["monitoring", "incidents"] });
      toast.success("Incident updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update incident"),
  });

  const addTimelineMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(
        `${API_BASE}/v1/monitoring/incidents/${id}/timeline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getOrgHeader() },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) throw new Error("Failed to add timeline entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monitoring", "incidents", id, "timeline"],
      });
      setTimelineNote("");
      toast.success("Timeline entry added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add timeline entry"),
  });

  const timeline: any[] = timelineData?.items ?? [];

  const severityColors: Record<string, string> = {
    low: "text-blue-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };

  if (isLoading) return <Loading />;

  if (!incident) {
    return (
      <div className="p-6">
        <p className="text-zinc-400">Incident not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-5 w-5 ${severityColors[incident.severity] ?? "text-zinc-400"}`}
            />
            <h1 className="text-2xl font-bold text-white">{incident.title}</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Created{" "}
            {incident.createdAt
              ? new Date(incident.createdAt).toLocaleString()
              : "Unknown"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={incident.status === "resolved" ? "default" : "destructive"}
          >
            {incident.status}
          </Badge>
          {incident.status !== "resolved" && (
            <Button
              size="sm"
              disabled={resolveIncidentMutation.isPending}
              onClick={() => resolveIncidentMutation.mutate({ status: "resolved" })}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              {resolveIncidentMutation.isPending ? "Resolving..." : "Resolve"}
            </Button>
          )}
          {incident.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              disabled={resolveIncidentMutation.isPending}
              onClick={() => resolveIncidentMutation.mutate({ status: "investigating" })}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Investigating
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-zinc-400">Severity</p>
            <p
              className={`text-sm font-medium capitalize ${severityColors[incident.severity] ?? "text-white"}`}
            >
              {incident.severity}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-zinc-400">Status</p>
            <p className="text-sm font-medium text-white capitalize">
              {incident.status}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-zinc-400">Affected Services</p>
            <p className="text-sm font-medium text-white">
              {incident.affectedServices ?? "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {incident.description && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">{incident.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Entry */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
                value={timelineType}
                onChange={(e) => setTimelineType(e.target.value)}
              >
                <option value="update">Update</option>
                <option value="action">Action</option>
                <option value="note">Note</option>
                <option value="resolution">Resolution</option>
              </select>
              <input
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white"
                value={timelineNote}
                onChange={(e) => setTimelineNote(e.target.value)}
                placeholder="Add timeline entry..."
              />
              <Button
                size="sm"
                disabled={!timelineNote.trim() || addTimelineMutation.isPending}
                onClick={() =>
                  addTimelineMutation.mutate({
                    type: timelineType,
                    note: timelineNote,
                  })
                }
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Timeline entries */}
          {timeline.length === 0 ? (
            <p className="text-xs text-zinc-500">No timeline entries yet.</p>
          ) : (
            <div className="space-y-2">
              {timeline.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex gap-3 p-3 rounded-lg bg-zinc-800"
                >
                  <div className="shrink-0">
                    <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{entry.note}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {entry.type} ·{" "}
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString()
                        : ""}
                    </p>
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
