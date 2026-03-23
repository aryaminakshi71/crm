import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Plus,
  Clock,
  Users,
  Download,
  Play,
  CheckCircle,,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/speech/meetings")({
  component: MeetingsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: number;
  status: "completed" | "in-progress" | "scheduled";
  summary?: string;
}

const MOCK_MEETINGS: Meeting[] = [
  { id: "m1", title: "Weekly Team Standup", date: "Mar 18, 2024", duration: "28m", participants: 6, status: "completed", summary: "Discussed Q1 goals and current sprint progress." },
  { id: "m2", title: "Sales Pipeline Review", date: "Mar 17, 2024", duration: "45m", participants: 4, status: "completed", summary: "Reviewed enterprise deal status and Q4 forecasts." },
  { id: "m3", title: "Product Demo", date: "Mar 19, 2024", duration: "-", participants: 3, status: "scheduled" },
  { id: "m4", title: "Customer Interview", date: "Mar 16, 2024", duration: "1h 2m", participants: 2, status: "completed", summary: "Gathered feedback on new onboarding flow." },
];

function MeetingsPage() {
  const navigate = useNavigate();

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["speech", "meetings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/speech/meetings`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return res.json();
    },
  });

  const meetings: Meeting[] = data?.data ?? MOCK_MEETINGS;

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
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
            <h2 className="font-bold text-xl">Meeting Notes</h2>
            <p className="text-muted-foreground text-sm">AI-generated summaries from meetings</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Schedule Meeting
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {meetings.map((meeting) => (
          <Card key={meeting.id} className="border-border/60 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${
                    meeting.status === "completed" ? "bg-green-100" :
                    meeting.status === "in-progress" ? "bg-blue-100" : "bg-muted"
                  }`}>
                    <FileText className={`h-5 w-5 ${
                      meeting.status === "completed" ? "text-green-600" :
                      meeting.status === "in-progress" ? "text-blue-600" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{meeting.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {meeting.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {meeting.participants}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={
                  meeting.status === "completed" ? "bg-green-100 text-green-800" :
                  meeting.status === "in-progress" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground"
                }>
                  {meeting.status === "in-progress" ? "In Progress" : meeting.status}
                </Badge>
              </div>

              {meeting.summary && (
                <p className="text-sm text-muted-foreground mb-4 pl-13">{meeting.summary}</p>
              )}

              <div className="flex gap-2 pl-13">
                {meeting.status === "completed" ? (
                  <>
                    <Button variant="outline" size="sm" leftIcon={<Play className="h-4 w-4" />}>
                      Play Recording
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                      Export Notes
                    </Button>
                  </>
                ) : meeting.status === "scheduled" ? (
                  <Button variant="outline" size="sm">
                    Join Meeting
                  </Button>
                ) : (
                  <Button variant="primary" size="sm">
                    View Live
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
