import { Card, CardContent, Button } from "@crm/ui";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Mic,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  ArrowLeft,
  Brain,
  Volume2,
  Upload,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/speech")({
  component: SpeechLayout,
});

const SPEECH_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/app/speech", icon: BarChart3 },
  { id: "transcribe", label: "Transcriptions", href: "/app/speech/transcribe", icon: FileText },
  { id: "streaming", label: "Streaming", href: "/app/speech/streaming", icon: Volume2 },
  { id: "speakers", label: "Speakers", href: "/app/speech/speakers", icon: Brain },
  { id: "vocabulary", label: "Vocabulary", href: "/app/speech/vocabulary", icon: MessageSquare },
  { id: "sentiment", label: "Sentiment", href: "/app/speech/sentiment", icon: BarChart3 },
  { id: "meetings", label: "Meeting Notes", href: "/app/speech/meetings", icon: FileText },
  { id: "commands", label: "Voice Commands", href: "/app/speech/commands", icon: Mic },
  { id: "models", label: "Language Models", href: "/app/speech/models", icon: Brain },
  { id: "settings", label: "Settings", href: "/app/speech/settings", icon: Settings },
];

function SpeechLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const stats = [
    { label: "Transcriptions", value: "45", icon: FileText, color: "text-blue-500" },
    { label: "Hours Transcribed", value: "128", icon: Mic, color: "text-emerald-500" },
    { label: "Accuracy", value: "98.5%", icon: Brain, color: "text-purple-500" },
    { label: "Languages", value: "12", icon: Volume2, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl text-foreground">Speech-to-Text (Avaan)</h1>
            <p className="text-muted-foreground text-sm">
              Transcription, voice commands, and meeting notes
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {SPEECH_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
