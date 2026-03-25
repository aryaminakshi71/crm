import { Button, Card, CardContent, Badge } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Trash2,
  Search,
  Phone,
  Clock,
  Volume2,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { communicationsApi } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  duration: z.string().optional().default(""),
});

export const Route = createFileRoute("/app/communications/voice/recordings")({
  validateSearch: searchSchema,
  component: RecordingsPage,
});

interface Recording {
  id: string;
  contactName?: string;
  phone?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  createdAt: string;
  storageUrl?: string;
}


// Generate chart data: recordings per day for the last 7 days
function buildChartData(recordings: Recording[]) {
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    days[label] = 0;
  }
  recordings.forEach((r) => {
    const d = new Date(r.createdAt);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    if (label in days) days[label] += 1;
  });
  return Object.entries(days).map(([day, count]) => ({ day, count }));
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

const DURATION_FILTERS: Record<string, [number, number]> = {
  short: [0, 180],
  medium: [180, 600],
  long: [600, Infinity],
};

function RecordingsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "recordings"],
    queryFn: () => communicationsApi.calls.list({ limit: 100, direction: "inbound" }),
    placeholderData: (prev) => prev,
  });

  const recordings: Recording[] = data?.data?.length
    ? data.data.map((c: any) => ({
        id: c.id,
        contactName: c.contactName,
        phone: c.to ?? c.from,
        durationSeconds: c.durationSeconds,
        fileSizeBytes: c.fileSizeBytes,
        createdAt: c.createdAt,
        storageUrl: c.storageUrl,
      }))
    : [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // communicationsApi does not expose a DELETE /calls/:id endpoint yet;
      // fall back to raw fetch so the stub is wired but won't break.
      const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (orgId) headers["x-organization-id"] = orgId;
      const res = await fetch(`${API_BASE}/communications/calls/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "recordings"] });
      toast.success("Recording deleted");
    },
    onError: () => toast.error("Failed to delete recording"),
  });

  const handleDownload = (rec: Recording) => {
    if (rec.storageUrl) {
      window.open(rec.storageUrl, "_blank");
    } else {
      toast.info("No download URL available for this recording");
    }
  };

  const q = search.q ?? "";
  const durationFilter = search.duration ?? "";

  const filtered = recordings.filter((rec) => {
    const matchQ =
      !q ||
      rec.contactName?.toLowerCase().includes(q.toLowerCase()) ||
      rec.phone?.includes(q);
    const range = DURATION_FILTERS[durationFilter];
    const matchDuration = !range || (
      (rec.durationSeconds ?? 0) >= range[0] &&
      (rec.durationSeconds ?? 0) < range[1]
    );
    return matchQ && matchDuration;
  });

  const chartData = buildChartData(recordings);

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load recordings. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/voice" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Call Recordings</h2>
            <p className="text-muted-foreground text-sm">Listen, download and manage call recordings</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<BarChart2 className="h-4 w-4" />}
          onClick={() => setShowChart((v) => !v)}
        >
          {showChart ? "Hide Chart" : "Show Chart"}
        </Button>
      </div>

      {/* Chart */}
      {showChart && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <p className="text-sm font-medium mb-4">Recordings per Day (Last 7 Days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ fontSize: 12, fontWeight: 600 }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" name="Recordings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value }) })
            }
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["", "short", "medium", "long"] as const).map((f) => (
            <Button
              key={f}
              variant={durationFilter === f ? "primary" : "outline"}
              size="sm"
              onClick={() => navigate({ search: (prev) => ({ ...prev, duration: f }) })}
            >
              {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline">{recordings.length} total recordings</Badge>
        <Badge variant="outline">
          {Math.round(recordings.reduce((a, r) => a + (r.durationSeconds ?? 0), 0) / 60)} min total
        </Badge>
        <Badge variant="outline">
          {(recordings.reduce((a, r) => a + (r.fileSizeBytes ?? 0), 0) / (1024 * 1024)).toFixed(1)} MB stored
        </Badge>
      </div>

      {/* Recordings List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading recordings…</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((rec) => (
                <div key={rec.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary/10 shrink-0"
                    onClick={() => setPlayingId(playingId === rec.id ? null : rec.id)}
                  >
                    {playingId === rec.id ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 text-primary" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{rec.contactName ?? rec.phone ?? "Unknown"}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rec.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {rec.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {rec.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(rec.durationSeconds)}
                      </span>
                      <span>{formatSize(rec.fileSizeBytes)}</span>
                    </div>
                  </div>

                  {playingId === rec.id && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full shrink-0">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <div className="w-24 h-1 bg-primary/30 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-primary rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(rec)}
                      title="Download recording"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(rec.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete recording"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recordings match your filters
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
