import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Globe, Settings } from "lucide-react";

export const Route = createFileRoute("/app/helpdesk/help-center")({
  component: HelpCenterPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.companyId) return { "x-organization-id": user.companyId };
    } catch {}
  }
  return {};
}

async function fetchOrgSettings() {
  const res = await fetch(`${API_BASE}/v1/settings/organization`, {
    headers: { ...getOrgHeader() },
  });
  if (!res.ok) throw new Error("No settings endpoint");
  return res.json();
}

function HelpCenterPage() {
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ["settings", "organization"],
    queryFn: fetchOrgSettings,
    retry: false,
  });

  if (isLoading) return <Loading text="Loading help center settings..." />;

  const settings = settingsData ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Help Center</h1>
        <p className="text-muted-foreground">
          Configure your public-facing help center and customer portal settings.
        </p>
      </div>

      {error || !settings ? (
        <>
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="Help Center not configured"
            description="The help center settings endpoint is not yet available. Contact your administrator to configure the public help center."
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Help Center Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Public Knowledge Base",
                    desc: "Publish knowledge articles as a searchable help center for customers.",
                  },
                  {
                    title: "Ticket Submission Portal",
                    desc: "Let customers submit tickets directly from the help center.",
                  },
                  {
                    title: "Custom Domain",
                    desc: "Host the help center on your own domain (e.g. help.yourcompany.com).",
                  },
                  {
                    title: "Branding",
                    desc: "Apply your logo, colors, and theme to match your brand.",
                  },
                  {
                    title: "SEO & Sitemap",
                    desc: "Auto-generate sitemaps and meta tags for discoverability.",
                  },
                  {
                    title: "Search",
                    desc: "Full-text search across all published articles.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs mt-1">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Help Center Status</CardTitle>
                <Badge
                  variant={settings.helpCenterEnabled ? "success" : "outline"}
                >
                  {settings.helpCenterEnabled ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {settings.helpCenterUrl && (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Public URL</p>
                    <p className="font-medium text-foreground">
                      {settings.helpCenterUrl}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ExternalLink className="h-3 w-3" />}
                    onClick={() =>
                      window.open(settings.helpCenterUrl, "_blank")
                    }
                  >
                    Open
                  </Button>
                </div>
              )}
              {settings.orgName && (
                <div>
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <p className="font-medium text-foreground">
                    {settings.orgName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Advanced help center configuration options are available in
                Organization Settings.
              </p>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
                className="mt-3"
                onClick={() => {
                  window.location.href = "/app/settings";
                }}
              >
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
