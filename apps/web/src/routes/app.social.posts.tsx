import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  MoreHorizontal,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Clock,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/social/posts")({
  component: PostsPage,
});

interface Post {
  id: string;
  content: string;
  platform: string;
  scheduledFor?: string;
  status: "published" | "scheduled" | "draft";
  likes: number;
  comments: number;
  shares: number;
  reach?: number | string;
}

const MOCK_POSTS: Post[] = [
  { id: "p1", content: "Excited to announce our new product launch! Stay tuned for more details...", platform: "Instagram", status: "published", likes: 342, comments: 28, shares: 45, reach: "4.2K" },
  { id: "p2", content: "We're hiring! Join our amazing team. Check out open positions.", platform: "LinkedIn", status: "published", likes: 234, comments: 56, shares: 89, reach: "8.9K" },
  { id: "p3", content: "Behind the scenes at our latest photoshoot. #behindthescenes #nucleoone", platform: "Instagram", scheduledFor: "Tomorrow 10:00 AM", status: "scheduled", likes: 0, comments: 0, shares: 0 },
  { id: "p4", content: "Quick poll: What feature would you like to see next?", platform: "Twitter", scheduledFor: "Mar 20, 2024 2:00 PM", status: "scheduled", likes: 0, comments: 0, shares: 0 },
  { id: "p5", content: "Draft post about our upcoming webinar...", platform: "Twitter", status: "draft", likes: 0, comments: 0, shares: 0 },
];

function PostsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "scheduled" | "draft">("all");

  const filteredPosts = MOCK_POSTS.filter((post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || post.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Instagram": return <Instagram className="h-4 w-4 text-pink-500" />;
      case "Twitter": return <Twitter className="h-4 w-4 text-sky-500" />;
      case "LinkedIn": return <Linkedin className="h-4 w-4 text-blue-600" />;
      case "Facebook": return <Facebook className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: Post["status"]) => {
    switch (status) {
      case "published": return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "scheduled": return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Posts</h2>
            <p className="text-muted-foreground text-sm">Manage your scheduled and published posts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/app/social/posts/calendar">
            <Button variant="outline">Calendar</Button>
          </Link>
          <Link to="/app/social/posts/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Create Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "published", "scheduled", "draft"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredPosts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {getPlatformIcon(post.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{post.platform}</span>
                      {getStatusBadge(post.status)}
                      {post.scheduledFor && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {post.scheduledFor}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-3">{post.content}</p>
                    {post.status === "published" ? (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {post.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" /> {post.shares}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {post.reach}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        {post.status === "scheduled" && (
                          <Button variant="ghost" size="sm">Publish Now</Button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
