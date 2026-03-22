/**
 * Social Influencers Route
 *
 * Track and manage social media influencers.
 */

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
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Instagram,
  Plus,
  Star,
  TrendingUp,
  Users,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/social/influencers")({
  component: InfluencersPage,
});

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Influencer {
  id: string;
  handle: string;
  platform: string;
  followersCount: number;
  engagementRate?: string | null;
  status: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    case "inactive":
      return "bg-red-500/15 text-red-400 border-red-500/20";
    default:
      return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  }
}

function platformIcon(platform: string) {
  switch (platform) {
    case "youtube":
      return <Youtube className="w-4 h-4 text-red-400" />;
    case "instagram":
      return <Instagram className="w-4 h-4 text-pink-400" />;
    default:
      return <Star className="w-4 h-4 text-violet-400" />;
  }
}

function formatFollowers(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
}

// ─── Main Component ───────────────────────────────────────────────────────────

function InfluencersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInfluencer, setNewInfluencer] = useState({
    handle: "",
    platform: "instagram" as
      | "instagram"
      | "tiktok"
      | "youtube"
      | "twitter"
      | "linkedin",
    followersCount: 0,
    engagementRate: undefined as number | undefined,
    status: "prospect" as "prospect" | "active" | "inactive",
  });

  // ── Fetch influencers ────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["social", "influencers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/influencers`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch influencers");
      return res.json();
    },
  });
  const influencers: Influencer[] = data?.data ?? [];

  // ── Create influencer ────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: typeof newInfluencer) => {
      const res = await fetch(`${API_BASE}/social/influencers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getOrgHeader(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create influencer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "influencers"] });
      setIsCreateOpen(false);
      setNewInfluencer({
        handle: "",
        platform: "instagram",
        followersCount: 0,
        engagementRate: undefined,
        status: "prospect",
      });
      toast.success("Influencer added");
    },
    onError: () => {
      toast.error("Failed to add influencer");
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-400" />
            Influencers
          </h1>
          <p className="text-muted-foreground mt-1">
            Track social media influencers for your brand
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Influencer
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading />
      ) : influencers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10 text-muted-foreground" />}
          title="No influencers tracked"
          description="Add your first influencer to start tracking partnerships and performance."
          action={{ label: "Add Influencer", onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {influencers.map((influencer) => (
            <Card key={influencer.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {platformIcon(influencer.platform)}
                    <div>
                      <p className="font-semibold text-foreground">
                        {influencer.handle}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {influencer.platform}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(influencer.status)}`}
                  >
                    {influencer.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{formatFollowers(influencer.followersCount)}</span>
                  </div>
                  {influencer.engagementRate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{influencer.engagementRate}% eng.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Influencer"
        onSubmit={() => createMutation.mutate(newInfluencer)}
        isLoading={createMutation.isPending}
        submitLabel="Add Influencer"
      >
        <FormField label="Handle / Username" required>
          <Input
            placeholder="@username"
            value={newInfluencer.handle}
            onChange={(e) =>
              setNewInfluencer((p) => ({ ...p, handle: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Platform" required>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newInfluencer.platform}
            onChange={(e) =>
              setNewInfluencer((p) => ({
                ...p,
                platform: e.target.value as typeof newInfluencer.platform,
              }))
            }
          >
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter / X</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </FormField>
        <FormField label="Followers Count">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 50000"
            value={newInfluencer.followersCount || ""}
            onChange={(e) =>
              setNewInfluencer((p) => ({
                ...p,
                followersCount: Number(e.target.value),
              }))
            }
          />
        </FormField>
        <FormField label="Engagement Rate (%)">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.01}
            placeholder="e.g. 3.5"
            value={newInfluencer.engagementRate ?? ""}
            onChange={(e) =>
              setNewInfluencer((p) => ({
                ...p,
                engagementRate: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
          />
        </FormField>
        <FormField label="Status">
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newInfluencer.status}
            onChange={(e) =>
              setNewInfluencer((p) => ({
                ...p,
                status: e.target.value as typeof newInfluencer.status,
              }))
            }
          >
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </FormModal>
    </div>
  );
}
