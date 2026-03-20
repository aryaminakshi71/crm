import { Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  Plus,
  Search,
  Edit,
  Trash2,
  Mic,
  Clock,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/speech/speakers")({
  component: SpeakersPage,
});

interface Speaker {
  id: string;
  name: string;
  color: string;
  transcriptions: number;
  totalSpeakingTime: string;
}

const MOCK_SPEAKERS: Speaker[] = [
  { id: "s1", name: "Sarah Johnson", color: "bg-blue-500", transcriptions: 12, totalSpeakingTime: "2h 34m" },
  { id: "s2", name: "Michael Chen", color: "bg-green-500", transcriptions: 8, totalSpeakingTime: "1h 45m" },
  { id: "s3", name: "Emily Davis", color: "bg-purple-500", transcriptions: 15, totalSpeakingTime: "3h 12m" },
  { id: "s4", name: "Robert Wilson", color: "bg-amber-500", transcriptions: 6, totalSpeakingTime: "1h 02m" },
];

function SpeakersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSpeakers = MOCK_SPEAKERS.filter((speaker) =>
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Speaker Identification</h2>
            <p className="text-muted-foreground text-sm">Manage speaker profiles for better identification</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Add Speaker
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search speakers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredSpeakers.map((speaker) => (
          <Card key={speaker.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${speaker.color} flex items-center justify-center text-white font-medium`}>
                    {speaker.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{speaker.name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {speaker.id}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mic className="h-3 w-3" /> {speaker.transcriptions} transcriptions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {speaker.totalSpeakingTime}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
