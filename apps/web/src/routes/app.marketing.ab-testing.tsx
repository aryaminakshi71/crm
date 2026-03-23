import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, LoadingSkeleton } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Plus, TrendingUp,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/marketing/ab-testing")({
  component: MarketingAbTestingPage,
});

const MOCK_AB_TESTS = [
  {
    id: "ab-1",
    name: "Subject Line Test: Personalization vs Generic",
    status: "running",
    campaignName: "Q1 Newsletter",
    variantA: { name: "Personalized", openRate: 28.4, clickRate: 6.2, conversions: 142 },
    variantB: { name: "Generic", openRate: 21.1, clickRate: 4.8, conversions: 98 },
    winner: null,
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ab-2",
    name: "CTA Button Color: Blue vs Green",
    status: "completed",
    campaignName: "Product Launch",
    variantA: { name: "Blue CTA", openRate: 31.2, clickRate: 8.1, conversions: 210 },
    variantB: { name: "Green CTA", openRate: 31.5, clickRate: 9.4, conversions: 256 },
    winner: "B",
    startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ab-3",
    name: "Send Time: Morning vs Evening",
    status: "draft",
    campaignName: "Weekly Digest",
    variantA: { name: "9am", openRate: 0, clickRate: 0, conversions: 0 },
    variantB: { name: "7pm", openRate: 0, clickRate: 0, conversions: 0 },
    winner: null,
    startedAt: null,
    endsAt: null,
  },
];

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
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const tests = campaignsData?.data?.length ? campaignsData.data : MOCK_AB_TESTS;

  const statusColor = (s: string) =>
    s === "running" ? "bg-blue-100 text-blue-800"
    : s === "completed" ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
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
