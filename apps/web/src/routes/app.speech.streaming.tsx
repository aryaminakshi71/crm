import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Settings,
  Radio,
  Mic,
  MicOff,
  Clock,
  FileText,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/speech/streaming")({
  component: StreamingPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

function StreamingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: recentTranscriptions, isLoading } = useQuery({
    queryKey: ["speech-transcriptions-streaming"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/speech/transcriptions`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch transcriptions");
      return res.json();
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/speech/transcriptions`, {
        method: "POST",
        headers: getOrgHeader(),
        body: JSON.stringify({
          title: `Live Session ${new Date().toLocaleTimeString()}`,
          language: "en",
          isStreaming: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speech-transcriptions-streaming"] });
      setIsStreaming(true);
    },
  });

  const stopSessionMutation = useMutation({
    mutationFn: async () => {
      setIsStreaming(false);
    },
  });

  const recentItems = (recentTranscriptions as any)?.data?.slice(0, 5) ?? [];

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

      {/* Streaming Controls */}
      <Card className="border-border/60">
        <CardContent className="p-6 text-center space-y-4">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            isStreaming ? "bg-red-500/20 animate-pulse" : "bg-muted"
          }`}>
            {isStreaming ? (
              <Mic className="h-10 w-10 text-red-500" />
            ) : (
              <MicOff className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {isStreaming ? "Recording in progress…" : "Ready to stream"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isStreaming
                ? "Live WebSocket transcription active"
                : "Click Start to begin a live transcription session"}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            {!isStreaming ? (
              <Button
                variant="primary"
                leftIcon={<Mic className="h-4 w-4" />}
                disabled={startSessionMutation.isPending}
                onClick={() => startSessionMutation.mutate()}
              >
                {startSessionMutation.isPending ? "Starting…" : "Start Session"}
              </Button>
            ) : (
              <Button
                variant="outline"
                leftIcon={<MicOff className="h-4 w-4" />}
                onClick={() => stopSessionMutation.mutate()}
              >
                Stop Session
              </Button>
            )}
          </div>
          {startSessionMutation.isError && (
            <p className="text-xs text-red-500">Failed to start session. Please try again.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Transcriptions */}
      {recentItems.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentItems.map((item: {
              id: string;
              title?: string;
              duration?: number;
              language?: string;
              createdAt?: string;
            }) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Radio className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title ?? `Session ${item.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.language ?? "English"} · {item.duration ? `${item.duration}s` : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isStreaming && recentItems.length === 0 && !isLoading && (
        <EmptyState
          icon={<Radio className="h-12 w-12 text-muted-foreground/50" />}
          title="No recent sessions"
          description="Start a new session to begin live transcription. Sessions are saved automatically."
          action={<Button onClick={() => window.open("https://docs.nucleo.one/speech/streaming", "_blank")}>View Documentation</Button>}
        />
      )}
    </div>
  );
}
