import { Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Share2,
  Users,
  BarChart3,
  Bell,
  TrendingUp,
  MessageSquare,
  Heart,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react";

export const Route = createFileRoute("/app/social/_index")({
  component: SocialDashboard,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_PLATFORMS = [
  { name: "Instagram", icon: Instagram, followers: "18.5K", color: "bg-pink-500" },
  { name: "Twitter", icon: Twitter, followers: "12.3K", color: "bg-sky-500" },
  { name: "LinkedIn", icon: Linkedin, followers: "8.9K", color: "bg-blue-600" },
  { name: "Facebook", icon: Facebook, followers: "5.5K", color: "bg-blue-500" },
];

const MOCK_RECENT_POSTS = [
  { id: "p1", platform: "Instagram", content: "Behind the scenes of our new product launch!", likes: 342, comments: 28, reach: "4.2K" },
  { id: "p2", platform: "Twitter", content: "Excited to announce our partnership with @techleader", likes: 567, comments: 45, reach: "12K" },
  { id: "p3", platform: "LinkedIn", content: "We're hiring! Join our growing team.", likes: 234, comments: 56, reach: "8.9K" },
];

const QUICK_ACTIONS = [
  { name: "Create Post", href: "/app/social/posts/new", icon: Share2 },
  { name: "View Analytics", href: "/app/social/analytics", icon: BarChart3 },
  { name: "Social Listening", href: "/app/social/listening", icon: Bell },
  { name: "Campaigns", href: "/app/social/campaigns", icon: MessageSquare },
];

function SocialDashboard() {
  const { data: postsData } = useQuery({
    queryKey: ["social", "posts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/posts?limit=10`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: ["social", "accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/accounts`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const recentPosts = postsData?.data?.length
    ? postsData.data.map((p: any) => ({
        id: p.id,
        platform: p.platform ?? "Unknown",
        content: p.content ?? "",
        likes: p.likes ?? 0,
        comments: p.comments ?? 0,
        reach: p.reach ?? "0",
      }))
    : MOCK_RECENT_POSTS;

  const platforms = accountsData?.data?.length
    ? accountsData.data.map((a: any) => ({
        name: a.platform ?? a.name ?? "Unknown",
        icon: Share2,
        followers: a.followers ? `${(a.followers / 1000).toFixed(1)}K` : "0",
        color: "bg-primary",
      }))
    : MOCK_PLATFORMS;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
              <action.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{action.name}</h3>
          </Link>
        ))}
      </div>

      {/* Platforms */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Connected Platforms</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform: any) => {
              const Icon = platform.icon;
              return (
                <div key={platform.name} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className={`h-8 w-8 rounded-full ${platform.color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">{platform.followers}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Recent Posts</h2>
          <div className="space-y-4">
            {recentPosts.map((post: any) => (
              <Link key={post.id} to="/app/social/posts" className="block">
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <Badge variant="outline">{post.platform}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.content}</p>
                    <p className="text-xs text-muted-foreground">Reach: {post.reach}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {post.comments}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
