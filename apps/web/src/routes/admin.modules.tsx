import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CreditCard,
  Activity,
  BarChart3,
  Bot,
  FileText,
  Box,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Truck,
  LayoutGrid,
  Globe,
} from "lucide-react";
import { NUCLEO_MODULES, getModuleIcon, MODULE_PLANS, PLAN_TIERS } from "@/lib/modules";

export const Route = createFileRoute("/admin/modules")({
  component: AdminModulesPage,
});

// Build admin module display data from shared NUCLEO_MODULES
// Admin view uses growth plan (not in public pricing) so we include it here

const PLAN_KEYS = ["starter", "business", "enterprise"] as const;

const PHASE_LABELS: Record<string, string> = {
  core: "Core",
  ops: "Operations",
  growth: "Growth",
  ai: "AI & Intelligence",
};

// Extended module details for admin view (with adoption/revenue data)
// Derived from NUCLEO_MODULES — only the 16 canonical public product modules
const moduleDetails: Record<string, {
  name: string;
  icon: any;
  description: string;
  category: "core" | "ops" | "growth" | "ai";
  adoption: number;
  revenue: number;
  plans: string[];
}> = {
  crm:            { name: "CRM",              icon: Users,         description: "Contacts, deals, leads, pipeline, and activity tracking",    category: "core",   adoption: 100, revenue: 156000, plans: MODULE_PLANS.crm },
  projects:       { name: "Projects",          icon: Box,           description: "Project planning, task tracking, kanban, and gantt",           category: "ops",    adoption: 78,  revenue: 46800,  plans: MODULE_PLANS.projects },
  helpdesk:       { name: "Helpdesk",          icon: FileText,      description: "Ticketing, knowledge base, SLA workflows, and support",         category: "ops",    adoption: 62,  revenue: 37200,  plans: MODULE_PLANS.helpdesk },
  hrm:            { name: "HRM",               icon: Users,          description: "Employee directory, leave, recruitment, training, and payroll",  category: "ops",    adoption: 45,  revenue: 27000,  plans: MODULE_PLANS.hrm },
  inventory:      { name: "Inventory",          icon: LayoutGrid,    description: "Product catalog, stock management, warehouses, and transfers",  category: "ops",    adoption: 40,  revenue: 24000,  plans: MODULE_PLANS.inventory },
  monitoring:     { name: "Monitoring",         icon: Activity,      description: "Error tracking, uptime checks, performance, and logs",        category: "ops",    adoption: 52,  revenue: 31200,  plans: MODULE_PLANS.monitoring },
  communications: { name: "Communications",    icon: MessageSquare,  description: "Omnichannel messaging — SMS, voice, video, and chat",           category: "ops",    adoption: 30,  revenue: 18000,  plans: MODULE_PLANS.communications },
  field_service:  { name: "Field Service",    icon: Truck,         description: "Smart dispatch, route optimization, and job scheduling",          category: "ops",    adoption: 25,  revenue: 15000,  plans: MODULE_PLANS.field_service },
  devops:         { name: "DevOps",            icon: Globe,         description: "CI/CD pipelines, automated deployments, and infrastructure",     category: "ops",    adoption: 22,  revenue: 13200,  plans: MODULE_PLANS.devops },
  finance:        { name: "Finance",            icon: CreditCard,    description: "Expenses, budget tracking, financial reporting, and cost control",category: "ops",    adoption: 55,  revenue: 33000,  plans: MODULE_PLANS.finance },
  invoicing:      { name: "Invoicing",         icon: CreditCard,    description: "Professional invoices, payment tracking, and billing",          category: "growth", adoption: 85,  revenue: 51000,  plans: MODULE_PLANS.invoicing },
  marketing:      { name: "Marketing",          icon: BarChart3,     description: "Campaign builder, email automation, landing pages, lead scoring", category: "growth", adoption: 34,  revenue: 20400,  plans: MODULE_PLANS.marketing },
  advertising:    { name: "Advertising",        icon: BarChart3,     description: "Ad campaigns across Google, Meta, and LinkedIn with AI",         category: "growth", adoption: 18,  revenue: 10800,  plans: MODULE_PLANS.advertising },
  social:         { name: "Social Media",      icon: BarChart3,     description: "Post scheduling, analytics, social listening, and inbox",       category: "growth", adoption: 20,  revenue: 12000,  plans: MODULE_PLANS.social },
  campaign_pro:   { name: "Campaign Pro",     icon: BarChart3,     description: "Advanced campaign planning, A/B testing, and multi-channel",    category: "growth", adoption: 15,  revenue: 9000,   plans: MODULE_PLANS.campaign_pro },
  agents:         { name: "AI Agents",         icon: Bot,           description: "Autonomous AI agents for automation, support, and BI",            category: "ai",    adoption: 23,  revenue: 18400,  plans: MODULE_PLANS.agents },
  speech:         { name: "Speech & Voice",    icon: Bot,           description: "Audio transcription, real-time streaming, and meeting notes",    category: "ai",    adoption: 12,  revenue: 7200,   plans: MODULE_PLANS.speech },
};

const plans = PLAN_KEYS.map((key) => {
  const tier = PLAN_TIERS.find((t) => t.key === key);
  return {
    key,
    name: tier?.name ?? key,
    price: tier?.monthlyPrice ?? 0,
    users: tier?.maxUsers ?? 0,
  };
});

function AdminModulesPage() {
  const { data: session, isPending } = useSession();

  const { data: modulesApiData } = useQuery({
    queryKey: ["admin", "modules"],
    queryFn: async () => {
      const res = await fetch("/api/modules", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session?.user,
  });

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

  // Merge real enabled status from API into static moduleDetails display data
  const apiModules: any[] = (modulesApiData as any)?.modules ?? [];
  const mergedModuleDetails = Object.fromEntries(
    Object.entries(moduleDetails).map(([key, detail]) => {
      const apiModule = apiModules.find((m: any) => m.key === key);
      return [
        key,
        {
          ...detail,
          enabled: apiModule !== undefined ? apiModule.enabled : true,
        },
      ];
    })
  );

  const categories = [
    { key: "core", name: "Core Modules", description: "Always available" },
    { key: "ops", name: "Operations", description: "Day-to-day business ops" },
    { key: "growth", name: "Growth", description: "Scale your business" },
    { key: "ai", name: "AI & Intelligence", description: "AI-powered features" },
  ];

  const totalRevenue = Object.values(mergedModuleDetails).reduce((sum, m) => sum + m.revenue, 0);
  const avgAdoption = Math.round(
    Object.values(mergedModuleDetails).reduce((sum, m) => sum + m.adoption, 0) / Object.values(mergedModuleDetails).length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Module Management</h1>
          <p className="text-muted-foreground text-sm">
            Track module usage, adoption, and revenue across all organizations
          </p>
        </div>
        <Button variant="primary" size="sm">
          Configure Modules
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Modules</p>
            <p className="text-3xl font-black text-primary">{Object.keys(mergedModuleDetails).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Avg Adoption</p>
            <p className="text-3xl font-black text-green-600">{avgAdoption}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Module Revenue</p>
            <p className="text-3xl font-black text-amber-600">${(totalRevenue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Top Module</p>
            <p className="text-lg font-bold">CRM</p>
          </CardContent>
        </Card>
      </div>

      {/* Modules by Category */}
      {categories.map((category) => {
        const categoryModules = Object.entries(mergedModuleDetails).filter(
          ([_, m]) => m.category === category.key
        );

        return (
          <Card key={category.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{category.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Badge variant="outline">{categoryModules.length} modules</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryModules.map(([key, mod]) => {
                  const Icon = mod.icon;
                  return (
                    <div key={key} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-bold">{mod.name}</span>
                        </div>
                        {mod.adoption > 50 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : mod.adoption > 25 ? (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{mod.description}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Adoption</span>
                          <span className="font-medium">{mod.adoption}%</span>
                        </div>
                        <Progress value={mod.adoption} className="h-2" />
                      </div>

                      <div className="mt-3 pt-3 border-t flex justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="font-bold text-green-600">
                            {mod.revenue > 0 ? `$${(mod.revenue / 1000).toFixed(0)}K/mo` : "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Plans</p>
                          <div className="flex gap-1">
                            {mod.plans.map((plan) => (
                              <Badge key={plan} variant="outline" className="text-xs capitalize">
                                {plan}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Plan vs Module Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Plan-Module Matrix</CardTitle>
          <p className="text-sm text-muted-foreground">
            Which modules are included in which plans
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Module</th>
                  {plans.map((plan) => (
                    <th key={plan.key} className="text-center p-2 font-medium capitalize">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(mergedModuleDetails).map(([key, mod]) => (
                  <tr key={key} className="border-b hover:bg-secondary/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = mod.icon;
                          return <Icon className="h-4 w-4 text-muted-foreground" />;
                        })()}
                        <span className="font-medium">{mod.name}</span>
                      </div>
                    </td>
                    {plans.map((plan) => {
                      const isIncluded = mod.plans.includes(plan.key);
                      return (
                        <td key={plan.key} className="text-center p-2">
                          {isIncluded ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.key} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg capitalize">{plan.name}</h3>
                <p className="text-2xl font-black mt-2">
                  {plan.price > 0 ? `$${plan.price}` : "Custom"}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/user/mo</span>}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.users > 0 ? `Up to ${plan.users} users` : "Unlimited users"}
                </p>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                  {Object.entries(mergedModuleDetails)
                    .filter(([_, m]) => m.plans.includes(plan.key))
                    .map(([key, m]) => {
                      const Icon = m.icon;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <Icon className="h-3 w-3 text-green-600" />
                          {m.name}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
