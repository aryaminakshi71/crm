/**
 * Speech Meetings Index
 *
 * Browse transcribed meetings, view summaries, and manage recordings.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Mic,
  Play,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { speechApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/speech/meetings/_index")({
  validateSearch: searchSchema,
  component: MeetingsIndexPage,
});

interface Meeting {
  id: string;
  title?: string;
  name?: string;
  date?: string;
  createdAt?: string;
  startedAt?: string;
  duration?: number;
  durationMinutes?: number;
  participants?: string[] | number;
  participantCount?: number;
  transcriptionStatus?: string;
  status?: string;
  hasSummary?: boolean;
  summaryAvailable?: boolean;
  accuracy?: number;
}

const _MOCK_MEETINGS: Meeting[] = [
  { id: "M1", title: "Q1 Planning Session", date: "Mar 20, 2024", duration: 62, participants: ["Alice", "Bob", "Carol"], transcriptionStatus: "complete", hasSummary: true, accuracy: 97 },
  { id: "M2", title: "Product Roadmap Review", date: "Mar 19, 2024", duration: 45, participants: ["Alice", "Dave"], transcriptionStatus: "complete", hasSummary: true, accuracy: 95 },
  { id: "M3", title: "Client Call - Acme Corp", date: "Mar 18, 2024", duration: 30, participants: ["Bob", "External"], transcriptionStatus: "processing", hasSummary: false },
  { id: "M4", title: "Engineering Standup", date: "Mar 18, 2024", duration: 15, participants: ["Dave", "Eve", "Frank", "Grace"], transcriptionStatus: "complete", hasSummary: false, accuracy: 98 },
  { id: "M5", title: "Investor Update", date: "Mar 15, 2024", duration: 90, participants: ["Alice", "Bob"], transcriptionStatus: "failed", hasSummary: false },
];

function getTitle(m: Meeting) { return m.title ?? m.name ?? "Untitled Meeting"; }
function getDate(m: Meeting) {
  if (m.date) return m.date;
  if (m.createdAt ?? m.startedAt) return new Date((m.createdAt ?? m.startedAt)!).toLocaleDateString();
  return "—";
}
function getDuration(m: Meeting) {
  const mins = m.duration ?? m.durationMinutes ?? 0;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}
function getParticipantCount(m: Meeting) {
  if (typeof m.participantCount === "number") return m.participantCount;
  if (Array.isArray(m.participants)) return m.participants.length;
  if (typeof m.participants === "number") return m.participants;
  return 0;
}
function getTranscriptionStatus(m: Meeting) { return m.transcriptionStatus ?? m.status ?? "pending"; }
function hasSummary(m: Meeting) { return m.hasSummary ?? m.summaryAvailable ?? false; }

function TranscriptionBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
    complete: "success",
    processing: "info",
    pending: "warning",
    failed: "danger",
  };
  return <Badge variant={map[status] ?? "default"} size="sm">{status}</Badge>;
}

function MeetingsIndexPage() {
  const queryClient = useQueryClient();
  const { q: searchQuery = "", status: statusFilter = "all" } = useSearch({ from: "/app/speech/meetings/_index" });
  const navigate = useNavigate({ from: "/app/speech/meetings" });
  const setSearchQuery = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v }) });
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["speech-meetings-index"],
    queryFn: () => speechApi.meetings.list(),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string }) => speechApi.meetings.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speech-meetings-index"] });
      setShowCreate(false);
      setNewTitle("");
    },
  });

  const allMeetings: Meeting[] =
    (data as any)?.data ?? [];

  const meetings = allMeetings.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || getTitle(m).toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || getTranscriptionStatus(m) === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalTranscribed = allMeetings.filter((m) => getTranscriptionStatus(m) === "complete").length;
  const avgAccuracy =
    allMeetings.filter((m) => m.accuracy != null).length > 0
      ? allMeetings
          .filter((m) => m.accuracy != null)
          .reduce((sum, m) => sum + (m.accuracy ?? 0), 0) /
        allMeetings.filter((m) => m.accuracy != null).length
      : 0;
  const withSummary = allMeetings.filter(hasSummary).length;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load meetings. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Meetings</h2>
          <p className="text-sm text-muted-foreground">{meetings.length} meetings transcribed</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          New Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transcribed</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalTranscribed}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-black text-foreground mt-0.5">
                  {avgAccuracy > 0 ? `${avgAccuracy.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">With Summary</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{withSummary}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="complete">Complete</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">New Meeting Transcription</p>
            <input
              type="text"
              placeholder="Meeting title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Mic className="h-4 w-4" />}
                disabled={!newTitle || createMutation.isPending}
                onClick={() => createMutation.mutate({ title: newTitle })}
              >
                {createMutation.isPending ? "Starting..." : "Start Recording"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Mic className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No meetings recorded yet</p>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
            New Meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Mic className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{getTitle(meeting)}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getDuration(meeting)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {getParticipantCount(meeting)} participants
                        </span>
                        <span>{getDate(meeting)}</span>
                        {meeting.accuracy && (
                          <span className="text-green-600">{meeting.accuracy}% accuracy</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TranscriptionBadge status={getTranscriptionStatus(meeting)} />
                    {hasSummary(meeting) && (
                      <Badge variant="info" size="sm">Summary</Badge>
                    )}
                    {getTranscriptionStatus(meeting) === "complete" && (
                      <Button variant="outline" size="sm" leftIcon={<Play className="h-3 w-3" />}>
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
