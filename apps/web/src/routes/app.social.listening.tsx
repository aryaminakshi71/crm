import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  Search,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  AlertCircle,
  Instagram,
  Twitter,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "@/lib/api";

export const Route = createFileRoute("/app/social/listening")({
  component: ListeningPage,
});

const TRENDING_TOPICS = [
  { topic: "#NucleoOne", mentions: 245, trend: "+15%" },
  { topic: "#SaaS", mentions: 1203, trend: "+8%" },
  { topic: "#ProductLaunch", mentions: 892, trend: "+23%" },
  { topic: "#TechNews", mentions: 2341, trend: "+5%" },
];

function ListeningPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["social", "listening", "alerts"],
    queryFn: () => socialApi.listening.list(),
    placeholderData: (prev) => prev,
  });

  const alerts = (data as any)?.data ?? [];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter": return <Twitter className="h-4 w-4 text-sky-500" />;
      case "instagram": return <Instagram className="h-4 w-4 text-pink-500" />;
      default: return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-100 text-green-800";
      case "negative": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => (refetch as () => void)()}>Retry</Button>
    </div>
  );
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Social Listening</h2>
            <p className="text-muted-foreground text-sm">Monitor brand mentions and trends</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" /> Recent Alerts
              </h3>
              <div className="space-y-4">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(alert.platform)}
                        <span className="text-sm font-medium">{alert.author}</span>
                        <Badge className={getSentimentColor(alert.sentiment)}>{alert.sentiment}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm">{alert.content}</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" leftIcon={<MessageSquare className="h-3 w-3" />}>
                        Reply
                      </Button>
                      <Button variant="outline" size="sm" leftIcon={<Heart className="h-3 w-3" />}>
                        Like
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Trending Topics
              </h3>
              <div className="space-y-3">
                {TRENDING_TOPICS.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-sm">{topic.topic}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium">{topic.mentions}</p>
                      <p className="text-xs text-green-600">{topic.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Keywords to Track</h3>
              <div className="flex flex-wrap gap-2">
                {["Nucleo One", "SaaS Platform", "#NucleoOne", "@nucleoone", "AI Agents"].map((keyword) => (
                  <span key={keyword} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Add Keyword
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
