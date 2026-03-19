import { Button, Card, CardContent } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Database,
  Puzzle,
  Settings,
  Webhook,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/app/integration/_index")({
  component: IntegrationDashboard,
});

function IntegrationDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Connectors
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Puzzle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Active Workflows
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Workflow className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Events Today
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Bell className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Webhooks
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Webhook className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/app/integration/connectors">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <Puzzle className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-lg">Connectors</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Manage integrations with CRM, invoicing, helpdesk, and more.
              </p>
              <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                Manage Connectors <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/integration/workflows">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <Workflow className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-lg">Workflows</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Build and automate multi-step workflows with conditions.
              </p>
              <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                Manage Workflows <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/integration/events">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <Bell className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold text-lg">Events</h3>
              <p className="text-muted-foreground text-sm mt-1">
                View and manage event subscriptions and payloads.
              </p>
              <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                View Events <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Getting Started */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">Getting Started with Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">1</div>
              <div>
                <h4 className="font-medium text-sm">Create a Connector</h4>
                <p className="text-muted-foreground text-xs mt-1">Connect your favorite apps with OAuth2 support.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">2</div>
              <div>
                <h4 className="font-medium text-sm">Build a Workflow</h4>
                <p className="text-muted-foreground text-xs mt-1">Create automated sequences with triggers and actions.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">3</div>
              <div>
                <h4 className="font-medium text-sm">Subscribe to Events</h4>
                <p className="text-muted-foreground text-xs mt-1">Listen for events and trigger workflows automatically.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
