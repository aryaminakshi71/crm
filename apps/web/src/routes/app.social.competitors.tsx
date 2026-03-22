/**
 * Social Competitors Route
 *
 * Track and analyze social media competitors.
 */

import {
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
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
  ShieldAlert,
  TrendingUp,
  Users,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/social/competitors")({
  component: CompetitorsPage,
});

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Competitor {
  id: string;
  name: string;
  handle?: string | null;
  platform: string;
  followersCount: number;
  engagementRate?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function platformIcon(platform: string) {
  switch (platform) {
    case "youtube":
      return <Youtube className="w-4 h-4 text-red-400" />;
    case "instagram":
      return <Instagram className="w-4 h-4 text-pink-400" />;
    default:
      return <ShieldAlert className="w-4 h-4 text-violet-400" />;
  }
}

function formatFollowers(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CompetitorsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    handle: "",
    platform: "instagram" as
      | "instagram"
      | "tiktok"
      | "youtube"
      | "twitter"
      | "linkedin",
    followersCount: 0,
    engagementRate: undefined as number | undefined,
    notes: "",
  });

  // ── Fetch competitors ────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["social", "competitors"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/competitors`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch competitors");
      return res.json();
    },
  });
  const competitors: Competitor[] = data?.data ?? [];

  // ── Create competitor ────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: typeof newCompetitor) => {
      const res = await fetch(`${API_BASE}/social/competitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getOrgHeader(),
        },
        body: JSON.stringify({
          ...payload,
          handle: payload.handle || undefined,
          notes: payload.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add competitor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "competitors"] });
      setIsCreateOpen(false);
      setNewCompetitor({
        name: "",
        handle: "",
        platform: "instagram",
        followersCount: 0,
        engagementRate: undefined,
        notes: "",
      });
      toast.success("Competitor added");
    },
    onError: () => {
      toast.error("Failed to add competitor");
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            Competitors
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze your social media competitors
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Track Competitor
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading />
      ) : competitors.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-10 h-10 text-muted-foreground" />}
          title="No competitors tracked"
          description="Start tracking competitors to benchmark your social media performance."
          action={{
            label: "Track Competitor",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((competitor) => (
            <Card key={competitor.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 mb-3">
                  {platformIcon(competitor.platform)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {competitor.name}
                    </p>
                    {competitor.handle && (
                      <p className="text-xs text-muted-foreground">
                        {competitor.handle}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground capitalize">
                      {competitor.platform}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{formatFollowers(competitor.followersCount)}</span>
                  </div>
                  {competitor.engagementRate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{competitor.engagementRate}% eng.</span>
                    </div>
                  )}
                </div>
                {competitor.notes && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {competitor.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Track Competitor"
        onSubmit={() => createMutation.mutate(newCompetitor)}
        isLoading={createMutation.isPending}
        submitLabel="Add Competitor"
      >
        <FormField label="Competitor Name" required>
          <Input
            placeholder="e.g. Acme Corp"
            value={newCompetitor.name}
            onChange={(e) =>
              setNewCompetitor((p) => ({ ...p, name: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Handle / Username">
          <Input
            placeholder="@username"
            value={newCompetitor.handle}
            onChange={(e) =>
              setNewCompetitor((p) => ({ ...p, handle: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Platform" required>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newCompetitor.platform}
            onChange={(e) =>
              setNewCompetitor((p) => ({
                ...p,
                platform: e.target.value as typeof newCompetitor.platform,
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
            placeholder="e.g. 120000"
            value={newCompetitor.followersCount || ""}
            onChange={(e) =>
              setNewCompetitor((p) => ({
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
            placeholder="e.g. 2.8"
            value={newCompetitor.engagementRate ?? ""}
            onChange={(e) =>
              setNewCompetitor((p) => ({
                ...p,
                engagementRate: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
          />
        </FormField>
        <FormField label="Notes">
          <Textarea
            placeholder="Any notes about this competitor..."
            value={newCompetitor.notes}
            onChange={(e) =>
              setNewCompetitor((p) => ({ ...p, notes: e.target.value }))
            }
          />
        </FormField>
      </FormModal>
    </div>
  );
}
