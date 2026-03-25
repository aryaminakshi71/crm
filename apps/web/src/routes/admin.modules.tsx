import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Layers,
  CreditCard,
  Activity,
  BarChart3,
  Puzzle,
  Bot,
  Settings,
  FileText,
  Box,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/modules")({
  component: AdminModulesPage,
});

const moduleDetails: Record<string, {
  name: string;
  icon: any;
  description: string;
  category: "core" | "ops" | "growth" | "ai";
  adoption: number;
  revenue: number;
  plans: string[];
}> = {
  crm: {
    name: "CRM",
    icon: Users,
    description: "Contacts, deals, leads, and activity tracking",
    category: "core",
    adoption: 100,
    revenue: 156000,
    plans: ["starter", "growth", "business", "enterprise"],
  },
  notifications: {
    name: "Notifications",
    icon: Activity,
    description: "Email and in-app notifications",
    category: "core",
    adoption: 100,
    revenue: 0,
    plans: ["starter", "growth", "business", "enterprise"],
  },
  rbac: {
    name: "Access Control",
    icon: Settings,
    description: "Roles, permissions, and team management",
    category: "core",
    adoption: 100,
    revenue: 0,
    plans: ["starter", "growth", "business", "enterprise"],
  },
  projects: {
    name: "Projects",
    icon: Box,
    description: "Project management with tasks, milestones, resources",
    category: "ops",
    adoption: 78,
    revenue: 46800,
    plans: ["growth", "business", "enterprise"],
  },
  invoicing: {
    name: "Invoicing",
    icon: CreditCard,
    description: "Invoice generation and payment tracking",
    category: "ops",
    adoption: 85,
    revenue: 51000,
    plans: ["growth", "business", "enterprise"],
  },
  helpdesk: {
    name: "Helpdesk",
    icon: FileText,
    description: "Support tickets, queues, and SLAs",
    category: "ops",
    adoption: 62,
    revenue: 37200,
    plans: ["growth", "business", "enterprise"],
  },
  integrations: {
    name: "Integrations",
    icon: Puzzle,
    description: "Workflow automation and webhooks",
    category: "growth",
    adoption: 67,
    revenue: 40200,
    plans: ["growth", "business", "enterprise"],
  },
  marketing: {
    name: "Marketing",
    icon: BarChart3,
    description: "Campaign management and analytics",
    category: "growth",
    adoption: 34,
    revenue: 20400,
    plans: ["business", "enterprise"],
  },
  hrm: {
    name: "HRM",
    icon: Users,
    description: "Employee management and payroll",
    category: "ops",
    adoption: 45,
    revenue: 27000,
    plans: ["business", "enterprise"],
  },
  monitoring: {
    name: "Monitoring",
    icon: Activity,
    description: "Platform observability and alerts",
    category: "ops",
    adoption: 52,
    revenue: 31200,
    plans: ["business", "enterprise"],
  },
  agents: {
    name: "AI",
    icon: Bot,
    description: "AI agents and business intelligence",
    category: "ai",
    adoption: 23,
    revenue: 18400,
    plans: ["enterprise"],
  },
  advertising: {
    name: "Advertising",
    icon: BarChart3,
    description: "Ad campaign management",
    category: "growth",
    adoption: 18,
    revenue: 10800,
    plans: ["business", "enterprise"],
  },
};

const plans = [
  { key: "starter", name: "Starter", price: 15, users: 5 },
  { key: "growth", name: "Growth", price: 29, users: 25 },
  { key: "business", name: "Business", price: 49, users: 100 },
  { key: "enterprise", name: "Enterprise", price: 0, users: -1 },
];

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
