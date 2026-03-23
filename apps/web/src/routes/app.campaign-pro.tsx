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
import { useQuery } from "@tanstack/react-query";
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
  AlertCircle
} from "lucide-react";
import { z } from "zod";

// ─── Route ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/campaign-pro")({
  validateSearch: z.object({}),
  component: CampaignProPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
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

  const { data: statsData, isError, refetch} = useQuery({
    queryKey: ["marketing-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/marketing/stats`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: campaignsData } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/marketing/campaigns`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const activeCampaigns = campaignsData?.data?.filter((c: { status: string }) => c.status === "active") ?? [];
  const totalCampaigns = campaignsData?.total ?? 12;
  const topCampaigns = campaignsData?.data?.slice(0, 3) ?? [
    { id: "1", name: "Spring Sale Email", status: "active" },
    { id: "2", name: "Product Launch Social", status: "active" },
    { id: "3", name: "Welcome Series", status: "completed" },
  ];

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
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
          value={activeCampaigns.length || totalCampaigns}
          icon={<Megaphone className="h-4 w-4" />}
          trend="+3 this month"
          color="text-primary"
        />
        <Metric
          title="Total Reach"
          value={statsData?.totalContacts ? `${(statsData.totalContacts / 1000).toFixed(1)}K` : "2.4M"}
          icon={<Globe className="h-4 w-4" />}
          trend="+12% vs last month"
          color="text-info"
        />
        <Metric
          title="Engagement Rate"
          value={statsData?.avgOpenRate ? `${statsData.avgOpenRate.toFixed(1)}%` : "4.8%"}
          icon={<MousePointerClick className="h-4 w-4" />}
          trend="+0.5% vs last month"
          color="text-success"
        />
        <Metric
          title="Conversions"
          value={statsData?.totalSent?.toLocaleString() ?? "1,247"}
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
            {topCampaigns.map((campaign: { id: string; name: string; status: string }) => (
              <div key={campaign.id} className="flex items-center justify-between">
                <span className="text-sm truncate">{campaign.name}</span>
                <Badge variant={campaign.status === "active" ? "primary" : "outline"}>
                  {campaign.status === "active" ? "Active" : "Completed"}
                </Badge>
              </div>
            ))}
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
