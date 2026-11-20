import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  MessageSquare,
  Plus,
  Share2,
  Trash2,
  TrendingUp,
  Twitter,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { socialApi } from "@/lib/api";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/social/campaigns")({
  component: SocialCampaignsPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook";
type CampaignStatus = "draft" | "active" | "paused" | "completed";

interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  impressions?: number;
  clicks?: number;
  engagement?: number;
  budget?: number;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const platformIcon: Record<Platform, React.ReactNode> = {
  all: <Globe className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  facebook: <MessageSquare className="h-4 w-4" />,
};

const statusColor: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
};

function fmt(n?: number): string {
  if (n == null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "Spring Product Launch",
    platform: "all",
    status: "active",
    startDate: "2026-03-01T00:00:00Z",
    endDate: "2026-03-31T00:00:00Z",
    impressions: 142500,
    clicks: 8320,
    engagement: 5.8,
    budget: 5000,
    createdAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "2",
    name: "LinkedIn Thought Leadership",
    platform: "linkedin",
    status: "active",
    startDate: "2026-03-10T00:00:00Z",
    impressions: 32000,
    clicks: 2100,
    engagement: 6.6,
    budget: 2000,
    createdAt: "2026-03-08T09:00:00Z",
  },
  {
    id: "3",
    name: "Instagram Stories Q1",
    platform: "instagram",
    status: "paused",
    startDate: "2026-02-01T00:00:00Z",
    endDate: "2026-02-28T00:00:00Z",
    impressions: 78000,
    clicks: 4500,
    engagement: 5.8,
    budget: 3000,
    createdAt: "2026-01-25T14:30:00Z",
  },
  {
    id: "4",
    name: "Twitter Brand Awareness",
    platform: "twitter",
    status: "draft",
    startDate: "2026-04-01T00:00:00Z",
    budget: 1500,
    createdAt: "2026-03-15T11:00:00Z",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

function SocialCampaignsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    platform: "all" as Platform,
  });

  // ── Data ─────────────────────────────────────────────────────────────────

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["social", "campaigns"],
    queryFn: () => socialApi.campaigns.list(),
    placeholderData: DEMO_CAMPAIGNS,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createCampaignMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => socialApi.campaigns.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "campaigns"] });
      toast.success("Campaign created successfully");
      setShowCreate(false);
      setForm({ name: "", platform: "all" });
    },
    onError: () => {
      toast.error("Failed to create campaign");
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => socialApi.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: () => {
      toast.error("Failed to delete campaign");
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleCreateSubmit() {
    const name = form.name.trim() || "New Campaign";
    createCampaignMutation.mutate({
      name,
      platform: form.platform,
      startDate: new Date().toISOString(),
      status: "draft",
    });
  }

  // ── Summary stats ─────────────────────────────────────────────────────────

  const totalImpressions = campaigns.reduce(
    (s, c) => s + (c.impressions ?? 0),
    0,
  );
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks ?? 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const avgEngagement =
    campaigns.length > 0
      ? campaigns.reduce((s, c) => s + (c.engagement ?? 0), 0) /
        campaigns.length
      : 0;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Social Campaigns
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track your social media campaigns across all platforms
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={createCampaignMutation.isPending}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Impressions",
            value: fmt(totalImpressions),
            icon: <Eye className="h-5 w-5 text-blue-500" />,
            sub: "across all platforms",
          },
          {
            label: "Total Clicks",
            value: fmt(totalClicks),
            icon: <TrendingUp className="h-5 w-5 text-green-500" />,
            sub: `${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0}% CTR`,
          },
          {
            label: "Active Campaigns",
            value: String(activeCampaigns),
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
            sub: `of ${campaigns.length} total`,
          },
          {
            label: "Avg Engagement",
            value: `${avgEngagement.toFixed(1)}%`,
            icon: <Heart className="h-5 w-5 text-pink-500" />,
            sub: "across campaigns",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            All Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-8 w-8 text-gray-400" />}
              title="No campaigns yet"
              description="Create your first social media campaign to get started"
              action={
                <Button
                  onClick={() => setShowCreate(true)}
                  disabled={createCampaignMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                      {platformIcon[campaign.platform]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {campaign.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[campaign.status]}`}
                        >
                          {campaign.status.charAt(0).toUpperCase() +
                            campaign.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex gap-6 text-sm text-gray-600">
                      <div className="text-center">
                        <p className="font-semibold">
                          {fmt(campaign.impressions)}
                        </p>
                        <p className="text-xs text-gray-400">Impressions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{fmt(campaign.clicks)}</p>
                        <p className="text-xs text-gray-400">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">
                          {campaign.engagement != null
                            ? `${campaign.engagement}%`
                            : "–"}
                        </p>
                        <p className="text-xs text-gray-400">Engagement</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                        disabled={deleteCampaignMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {showCreate && (
        <FormModal
          isOpen={showCreate}
          title="Create Campaign"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSubmit}
          isLoading={createCampaignMutation.isPending}
          submitText="Create Campaign"
        >
          <FormField label="Campaign Name" required>
            <Input
              placeholder="e.g. Spring Product Launch"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </FormField>
          <FormField label="Platform">
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.platform}
              onChange={(e) =>
                setForm((f) => ({ ...f, platform: e.target.value as Platform }))
              }
            >
              <option value="all">All Platforms</option>
              <option value="twitter">Twitter / X</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </FormField>
        </FormModal>
      )}
    </div>
  );
}
