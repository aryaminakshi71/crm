import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Hash, Search, TrendingUp, Plus, Copy,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/social/hashtags")({
  component: HashtagsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

interface Hashtag {
  tag: string;
  posts: number;
  trend: string;
  sentiment: "positive" | "neutral" | "negative";
}

function HashtagsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Hashtags come from the social analytics/listening alerts filtered by alertType=hashtag
  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["social", "hashtags"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/listening/alerts?alertType=hashtag`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch hashtags");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const hashtags: Hashtag[] = (data as any)?.data ?? [];

  const filteredHashtags = hashtags.filter((h) =>
    (h.tag ?? (h as any).keyword ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSentimentColor = (sentiment: Hashtag["sentiment"]) => {
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
            <h2 className="font-bold text-xl">Hashtag Suggestions</h2>
            <p className="text-muted-foreground text-sm">Discover and track trending hashtags</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Create Hashtag
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredHashtags.map((hashtag, idx) => (
              <div key={idx} className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{hashtag.tag ?? (hashtag as any).keyword}</p>
                    <p className="text-sm text-muted-foreground">{(hashtag.posts ?? 0).toLocaleString()} posts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getSentimentColor(hashtag.sentiment)}>{hashtag.sentiment}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {hashtag.trend}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Suggested Hashtags for Your Post</h3>
          <div className="flex flex-wrap gap-2">
            {["#NucleoOne", "#AI", "#MachineLearning", "#SaaS", "#Tech", "#Innovation", "#Startup", "#Productivity"].map((tag) => (
              <button
                key={tag}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
