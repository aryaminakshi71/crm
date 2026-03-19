import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input, Select } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Database,
  Table2,
  ChevronRight,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Box,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Activity,
  Puzzle,
  Bot,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/admin/database")({
  component: AdminDatabasePage,
});

// Module to schema mapping
const moduleSchemas: Record<string, {
  name: string;
  icon: any;
  tables: { name: string; rows: number; description: string }[];
}> = {
  crm: {
    name: "CRM",
    icon: Users,
    tables: [
      { name: "contacts", rows: 1247, description: "Contact management" },
      { name: "deals", rows: 892, description: "Sales pipeline" },
      { name: "leads", rows: 2341, description: "Lead tracking" },
      { name: "activities", rows: 5678, description: "Activity log" },
      { name: "files", rows: 456, description: "Attachments" },
    ],
  },
  projects: {
    name: "Projects",
    icon: Box,
    tables: [
      { name: "projects", rows: 156, description: "Project definitions" },
      { name: "tasks", rows: 3421, description: "Task management" },
      { name: "milestones", rows: 423, description: "Project milestones" },
      { name: "resources", rows: 234, description: "Resource allocation" },
    ],
  },
  invoicing: {
    name: "Invoicing",
    icon: CreditCard,
    tables: [
      { name: "invoices", rows: 8923, description: "Invoice records" },
      { name: "invoice_items", rows: 23456, description: "Line items" },
      { name: "payments", rows: 7823, description: "Payment history" },
    ],
  },
  helpdesk: {
    name: "Helpdesk",
    icon: FileText,
    tables: [
      { name: "tickets", rows: 4521, description: "Support tickets" },
      { name: "queues", rows: 45, description: "Ticket queues" },
      { name: "sla_policies", rows: 12, description: "SLA configurations" },
    ],
  },
  marketing: {
    name: "Marketing",
    icon: BarChart3,
    tables: [
      { name: "campaigns", rows: 234, description: "Marketing campaigns" },
      { name: "campaign_contacts", rows: 45678, description: "Campaign recipients" },
    ],
  },
  hrm: {
    name: "HRM",
    icon: Users,
    tables: [
      { name: "employees", rows: 567, description: "Employee records" },
      { name: "attendance", rows: 23456, description: "Attendance logs" },
      { name: "leave_requests", rows: 1234, description: "Leave management" },
      { name: "reviews", rows: 456, description: "Performance reviews" },
      { name: "payroll", rows: 6789, description: "Payroll records" },
    ],
  },
  monitoring: {
    name: "Monitoring",
    icon: Activity,
    tables: [
      { name: "monitoring_snapshots", rows: 45678, description: "Platform metrics" },
      { name: "app_catalog", rows: 89, description: "Registered applications" },
    ],
  },
  integrations: {
    name: "Integrations",
    icon: Puzzle,
    tables: [
      { name: "connectors", rows: 34, description: "Integration connectors" },
      { name: "workflows", rows: 123, description: "Automation workflows" },
      { name: "workflow_runs", rows: 45678, description: "Workflow executions" },
      { name: "workflow_events", rows: 123456, description: "Event log" },
      { name: "event_subscriptions", rows: 234, description: "Event listeners" },
    ],
  },
  agents: {
    name: "AI Agents",
    icon: Bot,
    tables: [
      { name: "agents", rows: 45, description: "Agent definitions" },
      { name: "agent_templates", rows: 23, description: "Agent templates" },
      { name: "agent_conversations", rows: 1234, description: "Chat conversations" },
      { name: "agent_messages", rows: 45678, description: "Chat messages" },
      { name: "agent_executions", rows: 2345, description: "Task executions" },
    ],
  },
  billing: {
    name: "Billing",
    icon: CreditCard,
    tables: [
      { name: "plans", rows: 4, description: "Subscription plans" },
      { name: "subscriptions", rows: 156, description: "Organization subscriptions" },
      { name: "invoices", rows: 8923, description: "Billing invoices" },
      { name: "payments", rows: 7823, description: "Payment records" },
      { name: "usage_records", rows: 45678, description: "Usage tracking" },
      { name: "billing_alerts", rows: 234, description: "Alert history" },
    ],
  },
  rbac: {
    name: "Access Control",
    icon: Settings,
    tables: [
      { name: "roles", rows: 12, description: "Role definitions" },
      { name: "permissions", rows: 89, description: "Permission list" },
      { name: "role_permissions", rows: 456, description: "Role-permission mapping" },
      { name: "user_roles", rows: 1234, description: "User role assignments" },
      { name: "departments", rows: 23, description: "Organization units" },
      { name: "teams", rows: 67, description: "Team definitions" },
    ],
  },
};

function AdminDatabasePage() {
  const [selectedModule, setSelectedModule] = useState<string>("crm");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [view, setView] = useState<"modules" | "tables" | "data" | "schema">("modules");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const currentModule = moduleSchemas[selectedModule];

  // Mock data for table view
  const mockTableData = [
    { id: "1", name: "John Doe", email: "john@example.com", company: "Acme Corp", status: "active", createdAt: "2026-01-15" },
    { id: "2", name: "Jane Smith", email: "jane@techstart.io", company: "TechStart", status: "active", createdAt: "2026-01-18" },
    { id: "3", name: "Bob Wilson", email: "bob@global.co", company: "Global Solutions", status: "inactive", createdAt: "2026-01-20" },
    { id: "4", name: "Alice Brown", email: "alice@startup.io", company: "Startup Labs", status: "active", createdAt: "2026-01-22" },
    { id: "5", name: "Charlie Davis", email: "charlie@enterprise.com", company: "Enterprise Co", status: "active", createdAt: "2026-01-25" },
  ];

  const tableColumns = ["id", "name", "email", "company", "status", "createdAt"];

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
            View and manage all module data across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
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
          placeholder="Search modules, tables, or data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Module Grid View */}
      {view === "modules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(moduleSchemas).map(([key, module]) => {
            const Icon = module.icon;
            const totalRows = module.tables.reduce((sum, t) => sum + t.rows, 0);
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
                      <div key={table.name} className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Table2 className="h-3 w-3" />
                          {table.name}
                        </span>
                        <span>{table.rows.toLocaleString()}</span>
                      </div>
                    ))}
                    {module.tables.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{module.tables.length - 3} more tables</p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Total: <span className="font-medium text-foreground">{totalRows.toLocaleString()}</span> rows
                    </span>
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
                  {currentModule.name} - Tables
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
                    <TableHead>Rows</TableHead>
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
                      <TableCell className="text-muted-foreground">{table.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{table.rows.toLocaleString()}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTable(table.name);
                              setView("data");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Layers className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-primary">
                  {Object.values(moduleSchemas).reduce((sum, m) => sum + m.tables.reduce((s, t) => s + t.rows, 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-green-600">
                  {Object.values(moduleSchemas).reduce((sum, m) => sum + m.tables.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Tables</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-blue-600">
                  {Object.keys(moduleSchemas).length}
                </p>
                <p className="text-sm text-muted-foreground">Modules</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-amber-600">156</p>
                <p className="text-sm text-muted-foreground">Orgs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Table Data View */}
      {view === "data" && selectedTable && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-mono">{selectedTable}</CardTitle>
                <p className="text-sm text-muted-foreground">5,000 rows</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableColumns.map((col) => (
                        <TableHead
                          key={col}
                          className="cursor-pointer hover:text-primary"
                          onClick={() => {
                            if (sortBy === col) {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy(col);
                              setSortOrder("asc");
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {col}
                            {sortBy === col && (
                              <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTableData.map((row) => (
                      <TableRow key={row.id}>
                        {tableColumns.map((col) => (
                          <TableCell key={col}>
                            {col === "status" ? (
                              <Badge
                                className={
                                  row.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {row.status}
                              </Badge>
                            ) : (
                              row[col as keyof typeof row]
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing 1-5 of 5,000 rows
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schema View */}
          <Card>
            <CardHeader>
              <CardTitle>Table Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tableColumns.map((col, i) => (
                  <div key={col} className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium">{col}</span>
                      <Badge variant="outline" className="text-xs">
                        {col === "id" ? "uuid" : col === "createdAt" ? "timestamp" : "varchar"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {col === "id" ? "Primary key" : "Indexed"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visual Schema Map */}
      <Card>
        <CardHeader>
          <CardTitle>Database Schema Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(moduleSchemas).slice(0, 6).map(([key, module]) => {
              const Icon = module.icon;
              return (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-bold">{module.name}</span>
                  </div>
                  <div className="space-y-2">
                    {module.tables.map((table) => (
                      <div
                        key={table.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-mono">{table.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({table.rows.toLocaleString()})
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
