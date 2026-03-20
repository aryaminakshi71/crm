import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  contact: string;
  phone: string;
  duration: string;
  timestamp: string;
  speakers: number;
  preview: string;
}

const MOCK_TRANSCRIPTIONS: Transcription[] = [
  { id: "t1", contact: "Sarah Johnson", phone: "+1 555-123-4567", duration: "5:23", timestamp: "Mar 18, 2024 10:30 AM", speakers: 2, preview: "Agent: Thank you for calling. How can I help you today? Customer: Hi, I wanted to check on my order status..." },
  { id: "t2", contact: "Michael Chen", phone: "+1 555-234-5678", duration: "12:45", timestamp: "Mar 18, 2024 10:15 AM", speakers: 2, preview: "Agent: Welcome to customer support. Customer: Yes, I have a question about my invoice..." },
  { id: "t3", contact: "Emily Davis", phone: "+1 555-345-6789", duration: "3:12", timestamp: "Mar 17, 2024 09:30 AM", speakers: 2, preview: "Agent: Hi, how can I assist you? Customer: I'd like to schedule a callback..." },
];

function TranscriptionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTranscription = MOCK_TRANSCRIPTIONS.find((t) => t.id === selectedId);

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

          <div className="space-y-2">
            {MOCK_TRANSCRIPTIONS.map((t) => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-colors ${selectedId === t.id ? "border-primary" : ""}`}
                onClick={() => setSelectedId(t.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{t.contact}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.preview}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{t.duration}</span>
                    <span>•</span>
                    <span>{t.speakers} speakers</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Transcription Detail */}
        <div className="lg:col-span-2">
          {selectedTranscription ? (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedTranscription.contact}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTranscription.phone}</p>
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
                      <Clock className="h-3 w-3 mr-1" /> {selectedTranscription.duration}
                    </Badge>
                    <Badge variant="outline">
                      <User className="h-3 w-3 mr-1" /> {selectedTranscription.speakers} speakers
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">98% accuracy</Badge>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        A
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Agent</p>
                        <p className="text-sm">Thank you for calling. How can I help you today?</p>
                        <p className="text-xs text-muted-foreground mt-1">0:00 - 0:05</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                        C
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Customer</p>
                        <p className="text-sm">Hi, I wanted to check on my order status. I placed an order last week and haven't received any updates.</p>
                        <p className="text-xs text-muted-foreground mt-1">0:05 - 0:15</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        A
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Agent</p>
                        <p className="text-sm">I'd be happy to help you with that. Let me look up your order. Could you please provide your order number?</p>
                        <p className="text-xs text-muted-foreground mt-1">0:15 - 0:25</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                        C
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Customer</p>
                        <p className="text-sm">Sure, it's order number 12345.</p>
                        <p className="text-xs text-muted-foreground mt-1">0:25 - 0:30</p>
                      </div>
                    </div>
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
