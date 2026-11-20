import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { z } from "zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { intelligenceApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/app/intelligence/reports/_index")({
  validateSearch: searchSchema,
  component: ReportsPage,
});

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const FORMAT_COLORS: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-400 border-red-500/20",
  CSV: "bg-green-500/10 text-green-400 border-green-500/20",
  dashboard: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Excel: "bg-green-600/10 text-green-500 border-green-600/20",
};

const TYPE_COLORS: Record<string, string> = {
  revenue: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pipeline: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  activity: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  performance: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  custom: "bg-muted text-muted-foreground",
};

function ReportsPage() {
  const { q = "", type: typeFilter = "" } = useSearch({ from: "/app/intelligence/reports/_index" });
  const navigate = useNavigate({ from: "/app/intelligence/reports" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setTypeFilter = (v: string) => navigate({ search: (p) => ({ ...p, type: v || undefined }) });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "reports"],
    queryFn: () => intelligenceApi.reports.list(),
  });

  const generateMutation = useMutation({
    mutationFn: () => intelligenceApi.reports.generate({ type: "custom" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "reports"] });
    },
  });

  const reports: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const filteredReports = reports.filter((r) => {
    const matchesQ =
      !q ||
      (r.name ?? r.title ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesType =
      !typeFilter || (r.type ?? "") === typeFilter;
    return matchesQ && matchesType;
  });

  const today = new Date();
  const thisMonth = reports.filter((r) => {
    const d = new Date(r.createdAt ?? r.generatedAt ?? "");
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth()
    );
  }).length;

  const scheduled = reports.filter((r) => r.scheduled || r.scheduleEnabled).length;

  const stats = [
    { label: "Reports This Month", value: thisMonth, icon: FileText, color: "text-blue-400" },
    { label: "Scheduled Reports", value: scheduled, icon: Calendar, color: "text-green-400" },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load reports.</p>
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
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage business intelligence reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? "Generating…" : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search reports…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All types</option>
          <option value="revenue">Revenue</option>
          <option value="pipeline">Pipeline</option>
          <option value="activity">Activity</option>
          <option value="performance">Performance</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {/* Report Generation Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Reports Generated per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={[
                { month: "Oct", PDF: 4, CSV: 7, Dashboard: 2 },
                { month: "Nov", PDF: 6, CSV: 9, Dashboard: 3 },
                { month: "Dec", PDF: 3, CSV: 5, Dashboard: 2 },
                { month: "Jan", PDF: 8, CSV: 12, Dashboard: 5 },
                { month: "Feb", PDF: 11, CSV: 14, Dashboard: 6 },
                { month: "Mar", PDF: 9, CSV: 11, Dashboard: 4 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="PDF" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="CSV" fill="#10b981" stackId="a" />
              <Bar dataKey="Dashboard" fill="#6366f1" radius={[0, 0, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded bg-muted" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-sm">{q || typeFilter ? "No reports match your filters." : "No reports generated yet."}</p>
              {!q && !typeFilter && (
                <Button size="sm" onClick={() => generateMutation.mutate()}>
                  <Plus className="h-4 w-4 mr-2" /> Generate First Report
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Report Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Format</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Generated</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scheduled</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Author</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {report.name ?? report.title ?? "Untitled Report"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {report.type ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              TYPE_COLORS[report.type] ??
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {report.type}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {report.format ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              FORMAT_COLORS[report.format] ??
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {report.format}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(report.generatedAt ?? report.lastGeneratedAt ?? report.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {report.scheduled || report.scheduleEnabled ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {report.author ?? report.createdBy ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {report.downloadUrl ? (
                          <a href={report.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <Download className="h-3.5 w-3.5 mr-1" /> Download
                            </Button>
                          </a>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                            <Download className="h-3.5 w-3.5 mr-1" /> Download
                          </Button>
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
    </div>
  );
}
