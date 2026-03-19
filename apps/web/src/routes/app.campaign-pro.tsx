import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Database,
  Globe,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";

// ─── Route ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/campaign-pro")({
  validateSearch: z.object({}),
  component: CampaignProPage,
});

// ─── Metric Component ───────────────────────────────────────────────────────

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <p className="text-muted-foreground text-xs mt-1">{trend}</p>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Megaphone className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────

function CampaignProPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Campaign Pro</h1>
          <p className="text-muted-foreground text-sm">
            Campaign planning, messaging automation, and analytics.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          AI Campaign Assistant
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Active Campaigns"
          value="12"
          icon={<Megaphone className="h-4 w-4" />}
          trend="+3 this month"
          color="text-primary"
        />
        <Metric
          title="Total Reach"
          value="2.4M"
          icon={<Globe className="h-4 w-4" />}
          trend="+12% vs last month"
          color="text-info"
        />
        <Metric
          title="Engagement Rate"
          value="4.8%"
          icon={<MousePointerClick className="h-4 w-4" />}
          trend="+0.5% vs last month"
          color="text-success"
        />
        <Metric
          title="Conversions"
          value="1,247"
          icon={<Target className="h-4 w-4" />}
          trend="+23% vs last month"
          color="text-warning"
        />
      </div>

      {/* Data Platform Management Card */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Data Platform Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Access your centralized data management platform to manage customer
            data, analytics pipelines, and integrations.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => navigate({ to: "/app/data-platform" })}
              leftIcon={<ArrowRight className="h-4 w-4" />}
            >
              Open Data Management Platform
            </Button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <div className="rounded-lg bg-muted/30 p-1.5">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Data Sources</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="rounded-lg bg-muted/30 p-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Analytics Pipelines</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="rounded-lg bg-muted/30 p-1.5">
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Integrations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Channels Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Channel Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </div>
              <Badge variant="success">+18%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Social</span>
              </div>
              <Badge variant="success">+12%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">SMS</span>
              </div>
              <Badge variant="warning">+5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Web</span>
              </div>
              <Badge variant="success">+24%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Top Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm truncate">Spring Sale Email</span>
              <Badge variant="primary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm truncate">Product Launch Social</span>
              <Badge variant="primary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm truncate">Welcome Series</span>
              <Badge variant="outline">Completed</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Best time to send emails: 10 AM - 2 PM on Tuesdays
              </p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-success mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Social engagement peaks on Friday afternoons
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
