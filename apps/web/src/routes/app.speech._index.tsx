import { Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Mic,
  FileText,
  MessageSquare,
  Upload,
  Volume2,
  Clock,
  Brain,
  Play,
} from "lucide-react";

export const Route = createFileRoute("/app/speech/_index")({
  component: SpeechDashboard,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_RECENT_TRANSCRIPTIONS = [
  { id: "t1", name: "Sales Call - Q4 Review", duration: "45:23", date: "2 hours ago", accuracy: 98.2 },
  { id: "t2", name: "Team Standup Meeting", duration: "28:15", date: "4 hours ago", accuracy: 97.8 },
  { id: "t3", name: "Customer Interview", duration: "1:02:34", date: "Yesterday", accuracy: 99.1 },
];

const QUICK_ACTIONS = [
  { name: "Upload Audio", description: "Transcribe audio file", href: "/app/speech/transcribe/new", icon: Upload, color: "bg-blue-500" },
  { name: "Live Transcription", description: "Real-time streaming", href: "/app/speech/streaming", icon: Volume2, color: "bg-emerald-500" },
  { name: "Meeting Notes", description: "Generate summary", href: "/app/speech/meetings", icon: FileText, color: "bg-purple-500" },
  { name: "Voice Commands", description: "Configure commands", href: "/app/speech/commands", icon: Mic, color: "bg-amber-500" },
];

function SpeechDashboard() {
  const { data: transcriptionsData } = useQuery({
    queryKey: ["speech", "transcriptions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/speech/transcriptions?limit=10`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const recentTranscriptions = transcriptionsData?.data?.length
    ? transcriptionsData.data.map((t: any) => ({
        id: t.id,
        name: t.name ?? t.fileName ?? "Untitled",
        duration: t.duration ?? "-",
        date: t.createdAt ? new Date(t.createdAt).toLocaleString() : "-",
        accuracy: t.accuracy ?? 0,
      }))
    : MOCK_RECENT_TRANSCRIPTIONS;

  const totalHours = transcriptionsData?.totalDurationHours ?? 128;
  const avgAccuracy = transcriptionsData?.avgAccuracy ?? 98.2;
  const speakersDetected = transcriptionsData?.totalSpeakers ?? 24;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center group"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} mx-auto mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{action.name}</h3>
            <p className="text-muted-foreground text-xs mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Transcriptions */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Recent Transcriptions
          </h2>
          <div className="space-y-3">
            {recentTranscriptions.map((transcription: any) => (
              <Link
                key={transcription.id}
                to={`/app/speech/transcribe/${transcription.id}` as string}
                className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Play className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{transcription.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{transcription.duration}</span>
                    <span>•</span>
                    <span>{transcription.date}</span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">{transcription.accuracy}%</Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Audio</p>
                <p className="text-xl font-bold">{totalHours} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Brain className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-xl font-bold">{avgAccuracy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Speakers Detected</p>
                <p className="text-xl font-bold">{speakersDetected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
