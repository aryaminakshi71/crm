import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Pagination } from "@/components/ui/pagination";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Clock,
  Phone,
  PhoneMissed,
  RefreshCw,
} from "lucide-react";
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
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/communications/voice/_index")({
  validateSearch: searchSchema,
  component: VoicePage,
});

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  return new Date(val).toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  missed: "bg-red-500/10 text-red-400 border-red-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  initiated: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ringing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  answered: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const PAGE_SIZE = 50;

// Mock call volume data for the chart (last 7 days)
const CALL_VOLUME_DATA = [
  { day: "Mon", calls: 12 },
  { day: "Tue", calls: 19 },
  { day: "Wed", calls: 8 },
  { day: "Thu", calls: 25 },
  { day: "Fri", calls: 17 },
  { day: "Sat", calls: 5 },
  { day: "Sun", calls: 3 },
];

function VoicePage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/communications/voice/_index" });
  const navigate = useNavigate({ from: "/app/communications/voice/_index" });
  const setPage = (v: number) =>
    navigate({ search: (p) => ({ ...p, page: v }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "calls", page],
    queryFn: () =>
      fetch(`/api/v1/communications/calls?page=${page}&limit=${PAGE_SIZE}`, {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const calls: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const callsToday = calls.filter((c) => {
    const d = new Date(c.createdAt ?? c.startedAt ?? "");
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  const completedCalls = calls.filter((c) => c.status === "completed");
  const avgDuration =
    completedCalls.length > 0
      ? Math.round(
          completedCalls.reduce((sum, c) => sum + (c.duration ?? 0), 0) /
            completedCalls.length,
        )
      : 0;

  const missedCalls = calls.filter((c) => c.status === "missed").length;

  const stats = [
    { label: "Calls Today", value: callsToday, icon: Phone, color: "text-blue-400" },
    { label: "Avg Duration", value: formatDuration(avgDuration), icon: Clock, color: "text-purple-400" },
    { label: "Missed Calls", value: missedCalls, icon: PhoneMissed, color: "text-red-400" },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Failed to load calls. Please try again.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voice Calls</h1>
          <p className="text-muted-foreground mt-1">
            Inbound and outbound call history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Volume (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CALL_VOLUME_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded bg-muted" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Phone className="h-8 w-8" />
              <p className="text-sm">No calls recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Direction
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      From
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      To
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Recording
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr
                      key={call.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {call.direction === "inbound" ? (
                          <span className="flex items-center gap-1 text-green-400 font-medium">
                            <ArrowDown className="h-4 w-4" />
                            Inbound
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-400 font-medium">
                            <ArrowUp className="h-4 w-4" />
                            Outbound
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {call.from ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {call.to ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {call.contactName ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        {formatDuration(call.duration)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            STATUS_COLORS[call.status] ??
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {call.status ?? "unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(call.createdAt ?? call.startedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {call.recordingUrl ? (
                          <a
                            href={call.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-xs"
                          >
                            Play
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
