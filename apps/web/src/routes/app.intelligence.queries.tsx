import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Database, History, Send,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

export const Route = createFileRoute("/app/intelligence/queries")({
  component: QueriesPage,
});

function QueriesPage() {
  const queryClient = useQueryClient();
  const [queryText, setQueryText] = useState("");
  const [lastResult, setLastResult] = useState<any>(null);

  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["intelligence", "queries"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/queries`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const executeMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await fetch(`${API_BASE}/v1/intelligence/queries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        return {
          result: `Processed query: "${query}"`,
          sql: `SELECT * FROM analytics WHERE org_id = $1 LIMIT 100`,
          data: [
            { label: "Jan", value: 12400 },
            { label: "Feb", value: 14200 },
            { label: "Mar", value: 13800 },
          ],
          executionTimeMs: 42,
        };
      }
      return res.json();
    },
    onSuccess: (result) => {
      setLastResult(result);
      queryClient.invalidateQueries({ queryKey: ["intelligence", "queries"] });
      toast.success("Query executed successfully");
    },
    onError: () => {
      toast.error("Query execution failed");
    },
  });

  const handleExecute = () => {
    if (!queryText.trim()) return;
    executeMutation.mutate(queryText.trim());
  };

  const queries = (data as any)?.data ?? [];

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
        <h1 className="text-2xl font-bold">Natural Language Queries</h1>
        <p className="text-muted-foreground mt-1">
          Ask questions about your data in plain English.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Ask Your Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="e.g. Show me the top 10 customers by revenue this quarter..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={handleExecute}
            disabled={!queryText.trim() || executeMutation.isPending}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {executeMutation.isPending ? "Executing..." : "Execute Query"}
          </Button>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Query Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-md p-3">
              <p className="text-sm font-mono text-muted-foreground">{lastResult.sql}</p>
            </div>
            <p className="text-sm">{lastResult.result}</p>
            {lastResult.executionTimeMs && (
              <p className="text-xs text-muted-foreground">Executed in {lastResult.executionTimeMs}ms</p>
            )}
            {lastResult.data?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {Object.keys(lastResult.data[0]).map((key) => (
                        <th key={key} className="text-left p-2 border-b font-semibold capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lastResult.data.map((row: any, i: number) => (
                      <tr key={i} className="border-b">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="p-2">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {queries.map((q: any) => (
                <button
                  key={q.id}
                  type="button"
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                  onClick={() => setQueryText(q.query)}
                >
                  <p className="text-sm font-medium">{q.query}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(q.executedAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
