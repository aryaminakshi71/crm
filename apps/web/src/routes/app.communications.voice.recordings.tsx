import { Button, Card, CardContent, Badge } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Disc,
  Play,
  Pause,
  Download,
  Trash2,
  Search,
  Phone,
  Clock,
  Volume2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/voice/recordings")({
  component: RecordingsPage,
});

interface Recording {
  id: string;
  contactName?: string;
  phone?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  createdAt: string;
  storageUrl?: string;
}

const MOCK_RECORDINGS: Recording[] = [
  { id: "rec-1", contactName: "Sarah Johnson", phone: "+1 555-123-4567", durationSeconds: 323, fileSizeBytes: 1258291, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "rec-2", contactName: "Michael Chen", phone: "+1 555-234-5678", durationSeconds: 765, fileSizeBytes: 2936013, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "rec-3", contactName: "Emily Davis", phone: "+1 555-345-6789", durationSeconds: 192, fileSizeBytes: 943718, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "rec-4", contactName: "Robert Wilson", phone: "+1 555-456-7890", durationSeconds: 536, fileSizeBytes: 2202010, createdAt: new Date(Date.now() - 90000000).toISOString() },
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

function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function RecordingsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["communications", "recordings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/communications/recordings`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to load recordings");
      return res.json() as Promise<{ data: Recording[] }>;
    },
  });

  const recordings = data?.data ?? MOCK_RECORDINGS;

  const filteredRecordings = recordings.filter((rec) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      rec.contactName?.toLowerCase().includes(q) ||
      rec.phone?.includes(q)
    );
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/voice" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Call Recordings</h2>
            <p className="text-muted-foreground text-sm">Listen and manage call recordings</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      {/* Recordings List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading recordings…</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredRecordings.map((rec) => (
                <div key={rec.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary/10"
                    onClick={() => setPlayingId(playingId === rec.id ? null : rec.id)}
                  >
                    {playingId === rec.id ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 text-primary" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{rec.contactName ?? rec.phone ?? "Unknown"}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rec.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {rec.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {rec.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(rec.durationSeconds)}
                      </span>
                      <span>{formatSize(rec.fileSizeBytes)}</span>
                    </div>
                  </div>

                  {playingId === rec.id && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <div className="w-24 h-1 bg-primary/30 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-primary rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredRecordings.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No recordings found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
