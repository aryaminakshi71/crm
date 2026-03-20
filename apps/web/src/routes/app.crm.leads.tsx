/**
 * CRM Leads Management
 *
 * Lead list with scoring visualization and status tracking.
 */

import { Badge, Button, Card, CardContent, Input, Progress } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Filter,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Star,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm/leads")({
  component: LeadsList,
});

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "unqualified";
  score: number;
  scoreBreakdown: {
    engagement: number;
    firmographics: number;
    demographic: number;
  };
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  estimatedValue: number;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Alex Rivera",
    email: "alex.r@techventures.com",
    phone: "+1 (555) 111-2222",
    company: "Tech Ventures LLC",
    jobTitle: "CTO",
    source: "Website",
    status: "qualified",
    score: 92,
    scoreBreakdown: { engagement: 30, firmographics: 35, demographic: 27 },
    assignedTo: "Sarah Chen",
    createdAt: "2024-03-10",
    lastActivity: "2024-03-15",
    estimatedValue: 150000,
  },
  {
    id: "2",
    name: "Michelle Chang",
    email: "mchang@startupx.io",
    phone: "+1 (555) 222-3333",
    company: "StartupX",
    jobTitle: "Founder",
    source: "LinkedIn",
    status: "new",
    score: 78,
    scoreBreakdown: { engagement: 25, firmographics: 28, demographic: 25 },
    assignedTo: "David Park",
    createdAt: "2024-03-12",
    lastActivity: "2024-03-14",
    estimatedValue: 85000,
  },
  {
    id: "3",
    name: "James Wilson",
    email: "jwilson@enterprise.com",
    phone: "+1 (555) 333-4444",
    company: "Enterprise Corp",
    jobTitle: "VP Operations",
    source: "Referral",
    status: "contacted",
    score: 65,
    scoreBreakdown: { engagement: 20, firmographics: 25, demographic: 20 },
    assignedTo: "Emily Zhang",
    createdAt: "2024-03-08",
    lastActivity: "2024-03-13",
    estimatedValue: 200000,
  },
  {
    id: "4",
    name: "Priya Patel",
    email: "ppatel@innovate.co",
    phone: "+1 (555) 444-5555",
    company: "Innovate Co",
    jobTitle: "Head of Product",
    source: "Webinar",
    status: "qualified",
    score: 88,
    scoreBreakdown: { engagement: 28, firmographics: 32, demographic: 28 },
    assignedTo: "Sarah Chen",
    createdAt: "2024-03-05",
    lastActivity: "2024-03-15",
    estimatedValue: 120000,
  },
  {
    id: "5",
    name: "Chris Anderson",
    email: "canderson@legacy.net",
    phone: "+1 (555) 555-6666",
    company: "Legacy Networks",
    jobTitle: "IT Director",
    source: "Cold Outreach",
    status: "unqualified",
    score: 35,
    scoreBreakdown: { engagement: 10, firmographics: 15, demographic: 10 },
    assignedTo: "Unassigned",
    createdAt: "2024-03-01",
    lastActivity: "2024-03-10",
    estimatedValue: 45000,
  },
  {
    id: "6",
    name: "Sarah Kim",
    email: "skim@growthco.com",
    phone: "+1 (555) 666-7777",
    company: "GrowthCo",
    jobTitle: "CEO",
    source: "Partner",
    status: "new",
    score: 82,
    scoreBreakdown: { engagement: 27, firmographics: 30, demographic: 25 },
    assignedTo: "David Park",
    createdAt: "2024-03-14",
    lastActivity: "2024-03-15",
    estimatedValue: 175000,
  },
];

function LeadsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    const matchesScore =
      scoreFilter === "all" ||
      (scoreFilter === "hot" && lead.score >= 80) ||
      (scoreFilter === "warm" && lead.score >= 50 && lead.score < 80) ||
      (scoreFilter === "cold" && lead.score < 50);

    return matchesSearch && matchesStatus && matchesScore;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-700 border-blue-200",
    contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
    qualified: "bg-green-100 text-green-700 border-green-200",
    unqualified: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const sourceIcons: Record<string, string> = {
    Website: "globe",
    LinkedIn: "users",
    Referral: "star",
    Webinar: "target",
    "Cold Outreach": "zap",
    Partner: "trending",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
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
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
          </select>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Scores</option>
            <option value="hot">Hot (80+)</option>
            <option value="warm">Warm (50-79)</option>
            <option value="cold">Cold (&lt;50)</option>
          </select>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Lead Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Leads</p>
                <p className="font-bold text-2xl">{mockLeads.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Hot Leads</p>
                <p className="font-bold text-2xl text-green-600">
                  {mockLeads.filter((l) => l.score >= 80).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Avg Score</p>
                <p className="font-bold text-2xl">
                  {Math.round(mockLeads.reduce((sum, l) => sum + l.score, 0) / mockLeads.length)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Pipeline Value</p>
                <p className="font-bold text-2xl">
                  ${(mockLeads.reduce((sum, l) => sum + l.estimatedValue, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground w-[300px]">
                    Lead
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Assigned To
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Est. Value
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Last Activity
                  </th>
                  <th className="w-12 p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No leads found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <Link
                          to={`/app/crm/leads/${lead.id}` as string}
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {lead.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">
                              {lead.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.jobTitle} at {lead.company}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{lead.source}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={statusColors[lead.status]}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Score</span>
                              <span
                                className={`text-xs font-semibold ${getScoreColor(lead.score).split(
                                  " "
                                )[0]}`}
                              >
                                {lead.score}
                              </span>
                            </div>
                            <Progress
                              value={lead.score}
                              className="h-2"
                            />
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                          <div>Eng: {lead.scoreBreakdown.engagement}</div>
                          <div>Firm: {lead.scoreBreakdown.firmographics}</div>
                          <div>Demo: {lead.scoreBreakdown.demographic}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{lead.assignedTo}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          ${(lead.estimatedValue / 1000).toFixed(0)}K
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {lead.lastActivity}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
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
          Showing {filteredLeads.length} of {mockLeads.length} leads
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
    </div>
  );
}
