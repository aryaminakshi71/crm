import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, LoadingSkeleton } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, TrendingUp, Users, Target, Plus,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/marketing/lead-scoring")({
  component: MarketingLeadScoringPage,
});

// Scoring rules fetched from the API
const SCORING_RULES: Array<{
  id: string;
  name: string;
  points: number;
  category: string;
  active: boolean;
}> = [];

function MarketingLeadScoringPage() {
  const { data: statsData, isLoading, refetch, isError} = useQuery({
    queryKey: ["marketing", "stats", "lead-scoring"],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/v1/marketing/stats`,
          { headers: { "Content-Type": "application/json", ...getOrgHeader() } },
        );
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    placeholderData: (prev) => prev,
  });

  const stats = statsData ?? {};

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <LoadingSkeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => (refetch as () => void)()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Lead Scoring</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-foreground">Lead Scoring</h1>
            <p className="text-muted-foreground text-sm">
              Configure scoring rules to automatically qualify marketing leads.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Add Rule
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
              <p className="text-xl font-bold">{((stats as any).totalLeads ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Target className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hot Leads</p>
              <p className="text-xl font-bold text-red-600">{((stats as any).hotLeads ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Warm Leads</p>
              <p className="text-xl font-bold text-yellow-600">{((stats as any).warmLeads ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
              <p className="text-xl font-bold text-blue-600">{(stats as any).avgScore ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scoring Rules */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Scoring Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {SCORING_RULES.length === 0 ? (
            <EmptyState
              icon={<Star className="h-8 w-8 text-primary/40" />}
              title="No scoring rules configured"
              description="Add rules to automatically score leads based on their behavior."
            />
          ) : (
            <div className="space-y-2">
              {SCORING_RULES.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={rule.active}
                      readOnly
                      className="rounded accent-primary"
                    />
                    <div>
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{rule.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        rule.points >= 20
                          ? "bg-red-100 text-red-800"
                          : rule.points >= 10
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      +{rule.points} pts
                    </Badge>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
