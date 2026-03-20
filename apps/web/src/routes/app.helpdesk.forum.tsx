/**
 * Forum / Community View
 *
 * Community forum for peer-to-peer support and discussions.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Filter,
  Globe,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/forum")({
  component: ForumView,
});

const categories = [
  { id: "1", name: "General Discussion", description: "Talk about anything related to Nucleo One", threads: 234, posts: 1567 },
  { id: "2", name: "Feature Requests", description: "Suggest and vote on new features", threads: 189, posts: 892 },
  { id: "3", name: "Tips & Tricks", description: "Share your best practices", threads: 156, posts: 678 },
  { id: "4", name: "Bug Reports", description: "Report and track bugs", threads: 78, posts: 345 },
  { id: "5", name: "Success Stories", description: "Share how Nucleo One helped you", threads: 45, posts: 234 },
];

const trendingThreads = [
  { id: "1", title: "How I automated my entire workflow", author: "Sarah Chen", votes: 245, replies: 56, views: 2341, category: "Tips & Tricks", lastActivity: "2 hours ago" },
  { id: "2", title: "Feature request: Dark mode support", author: "Michael Roberts", votes: 189, replies: 34, views: 1567, category: "Feature Requests", lastActivity: "5 hours ago" },
  { id: "3", title: "API integration best practices", author: "Emily Watson", votes: 156, replies: 28, views: 1234, category: "General Discussion", lastActivity: "1 day ago" },
];

const recentPosts = [
  { id: "1", title: "Finally figured out the webhook setup!", content: "After hours of trying, I finally got the webhooks working properly...", author: "David Kim", category: "Tips & Tricks", votes: 45, replies: 12, views: 342, createdAt: "1 hour ago", isPinned: true },
  { id: "2", title: "Quarterly roadmap discussion", content: "Let's discuss what features we'd like to see next quarter...", author: "Jessica Brown", category: "Feature Requests", votes: 89, replies: 45, views: 567, createdAt: "3 hours ago" },
  { id: "3", title: "Issue with CSV import", content: "I'm getting an error when trying to import my CSV file...", author: "Robert Taylor", category: "Bug Reports", votes: 12, replies: 8, views: 123, createdAt: "5 hours ago" },
  { id: "4", title: "How to set up team permissions", content: "A comprehensive guide to setting up role-based permissions...", author: "Lisa Anderson", category: "Tips & Tricks", votes: 78, replies: 23, views: 456, createdAt: "1 day ago" },
  { id: "5", title: "My experience with Nucleo One", content: "After using Nucleo One for 6 months, here's my honest review...", author: "James Martinez", category: "Success Stories", votes: 156, replies: 67, views: 890, createdAt: "2 days ago" },
];

function ForumView() {
  const [activeTab, setActiveTab] = useState<"threads" | "categories">("threads");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/helpdesk">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Community Forum</h2>
            <p className="text-sm text-muted-foreground">Connect with other users and share knowledge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Bell className="h-4 w-4" />}>
            Notifications
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            New Thread
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Members" value="4,892" icon={<Users className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Active Threads" value="702" icon={<MessageSquare className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Posts This Week" value="234" icon={<TrendingUp className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Online Now" value="47" icon={<Globe className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threads..."
            className="flex h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm"
          />
        </div>
        <select className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option>All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option>Latest</option>
          <option>Most Votes</option>
          <option>Most Replies</option>
          <option>Most Views</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "threads", label: "Threads" },
            { id: "categories", label: "Categories" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "threads" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Thread List */}
          <div className="lg:col-span-2 space-y-3">
            {recentPosts.map((post) => (
              <Card key={post.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <button className="rounded p-1 hover:bg-muted">
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-bold">{post.votes}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {post.isPinned && (
                          <Badge variant="primary" className="text-xs">
                            <Bookmark className="mr-1 h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      </div>
                      <h3 className="font-semibold">{post.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div className="h-5 w-5 rounded-full bg-violet-500/10 text-center text-[10px] font-medium text-violet-400">
                            {post.author.charAt(0)}
                          </div>
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.replies} replies
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views} views
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Trending Threads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingThreads.map((thread, index) => (
                  <div key={thread.id} className="flex items-start gap-3">
                    <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium line-clamp-2">{thread.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{thread.votes} votes - {thread.replies} replies</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Active Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Active Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Sarah Chen", posts: 234, avatar: "SC" },
                  { name: "Michael Roberts", posts: 189, avatar: "MR" },
                  { name: "Emily Watson", posts: 156, avatar: "EW" },
                  { name: "David Kim", posts: 123, avatar: "DK" },
                ].map((member) => (
                  <div key={member.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-xs font-medium text-violet-400">
                        {member.avatar}
                      </div>
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{member.posts} posts</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Categories */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <h3 className="font-semibold">{category.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{category.threads} threads</span>
                  <span>{category.posts} posts</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
