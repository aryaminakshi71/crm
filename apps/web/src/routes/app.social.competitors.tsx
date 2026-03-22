import { Button } from "@crm/ui";
import { EmptyState } from "@repo/ui/components/ui/empty-state";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Target } from "lucide-react";

export const Route = createFileRoute("/app/social/competitors")({
  component: CompetitorsPage,
});

function CompetitorsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Competitor Monitoring</h2>
            <p className="text-muted-foreground text-sm">Track your competitors on social media</p>
          </div>
        </div>
      </div>

      <EmptyState
        icon={<Target className="h-12 w-12" />}
        title="Competitor Monitoring"
        description="Competitor tracking and benchmarking is coming soon. You'll be able to monitor competitor social activity, compare metrics, and gain strategic insights."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/app/social" })}>
            Back to Social
          </Button>
        }
      />
    </div>
  );
}
