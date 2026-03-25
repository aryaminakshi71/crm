import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loading,
} from "@crm/ui";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/intelligence/reports/$id")({
  component: IntelligenceReportDetailPage,
});

function IntelligenceReportDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const reportQuery = useQuery({
    queryKey: ["intelligence", "reports", id],
    queryFn: () => (nucleoApi as any).intelligence.reports.get(id),
    enabled: !!id,
  });

  const deleteReportMutation = useMutation({
    mutationFn: () => (nucleoApi as any).intelligence.reports.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "reports"] });
      toast.success("Report deleted");
      navigate({ to: "/app/intelligence/reports" });
    },
    onError: () => toast.error("Failed to delete report"),
  });

  const exportReportMutation = useMutation({
    mutationFn: () => (nucleoApi as any).intelligence.reports.export(id),
    onSuccess: (data: any) => {
      toast.success("Report exported successfully");
      // In a real implementation this would trigger a download
      console.info("Export result:", data);
    },
    onError: () => toast.error("Failed to export report"),
  });

  if (reportQuery.isLoading) {
    return <Loading />;
  }

  const report = reportQuery.data;

  if (!report) {
    return (
      <div className="p-6 space-y-4">
        <Link to="/app/intelligence/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
        <p className="text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app/intelligence/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Report Detail
          </h1>
          <Badge
            variant={
              report.riskBand === "high"
                ? "danger"
                : report.riskBand === "low"
                  ? "default"
                  : "secondary"
            }
          >
            {report.riskBand} risk
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportReportMutation.mutate()}
            disabled={exportReportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportReportMutation.isPending ? "Exporting…" : "Export"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteReportMutation.mutate()}
            disabled={deleteReportMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteReportMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Projected Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${Number(report.projectedRevenue ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Pipeline Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${Number(report.pipelineAmount ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Number(report.winRate ?? 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Avg Sales Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.avgSalesCycleDays ?? 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Number(report.confidence ?? 0).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {report.createdAt
                ? new Date(report.createdAt).toLocaleDateString()
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {Array.isArray(report.recommendations) &&
        report.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {report.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
