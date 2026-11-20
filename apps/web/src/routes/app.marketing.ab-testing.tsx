import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, LoadingSkeleton } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Plus, TrendingUp,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/marketing/ab-testing")({
  component: MarketingAbTestingPage,
});

function MarketingAbTestingPage() {
  const { data: campaignsData, isLoading, refetch, isError} = useQuery({
    queryKey: ["marketing", "ab-tests"],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/v1/marketing/campaigns?status=ab_test&limit=50`,
          { headers: { "Content-Type": "application/json", ...getOrgHeader() } },
        );
        if (!res.ok) return null;
        return res.json() as Promise<any>;
      } catch {
        return null;
      }
    },
    placeholderData: (prev) => prev,
  });

  const tests = (campaignsData as any)?.data ?? [];

  const statusColor = (s: string) =>
    s === "running" ? "bg-blue-100 text-blue-800"
    : s === "completed" ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => (refetch as () => void)()}>Retry</Button>
    </div>
  );
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <LoadingSkeleton key={i} className="h-36 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">A/B Testing</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-foreground">A/B Testing</h1>
            <p className="text-muted-foreground text-sm">
              Test variations of campaigns to optimize performance.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New A/B Test
          </Button>
        </div>
      </div>

      {tests.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="h-8 w-8 text-primary/40" />}
          title="No A/B tests yet"
          description="Create your first A/B test to start optimizing campaign performance."
        />
      ) : (
        <div className="space-y-4">
          {tests.map((test: any) => (
            <Card key={test.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Campaign: {test.campaignName ?? test.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.winner && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Variant {test.winner} Won
                      </span>
                    )}
                    <Badge className={statusColor(test.status ?? "draft")}>
                      {test.status ?? "draft"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[test.variantA, test.variantB].map((v: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        test.winner === (i === 0 ? "A" : "B")
                          ? "border-green-400 bg-green-50"
                          : "border-border/40 bg-muted/30"
                      }`}
                    >
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Variant {i === 0 ? "A" : "B"}: {v?.name ?? (i === 0 ? "A" : "B")}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Open Rate</p>
                          <p className="font-bold text-sm">{v?.openRate ?? 0}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Click Rate</p>
                          <p className="font-bold text-sm">{v?.clickRate ?? 0}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conversions</p>
                          <p className="font-bold text-sm">{v?.conversions ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
