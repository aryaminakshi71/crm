/**
 * Knowledge Base
 *
 * Article management and search for self-service support.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenText,
  ChevronRight,
  Edit,
  FileText,
  Folder,
  Plus,
  Search,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Clock,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/knowledge")({
  component: KnowledgeBase,
});

const categories = [
  { id: "1", name: "Getting Started", icon: BookOpenText, articleCount: 12 },
  { id: "2", name: "Account & Billing", icon: FileText, articleCount: 8 },
  { id: "3", name: "Integrations", icon: Folder, articleCount: 15 },
  { id: "4", name: "API Documentation", icon: FileText, articleCount: 24 },
  { id: "5", name: "Troubleshooting", icon: BookOpenText, articleCount: 18 },
  { id: "6", name: "Best Practices", icon: BookOpenText, articleCount: 10 },
];

const recentArticles = [
  { id: "1", title: "How to reset your password", category: "Getting Started", views: 12450, helpful: 234, createdAt: "2 weeks ago" },
  { id: "2", title: "Setting up two-factor authentication", category: "Getting Started", views: 8920, helpful: 189, createdAt: "1 month ago" },
  { id: "3", title: "Understanding your invoice", category: "Account & Billing", views: 5670, helpful: 145, createdAt: "3 weeks ago" },
  { id: "4", title: "Integrating with Slack", category: "Integrations", views: 4560, helpful: 112, createdAt: "1 week ago" },
  { id: "5", title: "API rate limits and quotas", category: "API Documentation", views: 3450, helpful: 98, createdAt: "2 days ago" },
];

const popularArticles = [
  { id: "1", title: "Getting started with Nucleo One", views: 24500 },
  { id: "2", title: "How to create your first project", views: 18200 },
  { id: "3", title: "Inviting team members", views: 15600 },
  { id: "4", title: "Understanding roles and permissions", views: 12400 },
  { id: "5", title: "Exporting your data", views: 9800 },
];

function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
            <h2 className="font-bold text-xl text-foreground">Knowledge Base</h2>
            <p className="text-sm text-muted-foreground">Self-service articles and documentation</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          New Article
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-12 h-12 text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for articles..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Articles" value="87" />
        <StatCard title="Categories" value="12" />
        <StatCard title="Total Views" value="124.5K" />
        <StatCard title="Avg Rating" value="4.8" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Categories */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  className={`flex w-full items-center justify-between rounded-lg p-3 transition-colors ${
                    selectedCategory === category.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <Badge variant="outline">{category.articleCount}</Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Articles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Recent Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                to={`/app/helpdesk/knowledge/${article.id}` as string}
                className="flex items-start justify-between rounded-lg p-3 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-primary">{article.category}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{article.createdAt}</span>
                  </div>
                  <h3 className="font-medium text-sm">{article.title}</h3>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {article.helpful}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Popular Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Most Viewed This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {popularArticles.map((article, index) => (
              <Link
                key={article.id}
                to={`/app/helpdesk/knowledge/${article.id}` as string}
                className="rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{article.views.toLocaleString()} views</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
