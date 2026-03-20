/**
 * CRM Commission Tracking
 *
 * Sales commission tracking and management.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Progress } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Award,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  Filter,
  MoreHorizontal,
  Search,
  TrendingUp,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crm/commissions")({
  component: CommissionTracking,
});

interface CommissionRecord {
  id: string;
  repId: string;
  repName: string;
  dealId: string;
  dealName: string;
  company: string;
  closedDate: string;
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid" | "disputed";
  tier: "bronze" | "silver" | "gold" | "platinum";
  notes?: string;
}

interface RepSummary {
  id: string;
  name: string;
  quota: number;
  achieved: number;
  attainment: number;
  commission: number;
  paid: number;
  pending: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  deals: number;
}

const mockRepSummaries: RepSummary[] = [
  {
    id: "1",
    name: "Sarah Chen",
    quota: 150000,
    achieved: 165000,
    attainment: 110,
    commission: 24750,
    paid: 18000,
    pending: 6750,
    tier: "platinum",
    deals: 12,
  },
  {
    id: "2",
    name: "David Park",
    quota: 120000,
    achieved: 118000,
    attainment: 98,
    commission: 17700,
    paid: 17700,
    pending: 0,
    tier: "gold",
    deals: 9,
  },
  {
    id: "3",
    name: "Emily Zhang",
    quota: 130000,
    achieved: 142000,
    attainment: 109,
    commission: 21300,
    paid: 14200,
    pending: 7100,
    tier: "platinum",
    deals: 11,
  },
  {
    id: "4",
    name: "Mike Lee",
    quota: 100000,
    achieved: 95000,
    attainment: 95,
    commission: 14250,
    paid: 14250,
    pending: 0,
    tier: "silver",
    deals: 7,
  },
  {
    id: "5",
    name: "Lisa Wang",
    quota: 110000,
    achieved: 121000,
    attainment: 110,
    commission: 18150,
    paid: 12100,
    pending: 6050,
    tier: "gold",
    deals: 10,
  },
];

const mockCommissionRecords: CommissionRecord[] = [
  {
    id: "1",
    repId: "1",
    repName: "Sarah Chen",
    dealId: "1",
    dealName: "Enterprise SaaS License",
    company: "Acme Corporation",
    closedDate: "2024-03-15",
    dealValue: 125000,
    commissionRate: 15,
    commissionAmount: 18750,
    status: "approved",
    tier: "platinum",
  },
  {
    id: "2",
    repId: "3",
    repName: "Emily Zhang",
    dealId: "4",
    dealName: "Platform Integration",
    company: "Global Industries",
    closedDate: "2024-03-14",
    dealValue: 156000,
    commissionRate: 12,
    commissionAmount: 18720,
    status: "pending",
    tier: "gold",
  },
  {
    id: "3",
    repId: "1",
    repName: "Sarah Chen",
    dealId: "8",
    dealName: "Full Platform License",
    company: "MegaCorp",
    closedDate: "2024-02-28",
    dealValue: 245000,
    commissionRate: 15,
    commissionAmount: 36750,
    status: "paid",
    tier: "platinum",
  },
  {
    id: "4",
    repId: "5",
    repName: "Lisa Wang",
    dealId: "4",
    dealName: "Platform Integration",
    company: "Global Industries",
    closedDate: "2024-03-10",
    dealValue: 78000,
    commissionRate: 12,
    commissionAmount: 9360,
    status: "approved",
    tier: "gold",
  },
  {
    id: "5",
    repId: "2",
    repName: "David Park",
    dealId: "2",
    dealName: "Cloud Migration Project",
    company: "TechStart Inc",
    closedDate: "2024-03-01",
    dealValue: 89000,
    commissionRate: 12,
    commissionAmount: 10680,
    status: "paid",
    tier: "silver",
  },
];

function CommissionTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repFilter, setRepFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "records">("overview");

  const filteredRecords = mockCommissionRecords.filter((record) => {
    const matchesSearch =
      searchQuery === "" ||
      record.repName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesRep = repFilter === "all" || record.repId === repFilter;

    return matchesSearch && matchesStatus && matchesRep;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    approved: "bg-blue-100 text-blue-700 border-blue-200",
    paid: "bg-green-100 text-green-700 border-green-200",
    disputed: "bg-red-100 text-red-700 border-red-200",
  };

  const tierColors: Record<string, string> = {
    bronze: "bg-amber-100 text-amber-700 border-amber-200",
    silver: "bg-gray-100 text-gray-700 border-gray-200",
    gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
    platinum: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  const tierIcons: Record<string, React.ReactNode> = {
    bronze: <Award className="h-4 w-4 text-amber-600" />,
    silver: <Award className="h-4 w-4 text-gray-600" />,
    gold: <Award className="h-4 w-4 text-yellow-500" />,
    platinum: <Award className="h-4 w-4 text-indigo-500" />,
  };

  const stats = {
    totalCommission: mockRepSummaries.reduce((sum, r) => sum + r.commission, 0),
    totalPaid: mockRepSummaries.reduce((sum, r) => sum + r.paid, 0),
    totalPending: mockRepSummaries.reduce((sum, r) => sum + r.pending, 0),
    totalDeals: mockRepSummaries.reduce((sum, r) => sum + r.deals, 0),
  };

  const totalQuota = mockRepSummaries.reduce((sum, r) => sum + r.quota, 0);
  const totalAchieved = mockRepSummaries.reduce((sum, r) => sum + r.achieved, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commissions..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Rep Overview
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "records"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Commission Records
          </button>
        </nav>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Commission</p>
                <p className="font-bold text-2xl mt-1">${(stats.totalCommission / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Paid Out</p>
                <p className="font-bold text-2xl mt-1 text-green-600">${(stats.totalPaid / 1000).toFixed(0)}K</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Pending</p>
                <p className="font-bold text-2xl mt-1 text-yellow-600">${(stats.totalPending / 1000).toFixed(0)}K</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Quota Attainment</p>
                <p className="font-bold text-2xl mt-1">
                  {Math.round((totalAchieved / totalQuota) * 100)}%
                </p>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min((totalAchieved / totalQuota) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rep Overview Tab */}
      {activeTab === "overview" && (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Sales Rep
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Tier
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Quota
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Achieved
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Attainment
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Commission
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Paid / Pending
                    </th>
                    <th className="w-12 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {mockRepSummaries.map((rep) => (
                    <tr key={rep.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{rep.name}</p>
                            <p className="text-xs text-muted-foreground">{rep.deals} deals</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={tierColors[rep.tier]}>
                          {tierIcons[rep.tier]}
                          <span className="ml-1 capitalize">{rep.tier}</span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">${(rep.quota / 1000).toFixed(0)}K</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">${(rep.achieved / 1000).toFixed(0)}K</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rep.attainment >= 100 ? "bg-green-500" : "bg-yellow-500"
                              }`}
                              style={{ width: `${Math.min(rep.attainment, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              rep.attainment >= 100 ? "text-green-600" : "text-yellow-600"
                            }`}
                          >
                            {rep.attainment}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold">
                          ${(rep.commission / 1000).toFixed(0)}K
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <span className="text-green-600">${(rep.paid / 1000).toFixed(0)}K</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-yellow-600">${(rep.pending / 1000).toFixed(0)}K</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Records Tab */}
      {activeTab === "records" && (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Deal
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Rep
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Closed Date
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Deal Value
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Rate
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Commission
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="w-12 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No records found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-sm">{record.dealName}</p>
                            <p className="text-xs text-muted-foreground">{record.company}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{record.repName}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{record.closedDate}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">${(record.dealValue / 1000).toFixed(0)}K</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{record.commissionRate}%</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-semibold">
                            ${(record.commissionAmount / 1000).toFixed(0)}K
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={statusColors[record.status]}>
                            {record.status}
                          </Badge>
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
      )}
    </div>
  );
}
