/**
 * CRM Email Sequences
 *
 * Email sequence management and automation.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Progress } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Mail,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm/sequences")({
  component: EmailSequences,
});

interface Sequence {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft" | "completed";
  steps: number;
  totalRecipients: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  converted: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  lastActive: string;
}

const mockSequences: Sequence[] = [
  {
    id: "1",
    name: "New Lead Welcome",
    description: "5-email series for new leads with product overview and demo invite",
    status: "active",
    steps: 5,
    totalRecipients: 245,
    sent: 198,
    opened: 142,
    clicked: 67,
    replied: 34,
    converted: 12,
    openRate: 72,
    clickRate: 34,
    createdAt: "2024-02-15",
    lastActive: "2024-03-20",
  },
  {
    id: "2",
    name: "Enterprise Outreach",
    description: "7-email sequence targeting enterprise decision-makers",
    status: "active",
    steps: 7,
    totalRecipients: 89,
    sent: 67,
    opened: 45,
    clicked: 28,
    replied: 15,
    converted: 5,
    openRate: 67,
    clickRate: 42,
    createdAt: "2024-03-01",
    lastActive: "2024-03-19",
  },
  {
    id: "3",
    name: "Demo Follow-up",
    description: "3-email follow-up sequence after product demos",
    status: "active",
    steps: 3,
    totalRecipients: 156,
    sent: 134,
    opened: 98,
    clicked: 52,
    replied: 28,
    converted: 18,
    openRate: 73,
    clickRate: 39,
    createdAt: "2024-02-20",
    lastActive: "2024-03-20",
  },
  {
    id: "4",
    name: "Re-engagement Campaign",
    description: "4-email campaign for dormant leads",
    status: "paused",
    steps: 4,
    totalRecipients: 312,
    sent: 156,
    opened: 67,
    clicked: 23,
    replied: 8,
    converted: 2,
    openRate: 43,
    clickRate: 15,
    createdAt: "2024-01-10",
    lastActive: "2024-03-10",
  },
  {
    id: "5",
    name: "Customer Upsell",
    description: "Cross-sell sequence for existing customers",
    status: "draft",
    steps: 4,
    totalRecipients: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    converted: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: "2024-03-18",
    lastActive: "2024-03-18",
  },
  {
    id: "6",
    name: "Trial Conversion",
    description: "6-email sequence to convert free trials to paid",
    status: "completed",
    steps: 6,
    totalRecipients: 89,
    sent: 89,
    opened: 71,
    clicked: 45,
    replied: 22,
    converted: 15,
    openRate: 80,
    clickRate: 51,
    createdAt: "2024-01-05",
    lastActive: "2024-02-28",
  },
];

function EmailSequences() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredSequences = mockSequences.filter((seq) => {
    const matchesSearch =
      searchQuery === "" ||
      seq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seq.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || seq.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    active: "bg-green-100 text-green-700 border-green-200",
    paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const totalStats = {
    activeSequences: mockSequences.filter((s) => s.status === "active").length,
    totalRecipients: mockSequences.reduce((sum, s) => sum + s.totalRecipients, 0),
    avgOpenRate: Math.round(
      mockSequences.filter((s) => s.sent > 0).reduce((sum, s) => sum + s.openRate, 0) /
        mockSequences.filter((s) => s.sent > 0).length
    ),
    avgClickRate: Math.round(
      mockSequences.filter((s) => s.sent > 0).reduce((sum, s) => sum + s.clickRate, 0) /
        mockSequences.filter((s) => s.sent > 0).length
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sequences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <Button onClick={() => toast.success("Sequence editor coming soon")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sequence
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Active Sequences</p>
                <p className="font-bold text-2xl">{totalStats.activeSequences}</p>
              </div>
              <Mail className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Recipients</p>
                <p className="font-bold text-2xl">{totalStats.totalRecipients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Avg Open Rate</p>
                <p className="font-bold text-2xl text-green-600">{totalStats.avgOpenRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Avg Click Rate</p>
                <p className="font-bold text-2xl text-blue-600">{totalStats.avgClickRate}%</p>
              </div>
              <Settings className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSequences.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No sequences found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredSequences.map((sequence) => (
            <Card key={sequence.id} className="border-border/60 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{sequence.name}</h3>
                      <Badge variant="outline" className={statusColors[sequence.status]}>
                        {sequence.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{sequence.description}</p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Steps</p>
                        <p className="font-semibold">{sequence.steps}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Recipients</p>
                        <p className="font-semibold">{sequence.totalRecipients}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sent</p>
                        <p className="font-semibold">{sequence.sent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Opened</p>
                        <p className="font-semibold text-green-600">{sequence.opened}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicked</p>
                        <p className="font-semibold text-blue-600">{sequence.clicked}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Converted</p>
                        <p className="font-semibold text-purple-600">{sequence.converted}</p>
                      </div>
                    </div>

                    {/* Performance Bars */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground w-16">Opens</span>
                        <Progress value={sequence.openRate} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{sequence.openRate}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground w-16">Clicks</span>
                        <Progress value={sequence.clickRate} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{sequence.clickRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {sequence.status === "active" ? (
                        <Button variant="outline" size="sm" onClick={() => toast.info("Sequence paused")}>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      ) : sequence.status === "paused" ? (
                        <Button variant="outline" size="sm" onClick={() => toast.info("Sequence resumed")}>
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last active: {sequence.lastActive}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
