import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Plus,
  Search,
  Play,
  Download,
  Trash2,
  Clock,
  Upload,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { speechApi } from "@/lib/api";

export const Route = createFileRoute("/app/speech/transcribe")({
  component: TranscriptionsPage,
});

interface Transcription {
  id: string;
  name: string;
  duration: string;
  date: string;
  status: "completed" | "processing" | "failed";
  speakers: number;
  accuracy: number;
  language: string;
}

function TranscriptionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "processing">("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["speech", "transcriptions", filter],
    queryFn: () => speechApi.transcriptions.list(),
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const transcriptions: Transcription[] = (data as any)?.data ?? [];

  const filteredTranscriptions = transcriptions.filter((t) => {
    const matchesSearch = (t.name ?? (t as any).title ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: Transcription["status"]) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing": return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "failed": return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Transcriptions</h2>
            <p className="text-muted-foreground text-sm">View and manage your audio transcriptions</p>
          </div>
        </div>
        <Link to="/app/speech/transcribe/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New Transcription
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transcriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border rounded-lg bg-background text-sm"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
          </select>
        </div>
      </div>

      {/* Transcriptions List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredTranscriptions.map((transcription) => (
              <div key={transcription.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <Link to={`/app/speech/transcribe/${transcription.id}` as string} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Play className="h-4 w-4 text-primary" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/app/speech/transcribe/${transcription.id}` as string} className="font-medium hover:text-primary">
                    {transcription.name}
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {transcription.duration}
                    </span>
                    <span>•</span>
                    <span>{transcription.speakers} speakers</span>
                    <span>•</span>
                    <span>{transcription.language}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(transcription.status)}
                  {transcription.status === "completed" && (
                    <>
                      <Badge className="bg-green-100 text-green-800">{transcription.accuracy}%</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
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
