import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Mail, Plus,
  AlertCircle
} from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/marketing/email-builder")({
  component: MarketingEmailBuilderPage,
});

function MarketingEmailBuilderPage() {
  // Reuse campaign list as email templates (filtered to email channel)
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["marketing-email-templates"],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 100 }),
  });

  const allCampaigns = (data?.data as any[]) ?? [];
  const emailTemplates = allCampaigns.filter((c: any) => c.channel === "email");

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Email Builder</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Email Builder</h1>
          <p className="text-muted-foreground text-sm">
            Design and manage email campaign templates.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} variant="outline" disabled>
          New Template
        </Button>
      </div>

      {isLoading ? (
        <Loading text="Loading templates..." />
      ) : emailTemplates.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8 text-primary/40" />}
          title="No email campaigns yet"
          description="Create email campaigns to use them as templates here. A visual email builder is coming soon."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {emailTemplates.map((t: any) => (
            <Card key={t.id} className="border-border/60 hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted/50 p-2 shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
                    {t.goal && (
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{t.goal}</p>
                    )}
                    <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      t.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
