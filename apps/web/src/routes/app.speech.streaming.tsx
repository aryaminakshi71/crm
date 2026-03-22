import { Button, EmptyState } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Settings,
  Radio,
} from "lucide-react";

export const Route = createFileRoute("/app/speech/streaming")({
  component: StreamingPage,
});

function StreamingPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Real-time Streaming</h2>
            <p className="text-muted-foreground text-sm">Live transcription with AI</p>
          </div>
        </div>
        <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
          Settings
        </Button>
      </div>

      <EmptyState
        icon={<Radio className="h-12 w-12 text-muted-foreground/50" />}
        title="Real-time streaming coming soon"
        description="Live WebSocket-based transcription requires a direct microphone connection to our speech processing servers. This feature is coming soon."
        action={{
          label: "View Documentation",
          onClick: () => window.open("https://docs.nucleo.one/speech/streaming", "_blank"),
        }}
      />
    </div>
  );
}
