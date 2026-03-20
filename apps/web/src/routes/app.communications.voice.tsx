import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Disc,
  Mic,
  FileText,
  Plus,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/voice")({
  component: VoiceCallsPage,
});

interface Call {
  id: string;
  contact: string;
  phone: string;
  duration: string;
  timestamp: string;
  type: "incoming" | "outgoing" | "missed";
  status: "completed" | "voicemail" | "failed";
}

const MOCK_CALLS: Call[] = [
  { id: "1", contact: "Sarah Johnson", phone: "+1 555-123-4567", duration: "5:23", timestamp: "10:30 AM", type: "incoming", status: "completed" },
  { id: "2", contact: "Michael Chen", phone: "+1 555-234-5678", duration: "12:45", timestamp: "10:15 AM", type: "outgoing", status: "completed" },
  { id: "3", contact: "Emily Davis", phone: "+1 555-345-6789", duration: "-", timestamp: "09:45 AM", type: "missed", status: "failed" },
  { id: "4", contact: "Robert Wilson", phone: "+1 555-456-7890", duration: "3:12", timestamp: "09:30 AM", type: "incoming", status: "voicemail" },
  { id: "5", contact: "Jennifer Martinez", phone: "+1 555-567-8901", duration: "8:56", timestamp: "Yesterday", type: "outgoing", status: "completed" },
];

function VoiceCallsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing" | "missed">("all");

  const filteredCalls = MOCK_CALLS.filter((call) => {
    return filter === "all" || call.type === filter;
  });

  const getCallIcon = (type: Call["type"]) => {
    switch (type) {
      case "incoming": return <PhoneIncoming className="h-4 w-4 text-green-600" />;
      case "outgoing": return <PhoneOutgoing className="h-4 w-4 text-blue-600" />;
      case "missed": return <PhoneMissed className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Voice Calls</h2>
            <p className="text-muted-foreground text-sm">Manage voice calls and recordings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/app/communications/voice/dial">
            <Button variant="primary" leftIcon={<Phone className="h-4 w-4" />}>
              Open Dialpad
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-xl font-bold">42</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <PhoneIncoming className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Incoming</p>
                <p className="text-xl font-bold">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <PhoneOutgoing className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outgoing</p>
                <p className="text-xl font-bold">21</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <PhoneMissed className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missed</p>
                <p className="text-xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/app/communications/voice/dial" className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center">
          <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Dialpad</h3>
        </Link>
        <Link to="/app/communications/voice/ivr" className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center">
          <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">IVR Builder</h3>
        </Link>
        <Link to="/app/communications/voice/recordings" className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center">
          <Disc className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Discs</h3>
        </Link>
        <Link to="/app/communications/voice/transcriptions" className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center">
          <Mic className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Transcriptions</h3>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "incoming", "outgoing", "missed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Calls List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredCalls.map((call) => (
              <div key={call.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {getCallIcon(call.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{call.contact}</h3>
                    <span className="text-xs text-muted-foreground">{call.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{call.phone}</span>
                    {call.duration !== "-" && (
                      <>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{call.duration}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  {call.status === "voicemail" && (
                    <Button variant="ghost" size="sm">
                      <Disc className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
