import { Button, Card, CardContent, Badge } from "@crm/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  contactName?: string;
  to: string;
  from: string;
  durationSeconds?: number;
  createdAt: string;
  direction: "inbound" | "outbound";
  status: string;
}

const MOCK_CALLS: Call[] = [
  { id: "1", contactName: "Sarah Johnson", from: "+1 555-123-4567", to: "+1 555-000-0001", durationSeconds: 323, createdAt: new Date().toISOString(), direction: "inbound", status: "completed" },
  { id: "2", contactName: "Michael Chen", from: "+1 555-000-0001", to: "+1 555-234-5678", durationSeconds: 765, createdAt: new Date().toISOString(), direction: "outbound", status: "completed" },
  { id: "3", contactName: "Emily Davis", from: "+1 555-345-6789", to: "+1 555-000-0001", durationSeconds: undefined, createdAt: new Date().toISOString(), direction: "inbound", status: "missed" },
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

function VoiceCallsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "inbound" | "outbound" | "missed">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["communications", "calls"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/communications/calls`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to load calls");
      return res.json() as Promise<{ data: Call[] }>;
    },
  });

  const calls = data?.data ?? MOCK_CALLS;

  const filteredCalls = calls.filter((call) => {
    if (filter === "all") return true;
    if (filter === "missed") return call.status === "missed" || call.status === "failed";
    return call.direction === filter;
  });

  const getCallIcon = (call: Call) => {
    if (call.status === "missed" || call.status === "failed") {
      return <PhoneMissed className="h-4 w-4 text-red-600" />;
    }
    if (call.direction === "inbound") return <PhoneIncoming className="h-4 w-4 text-green-600" />;
    return <PhoneOutgoing className="h-4 w-4 text-blue-600" />;
  };

  const incoming = calls.filter((c) => c.direction === "inbound" && c.status !== "missed" && c.status !== "failed").length;
  const outgoing = calls.filter((c) => c.direction === "outbound").length;
  const missed = calls.filter((c) => c.status === "missed" || c.status === "failed").length;

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
                <p className="text-xl font-bold">{isLoading ? "…" : calls.length}</p>
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
                <p className="text-xl font-bold">{isLoading ? "…" : incoming}</p>
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
                <p className="text-xl font-bold">{isLoading ? "…" : outgoing}</p>
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
                <p className="text-xl font-bold">{isLoading ? "…" : missed}</p>
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
          <h3 className="font-semibold text-sm">Recordings</h3>
        </Link>
        <Link to="/app/communications/voice/transcriptions" className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center">
          <Mic className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Transcriptions</h3>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "inbound", "outbound", "missed"] as const).map((f) => (
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
                  {getCallIcon(call)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{call.contactName ?? (call.direction === "inbound" ? call.from : call.to)}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(call.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{call.direction === "inbound" ? call.from : call.to}</span>
                    {call.durationSeconds != null && (
                      <>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(call.durationSeconds)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredCalls.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No calls found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
