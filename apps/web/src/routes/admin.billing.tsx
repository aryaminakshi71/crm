import { Card, CardContent, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, Users, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/billing")({
  component: AdminBillingPage,
});

function AdminBillingPage() {
  const { data: session, isPending } = useSession();

  // Admin guard
  if (isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  // Mock data - in real app, this would come from API
  const stats = {
    totalOrganizations: 156,
    activeSubscriptions: 142,
    pastDueSubscriptions: 8,
    trialingSubscriptions: 12,
    mrr: 45680,
    arr: 548160,
  };

  const organizations = [
    { id: "1", name: "Acme Corp", plan: "enterprise", status: "active", users: 45, mrr: 2200, dueDate: "2026-03-25" },
    { id: "2", name: "TechStart Inc", plan: "growth", status: "active", users: 12, mrr: 348, dueDate: "2026-03-25" },
    { id: "3", name: "Global Solutions", plan: "business", status: "past_due", users: 28, mrr: 1372, dueDate: "2026-03-05" },
    { id: "4", name: "Startup Labs", plan: "starter", status: "trialing", users: 3, mrr: 0, dueDate: "2026-03-20" },
    { id: "5", name: "Enterprise Co", plan: "enterprise", status: "active", users: 120, mrr: 5880, dueDate: "2026-03-25" },
    { id: "6", name: "Digital Agency", plan: "growth", status: "active", users: 18, mrr: 522, dueDate: "2026-03-25" },
    { id: "7", name: "Cloud Systems", plan: "business", status: "active", users: 35, mrr: 1715, dueDate: "2026-03-25" },
    { id: "8", name: "DataTech", plan: "starter", status: "canceled", users: 2, mrr: 0, dueDate: "-" },
  ];

  const modules = [
    { key: "crm", name: "CRM", subscribers: 156, revenue: 46800 },
    { key: "projects", name: "Projects", subscribers: 98, revenue: 28420 },
    { key: "invoicing", name: "Invoicing", subscribers: 124, revenue: 37200 },
    { key: "helpdesk", name: "Helpdesk", subscribers: 87, revenue: 24360 },
    { key: "campaign_pro", name: "Marketing", subscribers: 45, revenue: 13050 },
    { key: "ai", name: "AI", subscribers: 32, revenue: 9600 },
    { key: "monitoring", name: "Monitoring", subscribers: 67, revenue: 18760 },
    { key: "integrations", name: "Integrations", subscribers: 89, revenue: 24920 },
  ];

  const statusConfig: Record<string, { color: string; icon: any }> = {
    active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    trialing: { color: "bg-blue-100 text-blue-800", icon: Clock },
    past_due: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    canceled: { color: "bg-gray-100 text-gray-800", icon: XCircle },
  };

  const planColors: Record<string, string> = {
    starter: "bg-gray-100 text-gray-800",
    growth: "bg-blue-100 text-blue-800",
    business: "bg-purple-100 text-purple-800",
    enterprise: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Billing Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage subscriptions, invoices, and payment tracking.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Total MRR</p>
                <p className="font-black text-3xl text-foreground mt-1">${stats.mrr.toLocaleString()}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Active Subs</p>
                <p className="font-black text-3xl text-foreground mt-1">{stats.activeSubscriptions}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Past Due</p>
                <p className="font-black text-3xl text-foreground mt-1">{stats.pastDueSubscriptions}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Trialing</p>
                <p className="font-black text-3xl text-foreground mt-1">{stats.trialingSubscriptions}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organizations by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Organizations by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(planColors).map(([plan, color]) => {
                const count = organizations.filter(o => o.plan === plan).length;
                const pct = Math.round((count / organizations.length) * 100);
                return (
                  <div key={plan} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{plan}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color.replace("bg-", "bg-").split(" ")[0]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Module Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Module Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {modules.sort((a, b) => b.revenue - a.revenue).slice(0, 6).map((mod) => (
                <div key={mod.key} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">{mod.subscribers} subscribers</p>
                  </div>
                  <p className="font-bold text-green-600">${mod.revenue.toLocaleString()}/mo</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Organizations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Organizations</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Export</Button>
            <Button variant="primary" size="sm">Add Organization</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => {
                const StatusIcon = statusConfig[org.status]?.icon || Clock;
                return (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge className={planColors[org.plan]}>{org.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[org.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {org.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{org.users}</TableCell>
                    <TableCell className="font-medium">
                      {org.mrr > 0 ? `$${org.mrr.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{org.dueDate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Subscription Health */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-black text-green-600">{Math.round((stats.activeSubscriptions / stats.totalOrganizations) * 100)}%</p>
              <p className="text-sm text-muted-foreground">Retention Rate</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-black text-blue-600">{stats.trialingSubscriptions}</p>
              <p className="text-sm text-muted-foreground">In Trial</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-black text-red-600">{Math.round((stats.pastDueSubscriptions / stats.totalOrganizations) * 100)}%</p>
              <p className="text-sm text-muted-foreground">Churn Risk</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-black text-purple-600">${Math.round(stats.mrr / stats.activeSubscriptions)}</p>
              <p className="text-sm text-muted-foreground">Avg ARPU</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
