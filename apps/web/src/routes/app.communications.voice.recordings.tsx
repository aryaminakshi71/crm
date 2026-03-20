import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Disc,
  Play,
  Pause,
  Download,
  Trash2,
  Search,
  Filter,
  Phone,
  Clock,
  Mic,
  Volume2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/voice/recordings")({
  component: RecordingsPage,
});

interface Recording {
  id: string;
  contact: string;
  phone: string;
  duration: string;
  timestamp: string;
  size: string;
}

const MOCK_RECORDINGS: Recording[] = [
  { id: "rec-1", contact: "Sarah Johnson", phone: "+1 555-123-4567", duration: "5:23", timestamp: "Mar 18, 2024 10:30 AM", size: "1.2 MB" },
  { id: "rec-2", contact: "Michael Chen", phone: "+1 555-234-5678", duration: "12:45", timestamp: "Mar 18, 2024 10:15 AM", size: "2.8 MB" },
  { id: "rec-3", contact: "Emily Davis", phone: "+1 555-345-6789", duration: "3:12", timestamp: "Mar 17, 2024 09:30 AM", size: "0.9 MB" },
  { id: "rec-4", contact: "Robert Wilson", phone: "+1 555-456-7890", duration: "8:56", timestamp: "Mar 17, 2024 02:15 PM", size: "2.1 MB" },
  { id: "rec-5", contact: "Jennifer Martinez", phone: "+1 555-567-8901", duration: "4:33", timestamp: "Mar 16, 2024 04:45 PM", size: "1.5 MB" },
];

function RecordingsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filteredRecordings = MOCK_RECORDINGS.filter((rec) => {
    return rec.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.phone.includes(searchQuery);
  });

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
                    <h3 className="font-semibold">{rec.contact}</h3>
                    <span className="text-xs text-muted-foreground">{rec.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {rec.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rec.duration}
                    </span>
                    <span>{rec.size}</span>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
