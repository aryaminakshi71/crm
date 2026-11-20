import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  Activity,
  BarChart3,
  Bot,
  Box,
  ChevronRight,
  CreditCard,
  Database,
  Download,
  FileText,
  Layers,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  Table2,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/admin/database")({
  component: AdminDatabasePage,
});

// Module to schema mapping (static catalog — row counts are illustrative)
const moduleSchemas: Record<
  string,
  {
    name: string;
    icon: any;
    tables: { name: string; rows: number; description: string }[];
  }
> = {
  crm: {
    name: "CRM",
    icon: Users,
    tables: [
      { name: "contacts", rows: 0, description: "Contact management" },
      { name: "deals", rows: 0, description: "Sales pipeline" },
      { name: "leads", rows: 0, description: "Lead tracking" },
      { name: "activities", rows: 0, description: "Activity log" },
      { name: "files", rows: 0, description: "Attachments" },
    ],
  },
  projects: {
    name: "Projects",
    icon: Box,
    tables: [
      { name: "projects", rows: 0, description: "Project definitions" },
      { name: "tasks", rows: 0, description: "Task management" },
      { name: "milestones", rows: 0, description: "Project milestones" },
      { name: "resources", rows: 0, description: "Resource allocation" },
    ],
  },
  invoicing: {
    name: "Invoicing",
    icon: CreditCard,
    tables: [
      { name: "invoices", rows: 0, description: "Invoice records" },
      { name: "invoice_items", rows: 0, description: "Line items" },
      { name: "payments", rows: 0, description: "Payment history" },
    ],
  },
  helpdesk: {
    name: "Helpdesk",
    icon: FileText,
    tables: [
      { name: "tickets", rows: 0, description: "Support tickets" },
      { name: "queues", rows: 0, description: "Ticket queues" },
      { name: "sla_policies", rows: 0, description: "SLA configurations" },
    ],
  },
  marketing: {
    name: "Marketing",
    icon: BarChart3,
    tables: [
      { name: "campaigns", rows: 0, description: "Marketing campaigns" },
      { name: "campaign_contacts", rows: 0, description: "Campaign recipients" },
    ],
  },
  hrm: {
    name: "HRM",
    icon: Users,
    tables: [
      { name: "employees", rows: 0, description: "Employee records" },
      { name: "attendance", rows: 0, description: "Attendance logs" },
      { name: "leave_requests", rows: 0, description: "Leave management" },
      { name: "reviews", rows: 0, description: "Performance reviews" },
      { name: "payroll", rows: 0, description: "Payroll records" },
    ],
  },
  monitoring: {
    name: "Monitoring",
    icon: Activity,
    tables: [
      { name: "monitoring_snapshots", rows: 0, description: "Platform metrics" },
      { name: "app_catalog", rows: 0, description: "Registered applications" },
    ],
  },
  integrations: {
    name: "Integrations",
    icon: Puzzle,
    tables: [
      { name: "connectors", rows: 0, description: "Integration connectors" },
      { name: "workflows", rows: 0, description: "Automation workflows" },
      { name: "workflow_runs", rows: 0, description: "Workflow executions" },
      { name: "workflow_events", rows: 0, description: "Event log" },
      { name: "event_subscriptions", rows: 0, description: "Event listeners" },
    ],
  },
  agents: {
    name: "AI",
    icon: Bot,
    tables: [
      { name: "agents", rows: 0, description: "Agent definitions" },
      { name: "agent_templates", rows: 0, description: "Agent templates" },
      { name: "agent_conversations", rows: 0, description: "Chat conversations" },
      { name: "agent_messages", rows: 0, description: "Chat messages" },
      { name: "agent_executions", rows: 0, description: "Task executions" },
    ],
  },
  billing: {
    name: "Billing",
    icon: CreditCard,
    tables: [
      { name: "plans", rows: 0, description: "Subscription plans" },
      { name: "subscriptions", rows: 0, description: "Organization subscriptions" },
      { name: "invoices", rows: 0, description: "Billing invoices" },
      { name: "payments", rows: 0, description: "Payment records" },
      { name: "usage_records", rows: 0, description: "Usage tracking" },
      { name: "billing_alerts", rows: 0, description: "Alert history" },
    ],
  },
  rbac: {
    name: "Access Control",
    icon: Settings,
    tables: [
      { name: "roles", rows: 0, description: "Role definitions" },
      { name: "permissions", rows: 0, description: "Permission list" },
      { name: "role_permissions", rows: 0, description: "Role-permission mapping" },
      { name: "user_roles", rows: 0, description: "User role assignments" },
      { name: "departments", rows: 0, description: "Organization units" },
      { name: "teams", rows: 0, description: "Team definitions" },
    ],
  },
};

function AdminDatabasePage() {
  const { data: session, isPending } = useSession();
  const [selectedModule, setSelectedModule] = useState<string>("crm");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [view, setView] = useState<"modules" | "tables" | "data" | "schema">("modules");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch real DB connection status from health endpoint
  const healthQuery = useQuery({
    queryKey: ["db-health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Health check failed");
      return res.json() as Promise<{
        status: string;
        services: {
          database: { status: string; responseTime?: number; error?: string };
        };
        timestamp: string;
      }>;
    },
    refetchInterval: 30_000,
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

  const currentModule = moduleSchemas[selectedModule];

  const dbStatus = healthQuery.data?.services?.database;
  const dbStatusColor =
    dbStatus?.status === "healthy"
      ? "bg-green-100 text-green-800"
      : dbStatus?.status === "unhealthy"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground flex items-center gap-2">
            <Database className="h-7 w-7" />
            Database Management
          </h1>
          <p className="text-muted-foreground text-sm">
            View module schema catalog and database connection status
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Live DB connection status */}
          {healthQuery.isLoading ? (
            <Badge className="bg-gray-100 text-gray-600">Checking DB...</Badge>
          ) : healthQuery.isError ? (
            <Badge className="bg-red-100 text-red-800">DB unreachable</Badge>
          ) : (
            <Badge className={dbStatusColor}>
              DB: {dbStatus?.status ?? "unknown"}
              {dbStatus?.responseTime != null && ` (${dbStatus.responseTime}ms)`}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => healthQuery.refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Breadcrumb / Navigation */}
      {view !== "modules" && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => setView("modules")}>
            Modules
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={() => setView("tables")}>
            {currentModule?.name}
          </Button>
          {selectedTable && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{selectedTable}</span>
            </>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search modules or tables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Module Grid View */}
      {view === "modules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(moduleSchemas)
            .filter(
              ([key, module]) =>
                !searchTerm ||
                module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                key.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map(([key, module]) => {
              const Icon = module.icon;
              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setSelectedModule(key);
                    setView("tables");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="font-bold">{module.name}</span>
                      </div>
                      <Badge variant="secondary">{module.tables.length} tables</Badge>
                    </div>
                    <div className="space-y-1">
                      {module.tables.slice(0, 3).map((table) => (
                        <div
                          key={table.name}
                          className="flex justify-between text-xs text-muted-foreground"
                        >
                          <span className="flex items-center gap-1">
                            <Table2 className="h-3 w-3" />
                            {table.name}
                          </span>
                        </div>
                      ))}
                      {module.tables.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{module.tables.length - 3} more tables
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Tables List View */}
      {view === "tables" && currentModule && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = currentModule.icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {currentModule.name} — Tables
                </CardTitle>
                <Badge>{currentModule.tables.length} tables</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentModule.tables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Table2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium font-mono">{table.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {table.description}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTable(table.name);
                            setView("data");
                          }}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-green-600">
                  {currentModule.tables.length}
                </p>
                <p className="text-sm text-muted-foreground">Tables in Module</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-blue-600">
                  {Object.keys(moduleSchemas).length}
                </p>
                <p className="text-sm text-muted-foreground">Total Modules</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-primary">
                  {Object.values(moduleSchemas).reduce(
                    (sum, m) => sum + m.tables.length,
                    0,
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Total Tables</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Table Data View — direct DB access not available from browser */}
      {view === "data" && selectedTable && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">{selectedTable}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Table schema reference
              </p>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Database className="h-10 w-10 text-muted-foreground" />}
                title="Direct table browsing requires DB access"
                description="Row-level data browsing is not available from the browser. Use a database client or the API to query this table directly."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Schema Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Database Schema Overview</CardTitle>
            {healthQuery.data && (
              <div className="text-xs text-muted-foreground">
                Last checked: {new Date(healthQuery.data.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(moduleSchemas)
              .slice(0, 6)
              .map(([key, module]) => {
                const Icon = module.icon;
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-bold">{module.name}</span>
                    </div>
                    <div className="space-y-2">
                      {module.tables.map((table) => (
                        <div key={table.name} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-mono">{table.name}</span>
                          <span className="text-muted-foreground text-xs">
                            — {table.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
