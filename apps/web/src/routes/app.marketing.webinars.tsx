import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Video } from "lucide-react";

export const Route = createFileRoute("/app/marketing/webinars")({
  component: MarketingWebinarsPage,
});

function MarketingWebinarsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Webinars</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Webinars</h1>
        <p className="text-muted-foreground text-sm">
          Schedule, host, and track webinar registrations and attendance.
        </p>
      </div>
      <EmptyState
        icon={<Video className="h-8 w-8 text-primary/40" />}
        title="Webinars coming soon"
        description="Integrated webinar management with registration tracking and follow-up automation will be available in an upcoming release."
      />
    </div>
  );
}
