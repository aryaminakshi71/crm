import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  BarChart3,
  User,
  Clock,
  Loader2,,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/orpc";
import { useState } from "react";

export const Route = createFileRoute("/app/speech/transcribe/$id")({
  component: TranscriptionDetailPage,
});

function TranscriptionDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: transcription, isLoading, error, refetch, isError} = useQuery({
    queryKey: ["speech", "transcription", id],
    queryFn: () => api["speech"]["transcriptions.get"]({ id }),
  });

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Transcription not found or failed to load.</p>
        <Button variant="ghost" onClick={() => navigate({ to: "/app/speech/transcribe" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transcriptions
        </Button>
      </div>
    );
  }

  // Parse segments from the stored transcript if available
  const segments: Array<{ id: number; speaker: string; start: string; end: string; text: string }> =
    transcription.segments || [];

  // Format duration from seconds
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const title = transcription.title || "Untitled Transcription";
  const createdAt = transcription.createdAt
    ? new Date(transcription.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const duration = formatDuration(transcription.audioDuration);
  const confidence = transcription.confidence
    ? `${(transcription.confidence * 100).toFixed(1)}%`
    : "—";
  const language = transcription.language || "en";
  const status = transcription.status || "pending";
  const fullText = transcription.transcript || transcription.text || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech/transcribe" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">{title}</h2>
            <p className="text-muted-foreground text-sm">
              {createdAt}
              {duration !== "—" && ` • ${duration} duration`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          {transcription.sourceUrl && (
            <Button
              variant="primary"
              leftIcon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? "Pause" : "Play Audio"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Transcript */}
        <div className="lg:col-span-3">
          <Card className="border-border/60">
            <CardContent className="p-6">
              {status === "pending" || status === "processing" ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground capitalize">{status}...</p>
                </div>
              ) : segments.length > 0 ? (
                <div className="space-y-4">
                  {segments.map((segment, idx) => (
                    <div key={segment.id ?? idx} className="flex gap-4">
                      <div className="w-20 shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">{segment.start}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            idx % 3 === 0 ? "bg-blue-100 text-blue-700" :
                            idx % 3 === 1 ? "bg-green-100 text-green-700" :
                            "bg-purple-100 text-purple-700"
                          }`}>
                            {(idx % 3) + 1}
                          </span>
                          <span className="text-sm font-medium">{segment.speaker || `Speaker ${(idx % 3) + 1}`}</span>
                        </div>
                        <p className="text-sm pl-8">{segment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : fullText ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{fullText}</p>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No transcript content available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={
                  status === "completed" ? "bg-green-100 text-green-800" :
                  status === "failed" ? "bg-red-100 text-red-800" :
                  "bg-amber-100 text-amber-800"
                }>
                  {status}
                </Badge>
              </div>
              {confidence !== "—" && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                  <Badge className="bg-green-100 text-green-800">{confidence}</Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Language</span>
                <span className="text-sm font-medium uppercase">{language}</span>
              </div>
              {duration !== "—" && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{duration}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm font-medium capitalize">
                  {transcription.sourceType?.replace("_", " ") || "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Custom Vocabulary */}
          {transcription.customVocabulary && transcription.customVocabulary.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" /> Custom Vocabulary
                </h3>
                <div className="flex flex-wrap gap-1">
                  {transcription.customVocabulary.map((term: string) => (
                    <span key={term} className="px-2 py-0.5 rounded-full bg-muted/50 text-xs">
                      {term}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Speakers (if diarization data available) */}
          {segments.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" /> Speakers Detected
                </h3>
                <div className="space-y-2">
                  {Array.from(new Set(segments.map((s) => s.speaker || "Unknown"))).map(
                    (speaker, i) => (
                      <div key={speaker} className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                          i === 0 ? "bg-blue-100 text-blue-700" :
                          i === 1 ? "bg-green-100 text-green-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {i + 1}
                        </div>
                        <span className="text-sm">{speaker}</span>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
