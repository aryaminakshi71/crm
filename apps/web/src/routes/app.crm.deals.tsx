/**
 * CRM Deals List
 *
 * Deals list with filters, sorting, status tracking, mutations, and pipeline chart.
 */

import { Badge, Button, Card, CardContent, Input, Progress } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  ChevronDown,
  DollarSign,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Target,
  TrendingUp,
  User,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { dealsApi } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { z } from "zod";

export const Route = createFileRoute("/app/crm/deals")({
  validateSearch: z.object({
    stage: z.string().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
  }),
  component: DealsList,
});

interface Deal {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  probability: number;
  expectedClose: string;
  createdAt: string;
  lastActivity: string;
  owner: string;
  tags: string[];
}

const EMPTY_CHART_DATA: any[] = [];

function DealsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("value");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [stageMenuId, setStageMenuId] = useState<string | null>(null);

  // ── Create form state ──────────────────────────────────────────────────────
  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    stage: "lead",
    probability: "50",
    expectedCloseDate: "",
    notes: "",
  });

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: dealsData, isLoading: dealsLoading, isError, refetch } = useQuery({
    queryKey: ["deals", { stage: stageFilter !== "all" ? stageFilter : undefined, search: searchQuery || undefined }],
    queryFn: () =>
      dealsApi.list({
        stage: stageFilter !== "all" ? stageFilter : undefined,
        search: searchQuery || undefined,
        limit: 100,
      }),
    placeholderData: (prev) => prev,
    retry: false,
    refetchInterval: 30_000,
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => dealsApi.updateStage(id, stage),
    onSuccess: () => {
      toast.success("Stage updated");
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals-forecast"] });
      setStageMenuId(null);
    },
    onError: () => toast.error("Failed to update stage"),
  });

  const rawDeals: Deal[] = (dealsData?.data ?? []).map((d: any) => ({
    id: d.id,
    title: d.name ?? d.title ?? "",
    company: d.companyName ?? d.company ?? "",
    contact: d.contactName ?? d.contact ?? "",
    value: typeof d.value === "string" ? parseFloat(d.value) || 0 : (d.value ?? 0),
    stage: d.stage ?? "lead",
    probability: d.probability ?? 0,
    expectedClose: d.expectedCloseDate ?? d.expectedClose ?? "",
    createdAt: d.createdAt ? String(d.createdAt).slice(0, 10) : "",
    lastActivity: d.updatedAt ? String(d.updatedAt).slice(0, 10) : "",
    owner: d.ownerName ?? d.owner ?? "",
    tags: d.tags ?? [],
  }));

  const filteredDeals = rawDeals
    .filter((deal) => {
      const matchesSearch =
        searchQuery === "" ||
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.contact.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === "all" || deal.stage === stageFilter;

      return matchesSearch && matchesStage;
    })
    .sort((a, b) => {
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "probability") return b.probability - a.probability;
      if (sortBy === "expectedClose") return new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime();
      return 0;
    });

  const stageColors: Record<string, string> = {
    lead: "bg-purple-100 text-purple-700 border-purple-200",
    qualified: "bg-blue-100 text-blue-700 border-blue-200",
    proposal: "bg-cyan-100 text-cyan-700 border-cyan-200",
    negotiation: "bg-yellow-100 text-yellow-700 border-yellow-200",
    closed_won: "bg-green-100 text-green-700 border-green-200",
    closed_lost: "bg-red-100 text-red-700 border-red-200",
  };

  const stageLabels: Record<string, string> = {
    lead: "Lead",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };

  const totalValue = rawDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = rawDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const wonValue = rawDeals.filter((d) => (d.stage as string) === "closed_won" || (d.stage as string) === "won").reduce((sum, d) => sum + d.value, 0);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createDeal = useMutation({
    mutationFn: () => {
      const value = Number(newDeal.value);
      if (!newDeal.name.trim()) throw new Error("Deal name is required");
      if (!Number.isFinite(value) || value <= 0) throw new Error("Value must be a positive number");
      return dealsApi.create({
        name: newDeal.name.trim(),
        value,
        stage: newDeal.stage || "lead",
        probability: newDeal.probability ? Number(newDeal.probability) : undefined,
        expectedCloseDate: newDeal.expectedCloseDate || undefined,
        notes: newDeal.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Deal created successfully");
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals-forecast"] });
      setShowCreateModal(false);
      setNewDeal({ name: "", value: "", stage: "lead", probability: "50", expectedCloseDate: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create deal"),
  });

  const updateDeal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof dealsApi.update>[1] }) =>
      dealsApi.update(id, data),
    onSuccess: () => {
      toast.success("Deal updated");
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals-forecast"] });
    },
    onError: () => toast.error("Failed to update deal"),
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: () => {
      toast.success("Deal deleted");
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals-forecast"] });
      setShowDeleteId(null);
    },
    onError: () => toast.error("Failed to delete deal"),
  });

  // ── Loading / error states ─────────────────────────────────────────────────
  if (dealsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Stages</option>
            <option value="lead">Lead</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="value">Sort by Value</option>
            <option value="probability">Sort by Probability</option>
            <option value="expectedClose">Sort by Close Date</option>
          </select>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Deals</p>
                <p className="font-bold text-2xl">{rawDeals.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Value</p>
                <p className="font-bold text-2xl">${(totalValue / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Weighted Value</p>
                <p className="font-bold text-2xl">${(weightedValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Based on probability</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Won (MTD)</p>
                <p className="font-bold text-2xl text-green-600">${(wonValue / 1000).toFixed(0)}K</p>
              </div>
              <Target className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Value AreaChart */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-4">Pipeline Value Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={EMPTY_CHART_DATA} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWeighted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Area
                type="monotone"
                dataKey="pipeline"
                name="Pipeline"
                stroke="hsl(var(--primary))"
                fill="url(#colorPipeline)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="weighted"
                name="Weighted"
                stroke="#22c55e"
                fill="url(#colorWeighted)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-[300px]">
                    Deal
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Value
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Stage
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Probability
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Expected Close
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Owner
                  </th>
                  <th className="w-12 p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No deals found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <Link
                          to={`/app/crm/deals/${deal.id}` as string}
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {deal.company.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">
                              {deal.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {deal.company} · {deal.contact}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold">
                          ${(deal.value / 1000).toFixed(0)}K
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <button
                            className="flex items-center gap-1"
                            onClick={() => setStageMenuId(stageMenuId === deal.id ? null : deal.id)}
                          >
                            <Badge variant="outline" className={stageColors[deal.stage]}>
                              {stageLabels[deal.stage]}
                            </Badge>
                          </button>
                          {stageMenuId === deal.id && (
                            <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-md border border-border bg-background shadow-lg py-1">
                              {Object.entries(stageLabels).map(([s, label]) => (
                                <button
                                  key={s}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                                  onClick={() => updateStageMutation.mutate({ id: deal.id, stage: s })}
                                  disabled={updateStageMutation.isPending}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Progress value={deal.probability} className="h-2 w-16" />
                          <span className="text-sm text-muted-foreground">
                            {deal.probability}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {deal.expectedClose}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-sm">{deal.owner}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setShowDeleteId(deal.id)}
                          disabled={deleteDeal.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredDeals.length} of {rawDeals.length} deals
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>

      {/* Create Deal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Create Deal</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Deal Name *</label>
                <Input
                  placeholder="Enterprise License"
                  value={newDeal.name}
                  onChange={(e) => setNewDeal((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Value ($) *</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal((p) => ({ ...p, value: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stage</label>
                <select
                  value={newDeal.stage}
                  onChange={(e) => setNewDeal((p) => ({ ...p, stage: e.target.value }))}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Probability (%)</label>
                <Input
                  type="number"
                  placeholder="50"
                  min={0}
                  max={100}
                  value={newDeal.probability}
                  onChange={(e) => setNewDeal((p) => ({ ...p, probability: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expected Close Date</label>
                <Input
                  type="date"
                  value={newDeal.expectedCloseDate}
                  onChange={(e) => setNewDeal((p) => ({ ...p, expectedCloseDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  placeholder="Any notes about this deal..."
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => createDeal.mutate()} disabled={createDeal.isPending}>
                {createDeal.isPending ? "Creating..." : "Create Deal"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg">Delete Deal</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this deal? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteDeal.mutate(showDeleteId)}
                disabled={deleteDeal.isPending}
              >
                {deleteDeal.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
