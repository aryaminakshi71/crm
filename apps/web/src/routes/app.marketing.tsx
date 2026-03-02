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
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { aiApi, nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/marketing")({
  component: MarketingPage,
});

function MarketingPage() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "multi_channel",
    channel: "email",
    goal: "",
    budget: "0",
  });
  const [aiPlan, setAiPlan] = useState<{
    name: string;
    subjectLines: string[];
    messageOutline: string;
    segments: string[];
    kpis: string[];
    recommendedChannel: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["nucleo-campaigns"],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 100 }),
  });

  const createCampaign = useMutation({
    mutationFn: (payload: {
      name: string;
      type?: string;
      channel?: string;
      goal?: string;
      budget?: number;
    }) => nucleoApi.campaigns.create(payload),
    onSuccess: () => {
      toast.success("Campaign created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      setIsCreateModalOpen(false);
      setNewCampaign({
        name: "",
        type: "multi_channel",
        channel: "email",
        goal: "",
        budget: "0",
      });
      setAiPlan(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create campaign"),
  });

  const aiPlanMutation = useMutation({
    mutationFn: (payload: {
      goal: string;
      audience: string;
      channel?: string;
      budget?: number;
    }) => aiApi.generateCampaignPlan(payload),
    onSuccess: (response) => {
      if (!response.result) {
        toast.error("AI plan unavailable");
        return;
      }
      setAiPlan(response.result);
      setNewCampaign((prev) => ({
        ...prev,
        name: response.result?.name || prev.name,
        channel: response.result?.recommendedChannel || prev.channel,
      }));
      toast.success("AI campaign plan generated");
    },
    onError: () => toast.error("Failed to generate campaign plan"),
  });

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.campaigns.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      toast.success("Campaign updated");
    },
    onError: () => toast.error("Failed to update campaign"),
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => nucleoApi.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      toast.success("Campaign deleted");
    },
    onError: () => toast.error("Failed to delete campaign"),
  });

  const campaigns = (data?.data as any[]) || [];
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign: any) => {
      if (channelFilter !== "all" && campaign.channel !== channelFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        String(campaign.name || "").toLowerCase().includes(searchLower) ||
        String(campaign.goal || "").toLowerCase().includes(searchLower) ||
        String(campaign.type || "").toLowerCase().includes(searchLower)
      );
    });
  }, [campaigns, channelFilter, search]);

  if (isLoading) return <Loading text="Loading campaigns..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Marketing</h1>
          <p className="text-muted-foreground">
            Campaign planning and execution with AI-assisted strategy.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          loading={createCampaign.isPending}
        >
          New Campaign
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search campaign name or goal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All channels</option>
          <option value="email">Email</option>
          <option value="social">Social</option>
          <option value="multi_channel">Multi-channel</option>
        </select>
      </div>

      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-12 w-12" />}
          title="No campaigns yet"
          description="Create your first campaign with AI assistance."
          action={{ label: "Create Campaign", onClick: () => setIsCreateModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign: any) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="line-clamp-1 text-base">
                    {campaign.name}
                  </CardTitle>
                  <Badge
                    variant={campaign.status === "active" ? "success" : "outline"}
                  >
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Goal: <span className="text-foreground">{campaign.goal || "-"}</span>
                </p>
                <p className="text-muted-foreground">
                  Channel: <span className="text-foreground">{campaign.channel}</span>
                </p>
                <p className="text-muted-foreground">
                  Type: <span className="text-foreground">{campaign.type}</span>
                </p>
                <p className="text-muted-foreground">
                  Budget:{" "}
                  <span className="text-foreground">
                    ${Number(campaign.budget || 0).toFixed(2)}
                  </span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <select
                    className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                    value={campaign.status}
                    onChange={(e) =>
                      updateCampaign.mutate({
                        id: campaign.id,
                        data: { status: e.target.value },
                      })
                    }
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="completed">completed</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCampaign.mutate(campaign.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Campaign"
        submitText="Create Campaign"
        loading={createCampaign.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const name = newCampaign.name.trim();
          if (!name) {
            toast.error("Campaign name is required");
            return;
          }
          const budget = Number(newCampaign.budget || 0);
          if (!Number.isFinite(budget) || budget < 0) {
            toast.error("Budget must be a valid non-negative number");
            return;
          }

          createCampaign.mutate({
            name,
            type: newCampaign.type,
            channel: newCampaign.channel,
            goal: newCampaign.goal.trim() || undefined,
            budget,
          });
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                Generate campaign strategy with AI from goal and audience.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Sparkles className="h-4 w-4" />}
                loading={aiPlanMutation.isPending}
                onClick={() => {
                  const goal = newCampaign.goal.trim();
                  if (!goal) {
                    toast.error("Add campaign goal first");
                    return;
                  }
                  aiPlanMutation.mutate({
                    goal,
                    audience: "existing leads and customers",
                    channel: newCampaign.channel,
                    budget: Number(newCampaign.budget || 0),
                  });
                }}
              >
                AI Plan
              </Button>
            </div>
            {aiPlan ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">{aiPlan.messageOutline}</p>
                <p className="text-muted-foreground">
                  Segments: {aiPlan.segments.join(", ")}
                </p>
                <p className="text-muted-foreground">
                  Subject lines: {aiPlan.subjectLines.join(" | ")}
                </p>
              </div>
            ) : null}
          </div>

          <FormField label="Campaign Name" required>
            <Input
              value={newCampaign.name}
              onChange={(e) =>
                setNewCampaign((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </FormField>
          <FormField label="Goal">
            <Textarea
              value={newCampaign.goal}
              onChange={(e) =>
                setNewCampaign((prev) => ({ ...prev, goal: e.target.value }))
              }
              rows={3}
              placeholder="Increase qualified demo requests in SMB segment"
            />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Type">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newCampaign.type}
                onChange={(e) =>
                  setNewCampaign((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="multi_channel">Multi-channel</option>
                <option value="lifecycle">Lifecycle</option>
                <option value="promotion">Promotion</option>
              </select>
            </FormField>
            <FormField label="Channel">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newCampaign.channel}
                onChange={(e) =>
                  setNewCampaign((prev) => ({ ...prev, channel: e.target.value }))
                }
              >
                <option value="email">Email</option>
                <option value="social">Social</option>
                <option value="multi_channel">Multi-channel</option>
              </select>
            </FormField>
            <FormField label="Budget">
              <Input
                type="number"
                min="0"
                step="1"
                value={newCampaign.budget}
                onChange={(e) =>
                  setNewCampaign((prev) => ({ ...prev, budget: e.target.value }))
                }
              />
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
