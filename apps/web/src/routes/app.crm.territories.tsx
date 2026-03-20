/**
 * CRM Territory Management
 *
 * Sales territory assignment and management.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  DollarSign,
  Edit2,
  Globe,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm/territories")({
  component: TerritoryManagement,
});

interface Territory {
  id: string;
  name: string;
  region: string;
  type: "geographic" | "industry" | "account-based";
  representatives: {
    id: string;
    name: string;
    role: string;
  }[];
  accounts: number;
  revenue: number;
  quota: number;
  attainment: number;
  deals: number;
  leads: number;
  openDeals: number;
  openDealsValue: number;
}

const mockTerritories: Territory[] = [
  {
    id: "1",
    name: "West Coast",
    region: "California, Oregon, Washington",
    type: "geographic",
    representatives: [
      { id: "1", name: "Sarah Chen", role: "Account Executive" },
      { id: "3", name: "Emily Zhang", role: "Sales Development" },
    ],
    accounts: 45,
    revenue: 1250000,
    quota: 1200000,
    attainment: 104,
    deals: 23,
    leads: 156,
    openDeals: 8,
    openDealsValue: 890000,
  },
  {
    id: "2",
    name: "East Coast",
    region: "New York, Massachusetts, Pennsylvania",
    type: "geographic",
    representatives: [
      { id: "5", name: "Lisa Wang", role: "Account Executive" },
      { id: "6", name: "Tom Harris", role: "Sales Development" },
    ],
    accounts: 52,
    revenue: 1180000,
    quota: 1300000,
    attainment: 91,
    deals: 19,
    leads: 178,
    openDeals: 12,
    openDealsValue: 1250000,
  },
  {
    id: "3",
    name: "Central",
    region: "Texas, Illinois, Colorado",
    type: "geographic",
    representatives: [
      { id: "2", name: "David Park", role: "Account Executive" },
    ],
    accounts: 38,
    revenue: 720000,
    quota: 800000,
    attainment: 90,
    deals: 15,
    leads: 124,
    openDeals: 6,
    openDealsValue: 540000,
  },
  {
    id: "4",
    name: "Technology",
    region: "Software, SaaS, Cloud",
    type: "industry",
    representatives: [
      { id: "1", name: "Sarah Chen", role: "Account Executive" },
      { id: "4", name: "Mike Lee", role: "Sales Engineer" },
    ],
    accounts: 28,
    revenue: 1560000,
    quota: 1400000,
    attainment: 111,
    deals: 18,
    leads: 89,
    openDeals: 5,
    openDealsValue: 780000,
  },
  {
    id: "5",
    name: "Enterprise Accounts",
    region: "Fortune 500 Companies",
    type: "account-based",
    representatives: [
      { id: "1", name: "Sarah Chen", role: "Enterprise AE" },
      { id: "5", name: "Lisa Wang", role: "Enterprise AE" },
      { id: "4", name: "Mike Lee", role: "Solutions Architect" },
    ],
    accounts: 12,
    revenue: 2450000,
    quota: 2000000,
    attainment: 123,
    deals: 8,
    leads: 34,
    openDeals: 4,
    openDealsValue: 1560000,
  },
  {
    id: "6",
    name: "Mid-Market",
    region: "SMB Segment",
    type: "account-based",
    representatives: [
      { id: "2", name: "David Park", role: "Account Executive" },
      { id: "3", name: "Emily Zhang", role: "SDR" },
    ],
    accounts: 67,
    revenue: 580000,
    quota: 600000,
    attainment: 97,
    deals: 28,
    leads: 234,
    openDeals: 11,
    openDealsValue: 420000,
  },
];

function TerritoryManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredTerritories = mockTerritories.filter((territory) => {
    const matchesSearch =
      searchQuery === "" ||
      territory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      territory.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || territory.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const typeColors: Record<string, string> = {
    geographic: "bg-blue-100 text-blue-700 border-blue-200",
    industry: "bg-purple-100 text-purple-700 border-purple-200",
    "account-based": "bg-green-100 text-green-700 border-green-200",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    geographic: <Globe className="h-4 w-4" />,
    industry: <TrendingUp className="h-4 w-4" />,
    "account-based": <Users className="h-4 w-4" />,
  };

  const stats = {
    totalTerritories: mockTerritories.length,
    totalRevenue: mockTerritories.reduce((sum, t) => sum + t.revenue, 0),
    totalQuota: mockTerritories.reduce((sum, t) => sum + t.quota, 0),
    totalAccounts: mockTerritories.reduce((sum, t) => sum + t.accounts, 0),
    avgAttainment: Math.round(
      mockTerritories.reduce((sum, t) => sum + t.attainment, 0) / mockTerritories.length
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
              placeholder="Search territories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="geographic">Geographic</option>
            <option value="industry">Industry</option>
            <option value="account-based">Account-Based</option>
          </select>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Territory
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Territories</p>
                <p className="font-bold text-2xl">{stats.totalTerritories}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Revenue</p>
                <p className="font-bold text-2xl">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Accounts</p>
                <p className="font-bold text-2xl">{stats.totalAccounts}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Quota</p>
                <p className="font-bold text-2xl">${(stats.totalQuota / 1000000).toFixed(1)}M</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Avg Attainment</p>
                <p className="font-bold text-2xl text-green-600">{stats.avgAttainment}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territories Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTerritories.length === 0 ? (
          <Card className="border-border/60 md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No territories found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredTerritories.map((territory) => (
            <Card key={territory.id} className="border-border/60 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{territory.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{territory.region}</p>
                  </div>
                  <Badge variant="outline" className={typeColors[territory.type]}>
                    {typeIcons[territory.type]}
                    <span className="ml-1 capitalize">{territory.type}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Revenue & Quota */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Attainment</span>
                    <span
                      className={`text-sm font-semibold ${
                        territory.attainment >= 100 ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {territory.attainment}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        territory.attainment >= 100 ? "bg-green-500" : "bg-yellow-500"
                      }`}
                      style={{ width: `${Math.min(territory.attainment, 120)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>${(territory.revenue / 1000000).toFixed(1)}M</span>
                    <span>${(territory.quota / 1000000).toFixed(1)}M</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{territory.accounts}</p>
                    <p className="text-xs text-muted-foreground">Accounts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{territory.deals}</p>
                    <p className="text-xs text-muted-foreground">Deals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{territory.leads}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                </div>

                {/* Open Deals */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Open Deals</span>
                    <span className="font-medium">{territory.openDeals}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Pipeline Value</span>
                    <span className="font-medium text-blue-600">
                      ${(territory.openDealsValue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>

                {/* Representatives */}
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    {territory.representatives.length} Representative
                    {territory.representatives.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {territory.representatives.map((rep) => (
                      <div
                        key={rep.id}
                        className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium">{rep.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Territory Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Create New Territory</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Territory Name</label>
                  <Input placeholder="West Coast" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Region / Coverage</label>
                  <Input placeholder="California, Oregon, Washington" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="geographic">Geographic</option>
                    <option value="industry">Industry</option>
                    <option value="account-based">Account-Based</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Quota</label>
                  <Input type="number" placeholder="1000000" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Territory created successfully");
                    setShowCreateModal(false);
                  }}
                >
                  Create Territory
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
