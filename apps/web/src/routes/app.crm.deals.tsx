/**
 * CRM Deals List
 *
 * Deals list with filters, sorting, and status tracking.
 */

import { Badge, Button, Card, CardContent, Input, Progress } from "@crm/ui";
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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm/deals")({
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

const mockDeals: Deal[] = [
  {
    id: "1",
    title: "Enterprise SaaS License",
    company: "Acme Corporation",
    contact: "John Smith",
    value: 125000,
    stage: "negotiation",
    probability: 75,
    expectedClose: "2024-04-15",
    createdAt: "2024-02-01",
    lastActivity: "2024-03-15",
    owner: "Sarah Chen",
    tags: ["enterprise", "hot"],
  },
  {
    id: "2",
    title: "Cloud Migration Project",
    company: "TechStart Inc",
    contact: "Sarah Johnson",
    value: 89000,
    stage: "proposal",
    probability: 60,
    expectedClose: "2024-04-30",
    createdAt: "2024-02-15",
    lastActivity: "2024-03-14",
    owner: "David Park",
    tags: ["cloud", "mid-market"],
  },
  {
    id: "3",
    title: "Security Audit Services",
    company: "DataFlow Ltd",
    contact: "Mike Chen",
    value: 45000,
    stage: "qualified",
    probability: 40,
    expectedClose: "2024-05-15",
    createdAt: "2024-02-20",
    lastActivity: "2024-03-13",
    owner: "Emily Zhang",
    tags: ["security", "consulting"],
  },
  {
    id: "4",
    title: "Platform Integration",
    company: "Global Industries",
    contact: "Emily Wong",
    value: 156000,
    stage: "negotiation",
    probability: 80,
    expectedClose: "2024-03-30",
    createdAt: "2024-01-15",
    lastActivity: "2024-03-15",
    owner: "Sarah Chen",
    tags: ["enterprise", "integration"],
  },
  {
    id: "5",
    title: "Annual Support Contract",
    company: "StartupXYZ",
    contact: "David Park",
    value: 36000,
    stage: "closed_won",
    probability: 100,
    expectedClose: "2024-03-01",
    createdAt: "2024-01-20",
    lastActivity: "2024-03-01",
    owner: "Mike Lee",
    tags: ["recurring"],
  },
  {
    id: "6",
    title: "Data Analytics Suite",
    company: "FinanceHub",
    contact: "Jennifer Lee",
    value: 78000,
    stage: "proposal",
    probability: 55,
    expectedClose: "2024-05-01",
    createdAt: "2024-02-25",
    lastActivity: "2024-03-12",
    owner: "Emily Zhang",
    tags: ["analytics", "finance"],
  },
  {
    id: "7",
    title: "Mobile App Development",
    company: "RetailCo",
    contact: "Robert Kim",
    value: 92000,
    stage: "qualified",
    probability: 35,
    expectedClose: "2024-06-15",
    createdAt: "2024-03-01",
    lastActivity: "2024-03-10",
    owner: "David Park",
    tags: ["mobile", "retail"],
  },
  {
    id: "8",
    title: "Full Platform License",
    company: "MegaCorp",
    contact: "Lisa Wang",
    value: 245000,
    stage: "closed_won",
    probability: 100,
    expectedClose: "2024-02-28",
    createdAt: "2024-01-10",
    lastActivity: "2024-02-28",
    owner: "Sarah Chen",
    tags: ["enterprise", "platform"],
  },
];

function DealsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("value");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredDeals = mockDeals
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

  const totalValue = mockDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = mockDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const wonValue = mockDeals.filter((d) => d.stage === "closed_won").reduce((sum, d) => sum + d.value, 0);

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
                <p className="font-bold text-2xl">{mockDeals.length}</p>
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
                        <Badge variant="outline" className={stageColors[deal.stage]}>
                          {stageLabels[deal.stage]}
                        </Badge>
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
          Showing {filteredDeals.length} of {mockDeals.length} deals
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
