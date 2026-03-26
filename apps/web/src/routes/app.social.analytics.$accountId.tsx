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
  AlertCircle
} from "lucide-react";
import { socialApi } from "@/lib/api";

export const Route = createFileRoute("/app/social/analytics/$accountId")({
  component: AccountAnalyticsPage,
});

function AccountAnalyticsPage() {
  const { accountId } = Route.useParams();
  const navigate = useNavigate();

  const analyticsQuery = useQuery({
    queryKey: ["social", "analytics", accountId],
    retry: false,
    queryFn: () => socialApi.analytics.get(accountId),
    placeholderData: (prev) => prev,
  });
  if (analyticsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => analyticsQuery.refetch()}>Retry</Button>
    </div>
  );

  const analytics = (analyticsQuery.data as any) ?? {};

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
                <p className="text-2xl font-bold">{(analytics as any).followers ?? "—"}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {(analytics as any).followersChange ?? ""}
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
                <p className="text-2xl font-bold">{(analytics as any).engagement ?? "—"}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {(analytics as any).engagementChange ?? ""}
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
                <p className="text-2xl font-bold">{(analytics as any).reach ?? "—"}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {(analytics as any).reachChange ?? ""}
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
                <p className="text-2xl font-bold">{(analytics as any).posts ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{(analytics as any).postsLabel ?? ""}</p>
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
