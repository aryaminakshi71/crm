import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { z } from "zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { intelligenceApi } from "@/lib/api";

const fallbackRfmData = [
  { segment: "Champions", count: 142, color: "#22c55e" },
  { segment: "Loyal", count: 235, color: "#3b82f6" },
  { segment: "At Risk", count: 89, color: "#f59e0b" },
  { segment: "Lost", count: 54, color: "#ef4444" },
  { segment: "New", count: 178, color: "#8b5cf6" },
  { segment: "Promising", count: 211, color: "#06b6d4" },
];

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/intelligence/rfm/_index")({
  validateSearch: searchSchema,
  component: RFMPage,
});

const SEGMENT_CONFIG: Record<
  string,
  { color: string; bg: string; desc: string }
> = {
  Champions: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    desc: "High recency, frequency & monetary value",
  },
  "Loyal Customers": {
    color: "text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/30",
    desc: "Consistent buyers with good value",
  },
  "Potential Loyalists": {
    color: "text-cyan-400",
    bg: "bg-cyan-500/15 border-cyan-500/30",
    desc: "Recent customers with potential",
  },
  "At Risk": {
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/30",
    desc: "Previously good customers going inactive",
  },
  Lost: {
    color: "text-red-400",
    bg: "bg-red-500/15 border-red-500/30",
    desc: "Inactive customers needing re-engagement",
  },
};

function getSegmentConfig(name: string) {
  return (
    SEGMENT_CONFIG[name] ?? {
      color: "text-muted-foreground",
      bg: "bg-muted border-border",
      desc: "",
    }
  );
}

function RFMPage() {
  const { q = "" } = useSearch({ from: "/app/intelligence/rfm/_index" });
  const navigate = useNavigate({ from: "/app/intelligence/rfm" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "rfm"],
    queryFn: () => intelligenceApi.rfm.get(),
  });

  const rfm: any = data ?? {};
  const segments: any[] = rfm.segments ?? rfm.data ?? (Array.isArray(rfm) ? rfm : []);
  const totalCustomers =
    rfm.totalCustomers ??
    segments.reduce((s, seg) => s + (seg.count ?? seg.customerCount ?? 0), 0);

  const filteredSegments = segments.filter((seg) =>
    !q || (seg.name ?? seg.segment ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load RFM data.</p>
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
          <h1 className="text-2xl font-bold">RFM Segmentation</h1>
          <p className="text-muted-foreground mt-1">
            Customer segments by Recency, Frequency, and Monetary value
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Filter segments…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Summary Stat */}
      <Card className="sm:max-w-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Customers
          </CardTitle>
          <Users className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* RFM Segment Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">RFM Segment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={
                  segments.length > 0
                    ? segments.map((seg) => ({
                        segment: seg.name ?? seg.segment ?? "Unknown",
                        count: seg.count ?? seg.customerCount ?? 0,
                        color:
                          fallbackRfmData.find(
                            (d) => d.segment === (seg.name ?? seg.segment),
                          )?.color ?? "#6366f1",
                      }))
                    : fallbackRfmData
                }
                margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} stroke="#888" />
                <YAxis type="category" dataKey="segment" axisLine={false} tickLine={false} fontSize={11} stroke="#888" width={72} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(v: number) => [v.toLocaleString(), "Customers"]}
                />
                <Bar dataKey="count" name="Customers" radius={[0, 6, 6, 0]}>
                  {(segments.length > 0
                    ? segments.map((seg) => ({
                        segment: seg.name ?? seg.segment ?? "Unknown",
                        color:
                          fallbackRfmData.find(
                            (d) => d.segment === (seg.name ?? seg.segment),
                          )?.color ?? "#6366f1",
                      }))
                    : fallbackRfmData
                  ).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Treemap-like Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-24" />
          ))}
        </div>
      ) : filteredSegments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
          <Users className="h-8 w-8" />
          <p className="text-sm">{q ? "No segments match your search." : "No RFM data available."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredSegments.map((seg) => {
            const name = seg.name ?? seg.segment ?? "Unknown";
            const count = seg.count ?? seg.customerCount ?? 0;
            const pct =
              seg.percentage ??
              (totalCustomers > 0
                ? ((count / totalCustomers) * 100).toFixed(1)
                : "0");
            const config = getSegmentConfig(name);
            const size = Number(pct);
            // Height proportional to segment size (min 80px, max 160px)
            const height = Math.max(80, Math.min(160, 80 + size));
            return (
              <div
                key={name}
                className={`rounded-lg border p-3 flex flex-col justify-between ${config.bg}`}
                style={{ minHeight: `${height}px` }}
              >
                <div>
                  <p className={`font-semibold text-sm ${config.color}`}>{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {config.desc}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-bold">{count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Table */}
      {!isLoading && filteredSegments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Segment</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Customers</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">%</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg Recency</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg Frequency</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg Monetary</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSegments.map((seg) => {
                    const name = seg.name ?? seg.segment ?? "Unknown";
                    const count = seg.count ?? seg.customerCount ?? 0;
                    const pct =
                      seg.percentage ??
                      (totalCustomers > 0
                        ? ((count / totalCustomers) * 100).toFixed(1)
                        : "0");
                    const config = getSegmentConfig(name);
                    return (
                      <tr
                        key={name}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2.5 h-2.5 rounded-full border ${config.bg}`}
                            />
                            <span className={config.color}>{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {pct}%
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {seg.recency ?? seg.avgRecency != null
                            ? `${seg.avgRecency ?? seg.recency}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {seg.frequency ?? seg.avgFrequency != null
                            ? `${seg.avgFrequency ?? seg.frequency}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {seg.monetary ?? seg.avgMonetary != null
                            ? `$${Number(seg.avgMonetary ?? seg.monetary).toLocaleString()}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
