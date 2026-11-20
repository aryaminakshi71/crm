import { Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, XCircle,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

export const Route = createFileRoute("/app/integrations/errors")({
  component: ErrorsPage,
});

function ErrorsPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["integration", "runs", "errors"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/runs?status=failed`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
  });

  const errors = (data as any)?.data ?? [];

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
          Integration Errors
        </h1>
        <p className="text-muted-foreground mt-1">
          Failed integration runs requiring attention.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <p className="text-sm text-rose-700 dark:text-rose-400">
            {errors.length} failed integration{errors.length !== 1 ? "s" : ""} need attention.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : errors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No errors found. All integrations are running smoothly.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Failed Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errors.map((run: any) => (
                <div key={run.id} className="p-4 rounded-lg border border-rose-200 dark:border-rose-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      <span className="font-medium text-sm">{run.event}</span>
                    </div>
                    <Badge variant="danger">failed</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>via <strong>{run.connector}</strong></span>
                    <span>{new Date(run.executedAt).toLocaleString()}</span>
                  </div>
                  {run.error && (
                    <div className="text-xs font-mono bg-muted px-2 py-1 rounded text-rose-600 dark:text-rose-400">
                      {run.error}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Duration: {run.durationMs}ms
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
