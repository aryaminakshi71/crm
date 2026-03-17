import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Brain,
  Briefcase,
  Command,
  FileText,
  FolderKanban,
  Globe,
  LayoutGrid,
  Megaphone,
  Receipt,
  Scale,
  ShieldCheck,
  Ticket,
  TrendingUp,
  UserRoundCog,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
    {
      label: "CRM",
      value: summary.customers || 0,
      icon: Users,
      href: "/app/crm",
    },
    {
      label: "Projects",
      value: summary.projects || 0,
      icon: FolderKanban,
      href: "/app/projects",
    },
    {
      label: "Helpdesk",
      value: summary.tickets || 0,
      icon: Ticket,
      href: "/app/helpdesk",
    },
    {
      label: "Assets + Docs",
      value: (summary.assets || 0) + (summary.documents || 0),
      icon: FileText,
      href: "/app/assets",
    },
    {
      label: "Finance",
      value: summary.invoices || 0,
      icon: Receipt,
      href: "/app/finance",
    },
    {
      label: "Marketing",
      value: summary.campaigns || 0,
      icon: Megaphone,
      href: "/app/marketing",
    },
    {
      label: "Procurement",
      value: ops.purchaseRequests || 0,
      icon: Briefcase,
      href: "/app/procurement",
    },
    {
      label: "Contracts",
      value: ops.contracts || 0,
      icon: Scale,
      href: "/app/contracts",
    },
    {
      label: "HRM",
      value: summary.hrmEmployees || 0,
      icon: UserRoundCog,
      href: "/app/hrm",
    },
    {
      label: "Compliance",
      value: summary.enterpriseRoles || 0,
      icon: ShieldCheck,
      href: "/app/compliance",
    },
    {
      label: "Policies + DR",
      value: (ops.retentionPolicies || 0) + (ops.drDrills || 0),
      icon: ShieldCheck,
      href: "/app/policies",
    },
    {
      label: "AI + BI",
      value: summary.intelligenceKpis || 0,
      icon: Brain,
      href: "/app/intelligence",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">
          Unified Workspace
        </h1>
        <p className="text-muted-foreground">
          Enterprise operations across CRM, projects, helpdesk, assets, finance,
          marketing, procurement, contracts, HRM, compliance, policy governance,
          and AI-led executive intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Unified Objects"
          value={blocks.reduce((acc, b) => acc + b.value, 0)}
          icon={<LayoutGrid className="h-4 w-4" />}
          trend="Across all domains"
          color="text-primary"
        />
        <Metric
          title="Global Health"
          value="98%"
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="Nominal status"
          color="text-emerald-400"
        />
        <Metric
          title="Agent Activity"
          value="2.4k"
          icon={<Brain className="h-4 w-4" />}
          trend="+12% daily"
          color="text-violet-400"
        />
        <Metric
          title="Cmd Response"
          value="45ms"
          icon={<Zap className="h-4 w-4" />}
          trend="Ultra low latency"
          color="text-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Domain Synergy
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Operational Pulse
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "Jan", ops: 1200, growth: 1000 },
                    { month: "Feb", ops: 1800, growth: 1500 },
                    { month: "Mar", ops: 2400, growth: 2000 },
                    { month: "Apr", ops: 3800, growth: 3000 },
                    { month: "May", ops: 4500, growth: 3500 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ops"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorOps)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="growth"
                    stroke="#818cf8"
                    fillOpacity={0}
                    strokeWidth={1}
                    strokeDasharray="10 10"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Global Presence
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                Unified workspace is syncing across **3 regions**. Resilience
                score is **99.9%**.
              </p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                Enterprise Domains
              </p>
              <div className="grid grid-cols-2 gap-2">
                {blocks.slice(0, 4).map((block, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/40 p-2 text-center"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {block.label}
                    </p>
                    <p className="text-lg font-black text-foreground">
                      {block.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {blocks.map((block) => (
          <Link key={block.label} to={block.href}>
            <Card className="group transition-all hover:border-primary/40 hover:bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                      {block.label}
                    </p>
                    <p className="font-black text-3xl text-foreground mt-1">
                      {block.value}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3 group-hover:bg-primary/10 transition-colors">
                    <block.icon className="h-6 w-6 text-primary" />
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
function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Command className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
