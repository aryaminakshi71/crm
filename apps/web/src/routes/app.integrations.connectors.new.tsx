/**
 * Add New Connector
 *
 * Step-by-step wizard to add a new connector.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/connectors/new")({
  component: AddConnectorPage,
});

function AddConnectorPage() {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  const availableConnectors = [
    { id: "salesforce", name: "Salesforce", category: "CRM", description: "Sync leads, contacts, and opportunities", icon: "SF", color: "#00a1e0" },
    { id: "stripe", name: "Stripe", category: "Payments", description: "Process payments and manage subscriptions", icon: "St", color: "#635bff" },
    { id: "shopify", name: "Shopify", category: "E-commerce", description: "Manage products, orders, and customers", icon: "Sh", color: "#96bf48" },
    { id: "hubspot", name: "HubSpot", category: "Marketing", description: "Automate marketing workflows", icon: "HS", color: "#ff7a59" },
    { id: "quickbooks", name: "QuickBooks", category: "Finance", description: "Sync invoices and financial data", icon: "QB", color: "#2ca01c" },
    { id: "jira", name: "Jira", category: "Project Management", description: "Create and update Jira issues", icon: "Ji", color: "#0052cc" },
    { id: "github", name: "GitHub", category: "Development", description: "Automate GitHub issues and PRs", icon: "GH", color: "#24292e" },
    { id: "mailchimp", name: "Mailchimp", category: "Marketing", description: "Send marketing emails", icon: "MC", color: "#ffe01b" },
  ];

  const filteredConnectors = availableConnectors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const steps = [
    { num: 1, title: "Select Connector" },
    { num: 2, title: "Configure" },
    { num: 3, title: "Authenticate" },
    { num: 4, title: "Review" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/integrations/connectors">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add New Connector</h1>
          <p className="text-sm text-muted-foreground">Connect your third-party services</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-4">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  step >= s.num ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    step > s.num ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto">
        {step === 1 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Select a Connector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search connectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredConnectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => setSelectedConnector(connector.id)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      selectedConnector === connector.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: connector.color }}
                      >
                        {connector.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{connector.name}</p>
                        <p className="text-xs text-muted-foreground">{connector.category}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {connector.description}
                        </p>
                      </div>
                      {selectedConnector === connector.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Can't find your service?
                </p>
                <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />}>
                  Request a Connector
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Configure Connector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Connector Name
                </label>
                <Input placeholder="My Salesforce Instance" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Instance URL
                </label>
                <Input placeholder="https://your-instance.salesforce.com" />
                <p className="text-xs text-muted-foreground mt-1">
                  Find this in your Salesforce Setup menu
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  API Version
                </label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option>v59.0 (Winter '24)</option>
                  <option>v58.0 (Fall '23)</option>
                  <option>v57.0 (Summer '23)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Sync Settings
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Enable real-time sync</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Sync deleted records</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Authenticate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-[#00a1e0] flex items-center justify-center text-white font-bold text-xs">
                    SF
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Salesforce OAuth 2.0</p>
                    <p className="text-xs text-muted-foreground">Connected App authentication</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  You'll be redirected to Salesforce to authorize access. Make sure you're logged in
                  as an administrator.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Read/Write access to Contacts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Read/Write access to Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Read/Write access to Opportunities</span>
                  </div>
                </div>
              </div>
              <Button className="w-full" leftIcon={<ExternalLink className="h-4 w-4" />}>
                Connect with Salesforce
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By connecting, you agree to our{" "}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Review & Connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded bg-[#00a1e0] flex items-center justify-center text-white font-bold">
                    SF
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Salesforce</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                  <Badge variant="success" size="sm" className="ml-auto">Ready</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Instance URL</p>
                    <p className="text-sm font-medium">https://acme.salesforce.com</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">API Version</p>
                    <p className="text-sm font-medium">v59.0</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sync Mode</p>
                    <p className="text-sm font-medium">Real-time</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Permissions</p>
                    <p className="text-sm font-medium">Full Read/Write</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Connection Successful!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your Salesforce connector is ready to use. You can now create workflows.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedConnector}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          ) : (
            <Link to="/app/integrations/connectors">
              <Button>Go to Connectors</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
