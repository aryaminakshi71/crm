import { Card, CardContent, Button } from "@crm/ui";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "@/lib/api";
import {
  Share2,
  Users,
  BarChart3,
  Bell,
  Settings,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Hash,
  Target,
  Mail,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/social")({
  component: SocialLayout,
});

const SOCIAL_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/app/social", icon: BarChart3 },
  { id: "accounts", label: "Accounts", href: "/app/social/accounts", icon: Users },
  { id: "posts", label: "Posts", href: "/app/social/posts", icon: Share2 },
  { id: "calendar", label: "Calendar", href: "/app/social/posts/calendar", icon: Calendar },
  { id: "analytics", label: "Analytics", href: "/app/social/analytics", icon: BarChart3 },
  { id: "listening", label: "Listening", href: "/app/social/listening", icon: Bell },
  { id: "sentiment", label: "Sentiment", href: "/app/social/sentiment", icon: MessageSquare },
  { id: "competitors", label: "Competitors", href: "/app/social/competitors", icon: Target },
  { id: "influencers", label: "Influencers", href: "/app/social/influencers", icon: Users },
  { id: "campaigns", label: "Campaigns", href: "/app/social/campaigns", icon: Target },
  { id: "hashtags", label: "Hashtags", href: "/app/social/hashtags", icon: Hash },
  { id: "inbox", label: "Inbox", href: "/app/social/inbox", icon: Mail },
];

function SocialLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: accountsData } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => socialApi.accounts.list(),
  });

  const connectedAccounts = (accountsData as any)?.data ?? [];

  const stats = [
    { label: "Connected Accounts", value: String(connectedAccounts.length), icon: Users, color: "text-blue-500" },
    { label: "Posts This Week", value: "—", icon: Share2, color: "text-emerald-500" },
    { label: "Engagement Rate", value: "—", icon: BarChart3, color: "text-amber-500" },
    { label: "New Mentions", value: "—", icon: Bell, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl text-foreground">Social Media (Fanbean)</h1>
            <p className="text-muted-foreground text-sm">
              Schedule posts, analytics, and social listening
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {SOCIAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
