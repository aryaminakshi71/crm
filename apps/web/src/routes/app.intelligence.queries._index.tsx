import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Clock,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { intelligenceApi } from "@/lib/api";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/intelligence/queries/_index")({
  validateSearch: searchSchema,
  component: QueriesPage,
});

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  return new Date(val).toLocaleString();
}

function QueriesPage() {
  const { page = 1 } = useSearch({ from: "/app/intelligence/queries/_index" });
  const navigate = useNavigate({ from: "/app/intelligence/queries" });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [queryText, setQueryText] = useState("");
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [selectedSavedQuery, setSelectedSavedQuery] = useState<string>("");

  const { data: savedData, isLoading: savedLoading, refetch } = useQuery({
    queryKey: ["intelligence", "queries", page],
    queryFn: () => intelligenceApi.queries.list(),
  });

  const runMutation = useMutation({
    mutationFn: (query: string) => intelligenceApi.queries.run(query),
    onSuccess: (result) => {
      const rows: any[] = (result as any)?.data ?? (result as any)?.rows ?? (Array.isArray(result) ? result : []);
      setQueryResults(rows);
      if (rows.length > 0) {
        setQueryColumns(Object.keys(rows[0]));
      }
    },
  });

  const savedQueries: any[] = (savedData as any)?.data ?? (Array.isArray(savedData) ? savedData : []);
  const total = (savedData as any)?.total ?? (savedData as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleRun() {
    if (!queryText.trim()) return;
    runMutation.mutate(queryText.trim());
  }

  function loadSavedQuery(query: any) {
    setQueryText(query.query ?? query.sql ?? query.content ?? "");
    setSelectedSavedQuery(query.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Query Builder</h1>
          <p className="text-muted-foreground mt-1">
            Run ad-hoc queries against your business data
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Saved Queries Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Saved Queries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {savedLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-10 rounded bg-muted" />
                  ))}
                </div>
              ) : savedQueries.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No saved queries
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {savedQueries.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => loadSavedQuery(q)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                        selectedSavedQuery === q.id ? "bg-primary/5 border-l-2 border-primary" : ""
                      }`}
                    >
                      <p className="text-sm font-medium truncate">
                        {q.name ?? q.title ?? "Untitled Query"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(q.lastRunAt ?? q.updatedAt ?? q.createdAt)}
                        </span>
                      </div>
                      {q.resultCount != null && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {q.resultCount} rows
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Query Editor + Results */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Query Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
                placeholder="SELECT * FROM contacts WHERE created_at > '2025-01-01' LIMIT 100"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                spellCheck={false}
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRun}
                  disabled={runMutation.isPending || !queryText.trim()}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {runMutation.isPending ? "Running…" : "Run Query"}
                </Button>
                {runMutation.isError && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Query failed. Check syntax and try again.
                  </div>
                )}
                {queryResults && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {queryResults.length} row{queryResults.length !== 1 ? "s" : ""} returned
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {queryResults !== null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {queryResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Query returned no results.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b border-border">
                          {queryColumns.map((col) => (
                            <th
                              key={col}
                              className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            {queryColumns.map((col) => (
                              <td
                                key={col}
                                className="px-4 py-2.5 text-muted-foreground text-xs font-mono max-w-[200px] truncate"
                              >
                                {row[col] == null
                                  ? <span className="text-zinc-600">NULL</span>
                                  : String(row[col])}
                              </td>
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

          {runMutation.isPending && (
            <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Running query…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
