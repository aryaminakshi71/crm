import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/social/analytics")({
  component: AnalyticsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_PLATFORM_STATS = [
  { platform: "Instagram", icon: Instagram, followers: "18.5K", change: "+12%", color: "text-pink-500" },
  { platform: "Twitter", icon: Twitter, followers: "12.3K", change: "+8%", color: "text-sky-500" },
  { platform: "LinkedIn", icon: Linkedin, followers: "8.9K", change: "+15%", color: "text-blue-600" },
  { platform: "Facebook", icon: Facebook, followers: "5.5K", change: "+3%", color: "text-blue-500" },
];

const MOCK_TOP_POSTS = [
  { id: "p1", content: "Behind the scenes of our new product launch!", platform: "Instagram", likes: 342, reach: "4.2K" },
  { id: "p2", content: "We're hiring! Join our growing team.", platform: "LinkedIn", likes: 234, reach: "8.9K" },
  { id: "p3", content: "Excited to announce our partnership with @techleader", platform: "Twitter", likes: 567, reach: "12K" },
];

function AnalyticsPage() {
  const navigate = useNavigate();

  const { data: analyticsData } = useQuery({
    queryKey: ["social", "analytics"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/analytics`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: postsData } = useQuery({
    queryKey: ["social", "posts", "top"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/posts?limit=5&sort=likes`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const topPosts = postsData?.data?.length
    ? postsData.data.map((p: any) => ({
        id: p.id,
        content: p.content ?? "",
        platform: p.platform ?? "Unknown",
        likes: p.likes ?? 0,
        reach: p.reach ?? "0",
      }))
    : MOCK_TOP_POSTS;

  const totalFollowers = analyticsData?.totalFollowers ?? 45200;
  const totalLikes = analyticsData?.totalLikes ?? 2400;
  const totalComments = analyticsData?.totalComments ?? 456;
  const totalShares = analyticsData?.totalShares ?? 789;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Analytics</h2>
            <p className="text-muted-foreground text-sm">Track your social media performance</p>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {MOCK_PLATFORM_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.platform} to={`/app/social/analytics/${stat.platform.toLowerCase()}` as string}>
              <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <Badge className="bg-green-100 text-green-800">{stat.change}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stat.followers}</p>
                  <p className="text-sm text-muted-foreground">{stat.platform}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Followers</p>
                <p className="text-xl font-bold">{totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : totalFollowers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-xl font-bold">{totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}K` : totalLikes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comments</p>
                <p className="text-xl font-bold">{totalComments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Share2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shares</p>
                <p className="text-xl font-bold">{totalShares}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Performing Posts</h3>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {topPosts.map((post: any) => (
              <div key={post.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Badge variant="outline">{post.platform}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{post.content}</p>
                  <p className="text-xs text-muted-foreground">Reach: {post.reach}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {post.reach}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
