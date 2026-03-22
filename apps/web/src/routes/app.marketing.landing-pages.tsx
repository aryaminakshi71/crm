import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "lucide-react";

export const Route = createFileRoute("/app/marketing/landing-pages")({
  component: MarketingLandingPagesPage,
});

function MarketingLandingPagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Landing Pages</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Landing Pages</h1>
        <p className="text-muted-foreground text-sm">
          Build and publish campaign landing pages.
        </p>
      </div>
      <EmptyState
        icon={<Layout className="h-8 w-8 text-primary/40" />}
        title="Landing pages coming soon"
        description="A no-code landing page builder with campaign tracking will be available in an upcoming release."
      />
    </div>
  );
}
