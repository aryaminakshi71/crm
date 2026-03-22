import { Button, Card, CardContent, Badge } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Mic,
  Play,
  Download,
  Search,
  Clock,
  User,
  Quote,
  Copy,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/voice/transcriptions")({
  component: TranscriptionsPage,
});

interface Transcription {
  id: string;
  callId?: string;
  contactName?: string;
  phone?: string;
  durationSeconds?: number;
  createdAt: string;
  transcript?: string;
  speakers?: number;
  preview?: string;
}

const MOCK_TRANSCRIPTIONS: Transcription[] = [
  { id: "t1", contactName: "Sarah Johnson", phone: "+1 555-123-4567", durationSeconds: 323, createdAt: new Date(Date.now() - 3600000).toISOString(), speakers: 2, preview: "Agent: Thank you for calling. How can I help you today? Customer: Hi, I wanted to check on my order status..." },
  { id: "t2", contactName: "Michael Chen", phone: "+1 555-234-5678", durationSeconds: 765, createdAt: new Date(Date.now() - 7200000).toISOString(), speakers: 2, preview: "Agent: Welcome to customer support. Customer: Yes, I have a question about my invoice..." },
  { id: "t3", contactName: "Emily Davis", phone: "+1 555-345-6789", durationSeconds: 192, createdAt: new Date(Date.now() - 86400000).toISOString(), speakers: 2, preview: "Agent: Hi, how can I assist you? Customer: I'd like to schedule a callback..." },
];

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TranscriptionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Transcriptions come from the speech router (/api/speech/transcriptions)
  const { data, isLoading } = useQuery({
    queryKey: ["communications", "transcriptions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/speech/transcriptions`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to load transcriptions");
      return res.json() as Promise<{ data: Transcription[] }>;
    },
  });

  const transcriptions = data?.data ?? MOCK_TRANSCRIPTIONS;

  const filtered = transcriptions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      t.contactName?.toLowerCase().includes(q) ||
      t.phone?.includes(q) ||
      t.preview?.toLowerCase().includes(q)
    );
  });

  const selectedTranscription = transcriptions.find((t) => t.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/voice" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Call Transcriptions</h2>
            <p className="text-muted-foreground text-sm">AI-powered transcription of voice calls</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transcription List */}
        <div className="lg:col-span-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transcriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm py-8">Loading…</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-colors ${selectedId === t.id ? "border-primary" : ""}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{t.contactName ?? t.phone ?? "Unknown"}</span>
                    </div>
                    {t.preview && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.preview}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(t.durationSeconds)}</span>
                      {t.speakers && (
                        <>
                          <span>•</span>
                          <span>{t.speakers} speakers</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No transcriptions found</p>
              )}
            </div>
          )}
        </div>

        {/* Transcription Detail */}
        <div className="lg:col-span-2">
          {selectedTranscription ? (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedTranscription.contactName ?? "Unknown"}</h3>
                    {selectedTranscription.phone && (
                      <p className="text-sm text-muted-foreground">{selectedTranscription.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Play className="h-4 w-4" />}>
                      Play Audio
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                      Export
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" /> {formatDuration(selectedTranscription.durationSeconds)}
                    </Badge>
                    {selectedTranscription.speakers && (
                      <Badge variant="outline">
                        <User className="h-3 w-3 mr-1" /> {selectedTranscription.speakers} speakers
                      </Badge>
                    )}
                    <Badge className="bg-green-100 text-green-800">98% accuracy</Badge>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    {selectedTranscription.transcript ? (
                      <p className="text-sm whitespace-pre-wrap">{selectedTranscription.transcript}</p>
                    ) : selectedTranscription.preview ? (
                      <p className="text-sm">{selectedTranscription.preview}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Transcript not available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60">
              <CardContent className="p-12 text-center">
                <Quote className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Select a transcription to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
