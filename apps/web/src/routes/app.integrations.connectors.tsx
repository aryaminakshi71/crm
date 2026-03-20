/**
 * Connector Registry
 *
 * Browse, search, and manage all integration connectors.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Puzzle,
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Settings,
  ExternalLink,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/connectors")({
  component: ConnectorsPage,
});

function ConnectorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState("all");

  const connectors = [
    {
      id: "salesforce",
      name: "Salesforce",
      category: "CRM",
      description: "Sync leads, contacts, and opportunities with Salesforce CRM.",
      status: "connected",
      lastSync: "5 min ago",
      events: 4521,
      icon: "SF",
      color: "#00a1e0",
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "Payments",
      description: "Process payments and manage subscriptions with Stripe.",
      status: "connected",
      lastSync: "2 min ago",
      events: 3892,
      icon: "St",
      color: "#635bff",
    },
    {
      id: "shopify",
      name: "Shopify",
      category: "E-commerce",
      description: "Manage products, orders, and customers from your Shopify store.",
      status: "connected",
      lastSync: "1 min ago",
      events: 2156,
      icon: "Sh",
      color: "#96bf48",
    },
    {
      id: "slack",
      name: "Slack",
      category: "Communication",
      description: "Send notifications and messages to Slack channels.",
      status: "connected",
      lastSync: "12 min ago",
      events: 1874,
      icon: "Sl",
      color: "#4a154b",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      category: "Marketing",
      description: "Automate marketing workflows with HubSpot CRM.",
      status: "connected",
      lastSync: "30 min ago",
      events: 1203,
      icon: "HS",
      color: "#ff7a59",
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      category: "Finance",
      description: "Sync invoices, payments, and financial data with QuickBooks.",
      status: "connected",
      lastSync: "1 hour ago",
      events: 892,
      icon: "QB",
      color: "#2ca01c",
    },
    {
      id: "jira",
      name: "Jira",
      category: "Project Management",
      description: "Create and update Jira issues from your workflows.",
      status: "disconnected",
      lastSync: "Never",
      events: 0,
      icon: "Ji",
      color: "#0052cc",
    },
    {
      id: "github",
      name: "GitHub",
      category: "Development",
      description: "Automate GitHub issues, PRs, and releases.",
      status: "connected",
      lastSync: "5 min ago",
      events: 743,
      icon: "GH",
      color: "#24292e",
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      category: "Marketing",
      description: "Sync contacts and send marketing emails via Mailchimp.",
      status: "error",
      lastSync: "Failed",
      events: 156,
      icon: "MC",
      color: "#ffe01b",
    },
    {
      id: "twilio",
      name: "Twilio",
      category: "Communication",
      description: "Send SMS and voice notifications via Twilio.",
      status: "connected",
      lastSync: "3 min ago",
      events: 521,
      icon: "Tw",
      color: "#f22f46",
    },
    {
      id: "zendesk",
      name: "Zendesk",
      category: "Support",
      description: "Create tickets and sync customer support data.",
      status: "connected",
      lastSync: "10 min ago",
      events: 432,
      icon: "Zd",
      color: "#03363d",
    },
    {
      id: "postgres",
      name: "PostgreSQL",
      category: "Database",
      description: "Connect to PostgreSQL databases for data sync.",
      status: "connected",
      lastSync: "Real-time",
      events: 2341,
      icon: "PG",
      color: "#336791",
    },
  ];

  const categories = ["all", "CRM", "Payments", "E-commerce", "Communication", "Marketing", "Finance", "Support", "Development", "Database", "Project Management"];

  const filteredConnectors = connectors.filter((connector) => {
    const matchesSearch = connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connector.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || connector.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="success" size="sm">Connected</Badge>;
      case "disconnected":
        return <Badge variant="default" size="sm">Disconnected</Badge>;
      case "error":
        return <Badge variant="danger" size="sm">Error</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Connector Registry</h2>
          <p className="text-sm text-muted-foreground">
            {filteredConnectors.length} connectors available
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
            Sync All
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add Connector
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={`p-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Connectors Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredConnectors.map((connector) => (
            <Card key={connector.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: connector.color }}
                  >
                    {connector.icon}
                  </div>
                  {getStatusBadge(connector.status)}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{connector.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{connector.category}</p>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {connector.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{connector.events.toLocaleString()} events</span>
                  <span>Sync: {connector.lastSync}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/app/integrations/connectors/$id"
                    params={{ id: connector.id }}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Settings className="h-3 w-3" />}>
                      Configure
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConnectors.map((connector) => (
            <Card key={connector.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: connector.color }}
                  >
                    {connector.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{connector.name}</h3>
                      {getStatusBadge(connector.status)}
                      <span className="text-xs text-muted-foreground">{connector.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{connector.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-foreground">{connector.events.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">events</p>
                  </div>
                  <div className="text-right text-sm min-w-[100px]">
                    <p className="text-muted-foreground">{connector.lastSync}</p>
                    <p className="text-xs text-muted-foreground">last sync</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/app/integrations/connectors/$id" params={{ id: connector.id }}>
                      <Button variant="outline" size="sm" leftIcon={<Settings className="h-3 w-3" />}>
                        Configure
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredConnectors.length === 0 && (
        <div className="text-center py-12">
          <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No connectors found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
            Add Custom Connector
          </Button>
        </div>
      )}
    </div>
  );
}
