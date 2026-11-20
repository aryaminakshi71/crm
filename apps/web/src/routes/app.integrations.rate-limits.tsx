import { Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gauge,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

export const Route = createFileRoute("/app/integrations/rate-limits")({
  component: RateLimitsPage,
});

function RateMeter({ limit, remaining }: { limit: number; remaining: number }) {
  const pct = limit > 0 ? (remaining / limit) * 100 : 0;
  const color = pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{remaining.toLocaleString()} remaining</span>
        <span className="text-muted-foreground">{limit.toLocaleString()} limit</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-xs text-right text-muted-foreground">{Math.round(pct)}% available</div>
    </div>
  );
}

function RateLimitsPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["integration", "connectors", "rate-limits"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/connectors`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
  });

  const connectors = ((data as any)?.data ?? []).filter(
    (c: any) => c.rateLimit,
  );

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
          <Gauge className="h-6 w-6" />
          Rate Limits
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor API rate limit usage across all connectors.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {connectors.map((conn: any) => (
            <Card key={conn.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{conn.name}</CardTitle>
                <p className="text-xs text-muted-foreground capitalize">{conn.type}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <RateMeter limit={conn.rateLimit.limit} remaining={conn.rateLimit.remaining} />
                {conn.rateLimit.resetAt && (
                  <p className="text-xs text-muted-foreground">
                    Resets at {new Date(conn.rateLimit.resetAt).toLocaleTimeString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {connectors.length === 0 && (
            <div className="col-span-2">
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No rate limit data available.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
