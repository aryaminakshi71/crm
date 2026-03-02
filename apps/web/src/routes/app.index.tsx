import { Card, CardContent, CardHeader, CardTitle, LoadingSkeleton } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Brain,
  Briefcase,
  Building2,
  FolderKanban,
  LifeBuoy,
  Megaphone,
  Receipt,
  Scale,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["nucleo-summary-dashboard"],
    queryFn: () => nucleoApi.summary(),
  });

  const hrmQuery = useQuery({
    queryKey: ["hrm-summary-dashboard"],
    queryFn: () => nucleoApi.hrm.summary(),
  });

  const enterpriseQuery = useQuery({
    queryKey: ["enterprise-summary-dashboard"],
    queryFn: () => nucleoApi.enterprise.summary(),
  });

  const intelligenceQuery = useQuery({
    queryKey: ["intelligence-summary-dashboard"],
    queryFn: () => nucleoApi.intelligence.summary(),
  });

  const opsQuery = useQuery({
    queryKey: ["operations-summary-dashboard"],
    queryFn: () => nucleoApi.operations.summary(),
  });

  const ticketsQuery = useQuery({
    queryKey: ["dash-tickets"],
    queryFn: () => nucleoApi.tickets.list({ page: 1, limit: 10 }),
  });

  const invoicesQuery = useQuery({
    queryKey: ["dash-invoices"],
    queryFn: () => nucleoApi.invoices.list({ page: 1, limit: 10 }),
  });

  const projectsQuery = useQuery({
    queryKey: ["dash-projects"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 10 }),
  });

  const campaignsQuery = useQuery({
    queryKey: ["dash-campaigns"],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 10 }),
  });

  if (
    summaryQuery.isLoading ||
    hrmQuery.isLoading ||
    enterpriseQuery.isLoading ||
    intelligenceQuery.isLoading ||
    opsQuery.isLoading ||
    ticketsQuery.isLoading ||
    invoicesQuery.isLoading ||
    projectsQuery.isLoading ||
    campaignsQuery.isLoading
  ) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <LoadingSkeleton key={idx} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const s = summaryQuery.data || {};
  const hrm = hrmQuery.data || {};
  const ent = enterpriseQuery.data || {};
  const ai = intelligenceQuery.data || {};
  const ops = opsQuery.data || {};

  const modules = [
    { label: "CRM Customers", value: s.customers || 0, href: "/app/crm", icon: Building2 },
    { label: "Helpdesk Tickets", value: s.tickets || 0, href: "/app/helpdesk", icon: LifeBuoy },
    { label: "Projects", value: s.projects || 0, href: "/app/projects", icon: FolderKanban },
    { label: "Marketing Campaigns", value: s.campaigns || 0, href: "/app/marketing", icon: Megaphone },
    { label: "Invoicing", value: s.invoices || 0, href: "/app/invoicing", icon: Receipt },
    { label: "Procurement Requests", value: ops.purchaseRequests || 0, href: "/app/procurement", icon: Briefcase },
    { label: "Contracts", value: ops.contracts || 0, href: "/app/contracts", icon: Scale },
    { label: "HRM Headcount", value: hrm.headcount || 0, href: "/app/hrm", icon: UserRoundCog },
    { label: "Compliance Controls", value: ops.complianceControls || 0, href: "/app/compliance", icon: ShieldCheck },
    { label: "AI KPI Snapshots", value: ai.kpis || 0, href: "/app/intelligence", icon: Brain },
  ];

  const tickets = ticketsQuery.data?.data || [];
  const invoices = invoicesQuery.data?.data || [];
  const projects = projectsQuery.data?.data || [];
  const campaigns = campaignsQuery.data?.data || [];

  const recent = [
    ...tickets.map((t: any) => ({
      id: `ticket-${t.id}`,
      time: t.createdAt,
      message: `Ticket: ${t.subject}`,
    })),
    ...invoices.map((i: any) => ({
      id: `invoice-${i.id}`,
      time: i.createdAt,
      message: `Invoice: ${i.invoiceNumber} (${i.status})`,
    })),
    ...projects.map((p: any) => ({
      id: `project-${p.id}`,
      time: p.createdAt,
      message: `Project: ${p.name} (${p.status})`,
    })),
    ...campaigns.map((c: any) => ({
      id: `campaign-${c.id}`,
      time: c.createdAt,
      message: `Campaign: ${c.name} (${c.status})`,
    })),
  ]
    .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
    .slice(0, 10);

  const overdueInvoices = invoices.filter((invoice: any) => {
    if (!invoice.dueAt) return false;
    return new Date(invoice.dueAt).getTime() < Date.now() && invoice.status !== "paid";
  }).length;

  const openTickets = tickets.filter((ticket: any) => ticket.status !== "closed").length;
  const pendingProcurement = Number(ops.purchaseRequests || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Enterprise Dashboard</h1>
        <p className="text-muted-foreground">
          Unified view of CRM, helpdesk, projects, finance, procurement, contracts, HRM, compliance, and AI insights.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {modules.map((module) => (
          <Link key={module.label} to={module.href}>
            <Card className="transition-colors hover:border-primary/40 hover:bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">{module.label}</p>
                    <p className="font-bold text-2xl text-foreground">{module.value}</p>
                  </div>
                  <div className="rounded-md bg-primary/10 p-2">
                    <module.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operational Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-lg border border-border p-3 text-sm">
              Open support tickets: <span className="font-semibold">{openTickets}</span>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              Overdue invoices: <span className="font-semibold">{overdueInvoices}</span>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              Pending procurement requests: <span className="font-semibold">{pendingProcurement}</span>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              Payroll runs: <span className="font-semibold">{ops.payrollRuns || 0}</span>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              AI agent runs: <span className="font-semibold">{ai.agentRuns || 0}</span>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              Enterprise roles: <span className="font-semibold">{ent.roles || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              ) : (
                recent.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="text-foreground text-sm">{item.message}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.time ? new Date(item.time).toLocaleString() : "-"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
