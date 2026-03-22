import { Button } from "@crm/ui";
import { EmptyState } from "@repo/ui/components/ui/empty-state";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";

export const Route = createFileRoute("/app/social/influencers")({
  component: InfluencersPage,
});

function InfluencersPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-bold text-xl">Influencer Identification</h2>
          <p className="text-muted-foreground text-sm">Find and connect with influencers</p>
        </div>
      </div>

      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Influencer Identification"
        description="Influencer discovery and management is coming soon. You'll be able to find, analyze, and collaborate with influencers in your niche."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/app/social" })}>
            Back to Social
          </Button>
        }
      />
    </div>
  );
}
