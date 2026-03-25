import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input, Tabs, TabsContent, TabsList, TabsTrigger, Progress, Loading } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  Settings,
  Search,
  Filter,
  Plus,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Puzzle,
  Bot,
  Layers,
  Mail,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/admin/organizations")({
  component: AdminOrganizationsPage,
});

// Module icons mapping
const moduleIcons: Record<string, any> = {
  crm: Users,
  projects: Layers,
  invoicing: CreditCard,
  helpdesk: Activity,
  marketing: BarChart3,
  hrm: Users,
  integrations: Puzzle,
  agents: Bot,
  monitoring: Activity,
};

// Organization data
const organizations = [
  {
    id: "1",
    name: "Acme Corporation",
    slug: "acme-corp",
    plan: "enterprise",
    status: "active",
    users: 156,
    modules: ["crm", "projects", "invoicing", "helpdesk", "marketing", "hrm", "integrations", "agents", "monitoring"],
    mrr: 7800,
    trialEnds: null,
    createdAt: "2025-06-15",
    lastActive: "2026-03-19",
  },
  {
    id: "2",
    name: "TechStart Inc",
    slug: "techstart",
    plan: "growth",
    status: "active",
    users: 34,
    modules: ["crm", "projects", "invoicing", "helpdesk"],
    mrr: 986,
    trialEnds: null,
    createdAt: "2025-09-22",
    lastActive: "2026-03-19",
  },
  {
    id: "3",
    name: "Global Solutions Ltd",
    slug: "global-solutions",
    plan: "business",
    status: "past_due",
    users: 89,
    modules: ["crm", "projects", "invoicing", "helpdesk", "marketing", "integrations"],
    mrr: 4361,
    trialEnds: null,
    createdAt: "2025-08-10",
    lastActive: "2026-03-18",
  },
  {
    id: "4",
    name: "Startup Labs",
    slug: "startup-labs",
    plan: "starter",
    status: "trialing",
    users: 5,
    modules: ["crm", "projects"],
    mrr: 0,
    trialEnds: "2026-04-02",
    createdAt: "2026-03-05",
    lastActive: "2026-03-19",
  },
  {
    id: "5",
    name: "Enterprise Co",
    slug: "enterprise-co",
    plan: "enterprise",
    status: "active",
    users: 342,
    modules: ["crm", "projects", "invoicing", "helpdesk", "marketing", "hrm", "integrations", "agents", "monitoring"],
    mrr: 17100,
    trialEnds: null,
    createdAt: "2025-03-01",
    lastActive: "2026-03-19",
  },
  {
    id: "6",
    name: "Digital Agency Pro",
    slug: "digital-agency",
    plan: "growth",
    status: "active",
    users: 45,
    modules: ["crm", "projects", "marketing", "integrations", "agents"],
    mrr: 1305,
    trialEnds: null,
    createdAt: "2025-11-30",
    lastActive: "2026-03-19",
  },
];

function AdminOrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/organizations");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: billingStats } = useQuery({
    queryKey: ["admin-billing-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/billing/stats");
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Fall back to mock data if API not ready
  const liveOrgs = (orgsData as any)?.data ?? organizations;
  const totalMRR = liveOrgs.reduce((sum: number, o: any) => sum + o.mrr, 0);
  const liveMRR = (billingStats as any)?.mrr ?? totalMRR;

  const filteredOrgs = liveOrgs.filter((org: any) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || org.status === filterStatus;
    const matchesPlan = filterPlan === "all" || org.plan === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    active: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" },
    trialing: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "Trial" },
    past_due: { color: "bg-red-100 text-red-800", icon: AlertCircle, label: "Past Due" },
    canceled: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Canceled" },
  };

  const planColors: Record<string, string> = {
    starter: "bg-gray-100 text-gray-800",
    growth: "bg-blue-100 text-blue-800",
    business: "bg-purple-100 text-purple-800",
    enterprise: "bg-amber-100 text-amber-800",
  };

  // Stats derived from live data
  const activeCount = liveOrgs.filter((o: any) => o.status === "active").length;
  const trialCount = liveOrgs.filter((o: any) => o.status === "trialing").length;
  const pastDueCount = liveOrgs.filter((o: any) => o.status === "past_due").length;
  const totalUsers = liveOrgs.reduce((sum: number, o: any) => sum + o.users, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground flex items-center gap-2">
            <Building2 className="h-7 w-7" />
            Organizations
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Manage all {liveOrgs.length} organizations and their subscriptions
            {isLoading && <Loading size="sm" />}
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Organization
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <p className="text-2xl font-black text-primary">${liveMRR.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Monthly Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-green-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-blue-600">{trialCount}</p>
            <p className="text-xs text-muted-foreground">Trialing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-red-600">{pastDueCount}</p>
            <p className="text-xs text-muted-foreground">Past Due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black">{liveOrgs.length}</p>
            <p className="text-xs text-muted-foreground">Organizations</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Module Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Organizations Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org: any) => {
                    const StatusIcon = statusConfig[org.status]?.icon || Clock;
                    return (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-xs text-muted-foreground">{org.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={planColors[org.plan]}>{org.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[org.status]?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[org.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{org.users}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {org.modules.slice(0, 3).map((mod: any) => {
                              const Icon = moduleIcons[mod] || Layers;
                              return (
                                <div
                                  key={mod}
                                  className="p-1 bg-secondary rounded"
                                  title={mod}
                                >
                                  <Icon className="h-3 w-3" />
                                </div>
                              );
                            })}
                            {org.modules.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{org.modules.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {org.mrr > 0 ? `$${org.mrr.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {org.lastActive}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Module Adoption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(moduleIcons).map(([key, Icon]) => {
                  const subscribers = liveOrgs.filter((o: any) => o.modules?.includes(key)).length;
                  const percentage = liveOrgs.length > 0 ? Math.round((subscribers / liveOrgs.length) * 100) : 0;
                  return (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-medium capitalize">{key}</span>
                        </div>
                        <Badge>{percentage}%</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {subscribers} of {liveOrgs.length} organizations
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["enterprise", "business", "growth", "starter"].map((plan) => {
                    const orgs = liveOrgs.filter((o: any) => o.plan === plan);
                    const revenue = orgs.reduce((sum: number, o: any) => sum + o.mrr, 0);
                    const percentage = liveMRR > 0 ? Math.round((revenue / liveMRR) * 100) : 0;
                    return (
                      <div key={plan} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{plan}</span>
                          <span>${revenue.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Renewals */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveOrgs.slice(0, 4).map((org: any) => (
                    <div key={org.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">Renews in 7 days</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${org.mrr.toLocaleString()}</p>
                        <Badge className={planColors[org.plan]}>{org.plan}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
