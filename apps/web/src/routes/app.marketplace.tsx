/**
 * Marketplace Route
 *
 * App marketplace.
 */

import { Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";

export const Route = createFileRoute("/app/marketplace")({
  component: MarketplacePage,
});

function MarketplacePage() {
  const apps = [
    {
      id: 1,
      name: "Slack Integration",
      description: "Connect your CRM to Slack for real-time notifications.",
      installed: false,
    },
    {
      id: 2,
      name: "Google Calendar",
      description: "Sync your meetings and events automatically.",
      installed: true,
    },
    {
      id: 3,
      name: "Mailchimp",
      description: "Export contacts to Mailchimp for email campaigns.",
      installed: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Marketplace</h1>
        <p className="text-muted-foreground">
          Discover apps and integrations to power up your CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{app.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 min-h-[40px] text-muted-foreground text-sm">
                {app.description}
              </p>
              <Button
                variant={app.installed ? "outline" : "primary"}
                className="w-full"
                disabled={app.installed}
              >
                {app.installed ? "Installed" : "Install App"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
