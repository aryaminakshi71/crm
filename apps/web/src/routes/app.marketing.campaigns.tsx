/**
 * Campaign List
 *
 * List of all marketing campaigns with filters and status management.
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
  Select,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Filter,
  Mail,
  MailOpen,
  MoreHorizontal,
  MousePointerClick,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/marketing/campaigns")({
  component: CampaignList,
});

type Campaign = {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "active" | "paused" | "completed";
  type: "email" | "sms" | "social" | "multi-channel";
  sent: number;
  delivered: number;
  openRate: number;
  clickRate: number;
  conversions: number;
  revenue: number;
  startDate: string;
  endDate?: string;
};

const mockCampaigns: Campaign[] = [
  { id: "1", name: "Spring Sale 2026", status: "active", type: "email", sent: 25000, delivered: 24850, openRate: 34.2, clickRate: 5.8, conversions: 342, revenue: 68400, startDate: "2026-03-01", endDate: "2026-03-31" },
  { id: "2", name: "Product Launch - Series X", status: "active", type: "multi-channel", sent: 18000, delivered: 17820, openRate: 41.5, clickRate: 8.2, conversions: 256, revenue: 51200, startDate: "2026-02-15" },
  { id: "3", name: "Customer Retention Q1", status: "paused", type: "email", sent: 32000, delivered: 31840, openRate: 28.7, clickRate: 4.1, conversions: 189, revenue: 37800, startDate: "2026-01-01", endDate: "2026-03-15" },
  { id: "4", name: "Newsletter Weekly", status: "active", type: "email", sent: 45000, delivered: 44820, openRate: 22.1, clickRate: 3.5, conversions: 89, revenue: 8900, startDate: "2026-01-01" },
  { id: "5", name: "Abandoned Cart Recovery", status: "active", type: "email", sent: 8500, delivered: 8420, openRate: 45.3, clickRate: 12.8, conversions: 567, revenue: 113400, startDate: "2026-02-01" },
  { id: "6", name: "VIP Customer Appreciation", status: "completed", type: "multi-channel", sent: 5200, delivered: 5180, openRate: 52.1, clickRate: 15.4, conversions: 124, revenue: 62000, startDate: "2026-02-01", endDate: "2026-02-28" },
  { id: "7", name: "Summer Preview Event", status: "draft", type: "email", sent: 0, delivered: 0, openRate: 0, clickRate: 0, conversions: 0, revenue: 0, startDate: "2026-04-01" },
  { id: "8", name: "Re-engagement Campaign", status: "scheduled", type: "email", sent: 0, delivered: 0, openRate: 0, clickRate: 0, conversions: 0, revenue: 0, startDate: "2026-03-25" },
];

function CampaignList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", type: "email", subject: "" });

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
    if (typeFilter !== "all" && campaign.type !== typeFilter) return false;
    if (!search.trim()) return true;
    return campaign.name.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusBadge = (status: Campaign["status"]) => {
    const variants: Record<Campaign["status"], "success" | "warning" | "outline" | "primary" | "danger"> = {
      active: "success",
      paused: "warning",
      completed: "outline",
      scheduled: "primary",
      draft: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getTypeIcon = (type: Campaign["type"]) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms": return <Send className="h-4 w-4" />;
      case "social": return <Users className="h-4 w-4" />;
      case "multi-channel": return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Manage and monitor your marketing campaigns</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Campaigns" value="8" icon={<Zap className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Active" value="4" icon={<Play className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Total Sent" value="133.7K" icon={<Send className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Avg Open Rate" value="32.4%" icon={<MailOpen className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Types</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="social">Social</option>
          <option value="multi-channel">Multi-channel</option>
        </select>
      </div>

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-12 w-12" />}
          title="No campaigns found"
          description="Create your first campaign or adjust your filters."
          action={{ label: "Create Campaign", onClick: () => setIsCreateModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      {getTypeIcon(campaign.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1).replace("-", " ")} campaign
                        {campaign.startDate && ` started ${new Date(campaign.startDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/app/marketing/campaigns/${campaign.id}` as string}>
                      <Button size="sm" variant="ghost" leftIcon={<BarChart3 className="h-4 w-4" />}>
                        Analytics
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" leftIcon={<Pencil className="h-4 w-4" />}>
                      Edit
                    </Button>
                    {campaign.status === "active" ? (
                      <Button size="sm" variant="ghost" leftIcon={<Pause className="h-4 w-4" />}>
                        Pause
                      </Button>
                    ) : campaign.status === "paused" ? (
                      <Button size="sm" variant="ghost" leftIcon={<Play className="h-4 w-4" />}>
                        Resume
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-6">
                  <Metric label="Sent" value={campaign.sent.toLocaleString()} />
                  <Metric label="Delivered" value={campaign.delivered.toLocaleString()} />
                  <Metric label="Open Rate" value={`${campaign.openRate}%`} />
                  <Metric label="Click Rate" value={`${campaign.clickRate}%`} />
                  <Metric label="Conversions" value={campaign.conversions.toString()} />
                  <Metric label="Revenue" value={`$${(campaign.revenue / 1000).toFixed(1)}K`} highlight />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Campaign"
        submitText="Create Campaign"
        onSubmit={(e) => {
          e.preventDefault();
          setIsCreateModalOpen(false);
          setNewCampaign({ name: "", type: "email", subject: "" });
        }}
      >
        <div className="space-y-4">
          <FormField label="Campaign Name" required>
            <Input value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Enter campaign name" required />
          </FormField>
          <FormField label="Campaign Type" required>
            <select value={newCampaign.type} onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="social">Social</option>
              <option value="multi-channel">Multi-channel</option>
            </select>
          </FormField>
          <FormField label="Subject Line" required>
            <Input value={newCampaign.subject} onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })} placeholder="Enter email subject" required />
          </FormField>
        </div>
      </FormModal>
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

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-xs font-semibold ${highlight ? "text-emerald-400" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
