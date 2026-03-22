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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  DollarSign,
  Globe,
  Mail,
  Megaphone,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/marketing/campaigns")({
  component: MarketingCampaignsPage,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  social: Share2,
  multi_channel: Globe,
};

const STATUS_META: Record<string, { label: string; bg: string; textColor: string }> = {
  draft: { label: "Draft", bg: "bg-muted/60", textColor: "text-muted-foreground" },
  active: { label: "Active", bg: "bg-success/15", textColor: "text-success" },
  paused: { label: "Paused", bg: "bg-amber-400/15", textColor: "text-amber-400" },
  completed: { label: "Completed", bg: "bg-sky-400/15", textColor: "text-sky-400" },
};

const CHANNELS = ["email", "social", "multi_channel"] as const;
type Channel = (typeof CHANNELS)[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: string }) {
  const Icon = CHANNEL_ICONS[channel] ?? Globe;
  return <Icon className="h-4 w-4" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function MarketingCampaignsPage() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "email" as Channel,
    goal: "",
    budget: "",
  });

  const queryClient = useQueryClient();

  // ─── Query ─────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["marketing-campaigns", channelFilter, statusFilter],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 100 }),
  });

  const campaigns = (data?.data as any[]) ?? [];

  const filtered = useMemo(() => {
    return campaigns.filter((c: any) => {
      if (channelFilter !== "all" && c.channel !== channelFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        (c.name || "").toLowerCase().includes(s) ||
        (c.goal || "").toLowerCase().includes(s)
      );
    });
  }, [campaigns, channelFilter, statusFilter, search]);

  // Stats
  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c: any) => c.status === "active").length,
    totalBudget: campaigns.reduce((s: number, c: any) => s + Number(c.budget || 0), 0),
    draft: campaigns.filter((c: any) => c.status === "draft").length,
  }), [campaigns]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createCampaign = useMutation({
    mutationFn: () => {
      if (!newCampaign.name.trim()) throw new Error("Campaign name is required");
      return nucleoApi.campaigns.create({
        name: newCampaign.name.trim(),
        channel: newCampaign.channel,
        goal: newCampaign.goal.trim() || undefined,
        budget: newCampaign.budget ? Number(newCampaign.budget) : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Campaign created");
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      setIsCreateOpen(false);
      setNewCampaign({ name: "", channel: "email", goal: "", budget: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create campaign"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.campaigns.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      toast.success("Campaign updated");
    },
    onError: () => toast.error("Failed to update campaign"),
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => nucleoApi.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: () => toast.error("Failed to delete campaign"),
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Campaigns</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Plan, launch, and track your marketing campaigns.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: <Megaphone className="h-4 w-4" /> },
          { label: "Active", value: stats.active, icon: <BarChart3 className="h-4 w-4 text-success" /> },
          { label: "Drafts", value: stats.draft, icon: <Globe className="h-4 w-4 text-muted-foreground" /> },
          { label: "Total Budget", value: `$${stats.totalBudget.toLocaleString()}`, icon: <DollarSign className="h-4 w-4 text-primary" /> },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                <p className="font-black text-2xl text-foreground">{s.value}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground">{s.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "email", "social", "multi_channel"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannelFilter(ch)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${
                channelFilter === ch
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {ch === "all" ? "All Channels" : ch.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "draft", "active", "paused", "completed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {st === "all" ? "All Status" : STATUS_META[st]?.label ?? st}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <Loading text="Loading campaigns..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No campaigns found"
          description={search || channelFilter !== "all" ? "Try adjusting your filters." : "Create your first campaign to get started."}
          action={{ label: "New Campaign", onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((campaign: any) => {
            const statusMeta = STATUS_META[campaign.status] ?? STATUS_META.draft;
            return (
              <Card key={campaign.id} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground shrink-0">
                      <ChannelIcon channel={campaign.channel} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">{campaign.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.bg} ${statusMeta.textColor}`}>
                          {statusMeta.label}
                        </span>
                        {campaign.channel && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                            {campaign.channel.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      {campaign.goal && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-1">Goal: {campaign.goal}</p>
                      )}
                      {campaign.budget && (
                        <p className="text-muted-foreground text-xs">Budget: ${Number(campaign.budget).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {campaign.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ id: campaign.id, status: "active" })}
                          disabled={updateStatus.isPending}
                          className="rounded px-2 py-1 text-xs font-semibold bg-success/15 text-success hover:bg-success/25 transition-colors"
                        >
                          Launch
                        </button>
                      )}
                      {campaign.status === "active" && (
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ id: campaign.id, status: "paused" })}
                          disabled={updateStatus.isPending}
                          className="rounded px-2 py-1 text-xs font-semibold bg-amber-400/15 text-amber-400 hover:bg-amber-400/25 transition-colors"
                        >
                          Pause
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteCampaign.mutate(campaign.id)}
                        disabled={deleteCampaign.isPending}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Campaign"
        onSubmit={() => createCampaign.mutate()}
        isSubmitting={createCampaign.isPending}
        submitLabel="Create Campaign"
      >
        <FormField label="Campaign Name *">
          <Input
            placeholder="Q2 Product Launch"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign((p) => ({ ...p, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Channel">
          <select
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={newCampaign.channel}
            onChange={(e) => setNewCampaign((p) => ({ ...p, channel: e.target.value as Channel }))}
          >
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>{ch.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Goal">
          <Textarea
            placeholder="Increase sign-ups by 20%..."
            value={newCampaign.goal}
            onChange={(e) => setNewCampaign((p) => ({ ...p, goal: e.target.value }))}
            rows={2}
          />
        </FormField>
        <FormField label="Budget ($)">
          <Input
            type="number"
            placeholder="5000"
            value={newCampaign.budget}
            onChange={(e) => setNewCampaign((p) => ({ ...p, budget: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
