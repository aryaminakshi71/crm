import { Card, CardContent, CardHeader, CardTitle, LoadingSkeleton } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Brain,
  Briefcase,
  FileText,
  FolderKanban,
  Megaphone,
  Receipt,
  Scale,
  ShieldCheck,
  Ticket,
  UserRoundCog,
  Users,
} from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/unified")({
  component: UnifiedWorkspacePage,
});

function UnifiedWorkspacePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["nucleo-summary"],
    queryFn: () => nucleoApi.summary(),
  });

  const { data: opsSummary } = useQuery({
    queryKey: ["ops-summary-unified"],
    queryFn: () => nucleoApi.operations.summary(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <LoadingSkeleton key={idx} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          Failed to load unified workspace summary.
        </CardContent>
      </Card>
    );
  }

  const summary = data || {};
  const ops = opsSummary || {};

  const blocks = [
    { label: "CRM", value: summary.customers || 0, icon: Users, href: "/app/crm" },
    { label: "Projects", value: summary.projects || 0, icon: FolderKanban, href: "/app/projects" },
    { label: "Helpdesk", value: summary.tickets || 0, icon: Ticket, href: "/app/helpdesk" },
    { label: "Assets + Docs", value: (summary.assets || 0) + (summary.documents || 0), icon: FileText, href: "/app/assets" },
    { label: "Finance", value: summary.invoices || 0, icon: Receipt, href: "/app/finance" },
    { label: "Marketing", value: summary.campaigns || 0, icon: Megaphone, href: "/app/marketing" },
    { label: "Procurement", value: ops.purchaseRequests || 0, icon: Briefcase, href: "/app/procurement" },
    { label: "Contracts", value: ops.contracts || 0, icon: Scale, href: "/app/contracts" },
    { label: "HRM", value: summary.hrmEmployees || 0, icon: UserRoundCog, href: "/app/hrm" },
    { label: "Compliance", value: summary.enterpriseRoles || 0, icon: ShieldCheck, href: "/app/compliance" },
    { label: "Policies + DR", value: (ops.retentionPolicies || 0) + (ops.drDrills || 0), icon: ShieldCheck, href: "/app/policies" },
    { label: "AI + BI", value: summary.intelligenceKpis || 0, icon: Brain, href: "/app/intelligence" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Unified Workspace</h1>
        <p className="text-muted-foreground">
          Enterprise operations across CRM, projects, helpdesk, assets, finance,
          marketing, procurement, contracts, HRM, compliance, policy governance,
          and AI-led executive intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {blocks.map((block) => (
          <Link key={block.label} to={block.href}>
            <Card className="transition-colors hover:border-primary/40 hover:bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {block.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-3xl text-foreground">{block.value}</p>
                  <div className="rounded-md bg-primary/10 p-2">
                    <block.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
