import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  Settings,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/speech/streaming")({
  component: StreamingPage,
});

const LIVE_TRANSCRIPT = [
  { id: 1, speaker: "Speaker 1", text: "The quarterly results show significant growth in the enterprise segment." },
  { id: 2, speaker: "Speaker 2", text: "Yes, we saw a 23% increase year over year." },
  { id: 3, speaker: "Speaker 1", text: "That's excellent. What factors contributed to this success?" },
  { id: 4, speaker: "Speaker 2", text: "Mainly our expanded product offerings and improved customer support." },
];

function StreamingPage() {
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);

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
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Badge className="bg-red-100 text-red-800 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-2" /> Live
            </Badge>
          ) : null}
          <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
            Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Button
                    variant={isStreaming ? "destructive" : "primary"}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setIsStreaming(!isStreaming)}
                  >
                    {isStreaming ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <div>
                    <p className="font-medium">{isStreaming ? "Recording..." : "Ready to start"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {isStreaming ? "00:00:00" : "0:00:00"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Live Transcript */}
              <div className="bg-black/90 rounded-lg p-4 min-h-[300px]">
                <div className="space-y-3">
                  {LIVE_TRANSCRIPT.map((segment) => (
                    <div key={segment.id} className="flex gap-3">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        segment.speaker === "Speaker 1" ? "bg-blue-500" : "bg-green-500"
                      } text-white`}>
                        {segment.speaker === "Speaker 1" ? "1" : "2"}
                      </span>
                      <p className="text-white text-sm">
                        <span className="font-medium">{segment.speaker}:</span> {segment.text}
                      </p>
                    </div>
                  ))}
                  {isStreaming && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <span className="animate-pulse">Transcribing...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1">
                  <Play className="h-4 w-4 mr-1" /> Play Last
                </Button>
                <Button variant="outline" className="flex-1">
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Audio Input</h3>
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Microphone</p>
                  <select className="w-full mt-1 px-2 py-1 border rounded text-sm bg-background">
                    <option>Built-in Microphone</option>
                    <option>External USB Mic</option>
                    <option>Virtual Audio Cable</option>
                  </select>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Language</p>
                  <select className="w-full mt-1 px-2 py-1 border rounded text-sm bg-background">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700">Ensure good audio quality for best transcription accuracy.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
