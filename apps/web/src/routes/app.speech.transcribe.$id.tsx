import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Copy,
  Clock,
  User,
  Volume2,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/speech/transcribe/$id")({
  component: TranscriptionDetailPage,
});

const MOCK_TRANSCRIPT = [
  { id: 1, speaker: "Speaker 1", start: "0:00", end: "0:15", text: "Good morning, everyone. Let's start today's sales meeting." },
  { id: 2, speaker: "Speaker 2", start: "0:15", end: "0:32", text: "Thanks for joining. I wanted to share our Q4 performance update." },
  { id: 3, speaker: "Speaker 1", start: "0:32", end: "0:48", text: "Great. Let's dive right in. What were our key achievements this quarter?" },
  { id: 4, speaker: "Speaker 2", start: "0:48", end: "1:15", text: "We exceeded our targets by 15%, bringing in 2.3 million in revenue. Our enterprise segment grew by 23%." },
  { id: 5, speaker: "Speaker 3", start: "1:15", end: "1:30", text: "That's impressive! What drove that growth?" },
  { id: 6, speaker: "Speaker 2", start: "1:30", end: "2:05", text: "Mainly our new product launch and improved customer retention. We also saw strong performance in the West Coast region." },
];

function TranscriptionDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech/transcribe" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Sales Call - Q4 Review</h2>
            <p className="text-muted-foreground text-sm">March 18, 2024 • 45:23 duration</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button variant="primary" leftIcon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "Pause" : "Play Audio"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Transcript */}
        <div className="lg:col-span-3">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="space-y-4">
                {MOCK_TRANSCRIPT.map((segment) => (
                  <div key={segment.id} className="flex gap-4">
                    <div className="w-20 shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">{segment.start}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          segment.speaker === "Speaker 1" ? "bg-blue-100 text-blue-700" :
                          segment.speaker === "Speaker 2" ? "bg-green-100 text-green-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {segment.speaker === "Speaker 1" ? "1" : segment.speaker === "Speaker 2" ? "2" : "3"}
                        </span>
                        <span className="text-sm font-medium">{segment.speaker}</span>
                      </div>
                      <p className="text-sm pl-8">{segment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <Badge className="bg-green-100 text-green-800">98.2%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Speakers</span>
                <span className="text-sm font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Language</span>
                <span className="text-sm font-medium">English</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">45:23</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Sentiment
              </h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Positive</span>
                    <span>72%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Neutral</span>
                    <span>23%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 rounded-full" style={{ width: "23%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Negative</span>
                    <span>5%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: "5%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Speakers
              </h3>
              <div className="space-y-2">
                {["Sarah (Sales Manager)", "Michael (VP Sales)", "Emily (Account Exec)"].map((speaker, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                      i === 0 ? "bg-blue-100 text-blue-700" : i === 1 ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-sm">{speaker}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
