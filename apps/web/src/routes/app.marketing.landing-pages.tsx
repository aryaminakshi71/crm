import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, LoadingSkeleton } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, Plus, Eye, MousePointerClick, ExternalLink,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/marketing/landing-pages")({
  component: MarketingLandingPagesPage,
});

const _MOCK_LANDING_PAGES = [
  {
    id: "lp-1",
    name: "Product Launch 2025",
    status: "published",
    url: "https://example.com/launch",
    views: 8420,
    conversions: 612,
    conversionRate: 7.3,
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lp-2",
    name: "Free Trial Sign-Up",
    status: "published",
    url: "https://example.com/trial",
    views: 15230,
    conversions: 1847,
    conversionRate: 12.1,
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lp-3",
    name: "Webinar Registration Q2",
    status: "draft",
    url: null,
    views: 0,
    conversions: 0,
    conversionRate: 0,
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lp-4",
    name: "Partnership Inquiry",
    status: "archived",
    url: "https://example.com/partner",
    views: 3100,
    conversions: 87,
    conversionRate: 2.8,
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function MarketingLandingPagesPage() {
  const { data: campaignsData, isLoading, refetch, isError} = useQuery({
    queryKey: ["marketing", "campaigns", "landing-pages"],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/v1/marketing/campaigns?type=landing_page&limit=50`,
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

  const pages = (campaignsData as any)?.data ?? [];

  const statusColor = (s: string) =>
    s === "published" ? "bg-green-100 text-green-800"
    : s === "draft" ? "bg-gray-100 text-gray-800"
    : "bg-orange-100 text-orange-800";

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
        {[...Array(3)].map((_, i) => <LoadingSkeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Landing Pages</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-foreground">Landing Pages</h1>
            <p className="text-muted-foreground text-sm">
              Build and publish campaign landing pages.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New Landing Page
          </Button>
        </div>
      </div>

      {pages.length === 0 ? (
        <EmptyState
          icon={<Layout className="h-8 w-8 text-primary/40" />}
          title="No landing pages yet"
          description="Create your first landing page to start capturing leads from your campaigns."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((page: any) => (
            <Card key={page.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Layout className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{page.name}</CardTitle>
                      {page.url && (
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {page.url}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <Badge className={statusColor(page.status ?? "draft")}>
                    {page.status ?? "draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Views</p>
                    <p className="font-bold text-sm flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" />
                      {(page.views ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="font-bold text-sm flex items-center justify-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      {(page.conversions ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Conv. Rate</p>
                    <p className="font-bold text-sm">{page.conversionRate ?? 0}%</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  {page.url && (
                    <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="h-3 w-3" />}>
                      Preview
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
