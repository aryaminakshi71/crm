import { Button, Card, CardContent } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  TrendingUp,
  TrendingDown,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react";

export const Route = createFileRoute("/app/social/analytics/$accountId")({
  component: AccountAnalyticsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_ANALYTICS = {
  followers: "18.5K",
  followersChange: "+12% this month",
  engagement: "4.8%",
  engagementChange: "+0.5% this week",
  reach: "125K",
  reachChange: "+18% this month",
  posts: "28",
  postsLabel: "This week",
};

function AccountAnalyticsPage() {
  const { accountId } = Route.useParams();
  const navigate = useNavigate();

  const analyticsQuery = useQuery({
    queryKey: ["social", "analytics", accountId],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/accounts/${accountId}/analytics`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch social analytics");
      return res.json();
    },
  });

  const analytics = analyticsQuery.data ?? MOCK_ANALYTICS;

  const platform = accountId === "instagram" ? "Instagram" : accountId === "twitter" ? "Twitter" : accountId === "linkedin" ? "LinkedIn" : "Facebook";
  const Icon = accountId === "instagram" ? Instagram : accountId === "twitter" ? Twitter : accountId === "linkedin" ? Linkedin : Facebook;

  if (analyticsQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social/analytics" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6" />
            <div>
              <h2 className="font-bold text-xl">{platform} Analytics</h2>
              <p className="text-muted-foreground text-sm">Detailed metrics for {platform}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="text-2xl font-bold">{analytics.followers ?? MOCK_ANALYTICS.followers}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {analytics.followersChange ?? MOCK_ANALYTICS.followersChange}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">{analytics.engagement ?? MOCK_ANALYTICS.engagement}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {analytics.engagementChange ?? MOCK_ANALYTICS.engagementChange}
                </p>
              </div>
              <Heart className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reach</p>
                <p className="text-2xl font-bold">{analytics.reach ?? MOCK_ANALYTICS.reach}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {analytics.reachChange ?? MOCK_ANALYTICS.reachChange}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posts</p>
                <p className="text-2xl font-bold">{analytics.posts ?? MOCK_ANALYTICS.posts}</p>
                <p className="text-xs text-muted-foreground">{analytics.postsLabel ?? MOCK_ANALYTICS.postsLabel}</p>
              </div>
              <Share2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Engagement Over Time</h3>
          <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Chart visualization would appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
