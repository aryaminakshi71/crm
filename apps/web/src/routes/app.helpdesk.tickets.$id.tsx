/**
 * Ticket Detail
 *
 * Detailed view of a support ticket with timeline and actions.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Edit,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Send,
  User,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/tickets/$id")({
  component: TicketDetail,
});

const timelineEvents = [
  { id: "1", type: "created", content: "Ticket created by Sarah Chen", timestamp: "2 hours ago", author: "Sarah Chen" },
  { id: "2", type: "note", content: "Customer confirmed they reset password but still cannot access account.", timestamp: "1 hour ago", author: "John Doe (Agent)" },
  { id: "3", type: "status", content: "Status changed from Open to Pending", timestamp: "45 minutes ago", author: "John Doe (Agent)" },
  { id: "4", type: "reply", content: "Hi Sarah, I've checked your account and it appears the password reset wasn't completed properly. Could you try resetting again using the link we just sent to your email?", timestamp: "30 minutes ago", author: "John Doe (Agent)" },
  { id: "5", type: "reply", content: "Thank you! I just reset it again and it's working now. Really appreciate the quick help!", timestamp: "10 minutes ago", author: "Sarah Chen" },
];

const attachments = [
  { name: "screenshot.png", size: "245 KB", type: "image" },
  { name: "error-log.txt", size: "12 KB", type: "text" },
];

function TicketDetail() {
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("high");

  const ticket = {
    id: "TKT-001",
    subject: "Cannot login to dashboard after password reset",
    status: "pending",
    priority: "high",
    channel: "email",
    requester: "Sarah Chen",
    requesterEmail: "sarah.chen@acmecorp.com",
    assignedTo: "John Doe",
    createdAt: "2 hours ago",
    updatedAt: "30 minutes ago",
    description: "I recently requested a password reset for my account but after resetting the password, I'm still unable to log in. I've tried multiple times but keep getting an 'Invalid credentials' error. This is urgent as I need to access important reports for a meeting today.",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => history.back()}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xl text-foreground">{ticket.id}</h2>
              <Badge variant="warning">{ticket.status}</Badge>
              <Badge variant="danger">{ticket.priority}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
            Edit
          </Button>
          <Button variant="outline" size="sm" leftIcon={<MoreHorizontal className="h-4 w-4" />}>
            More
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{ticket.description}</p>
              {attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.name} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">({attachment.size})</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineEvents.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    event.type === "reply" ? "bg-primary/10" : event.type === "note" ? "bg-amber-500/10" : "bg-muted"
                  }`}>
                    {event.type === "reply" ? (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    ) : event.type === "note" ? (
                      <Edit className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{event.author}</span>
                      <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{event.content}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reply Box */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" leftIcon={<Paperclip className="h-4 w-4" />}>
                        Attach
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<Lock className="h-4 w-4" />}>
                        Internal
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Save Draft
                      </Button>
                      <Button variant="primary" size="sm" leftIcon={<Send className="h-4 w-4" />}>
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PropertyRow label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex h-8 w-full rounded-lg border border-border bg-card px-2 text-sm">
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </PropertyRow>
              <PropertyRow label="Priority">
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="flex h-8 w-full rounded-lg border border-border bg-card px-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </PropertyRow>
              <PropertyRow label="Channel">
                <span className="text-sm capitalize">{ticket.channel}</span>
              </PropertyRow>
              <PropertyRow label="Assignee">
                <select defaultValue={ticket.assignedTo} className="flex h-8 w-full rounded-lg border border-border bg-card px-2 text-sm">
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>Mike Wilson</option>
                  <option>Unassigned</option>
                </select>
              </PropertyRow>
            </CardContent>
          </Card>

          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 font-medium">
                  SC
                </div>
                <div>
                  <p className="font-medium text-sm">{ticket.requester}</p>
                  <p className="text-xs text-muted-foreground">{ticket.requesterEmail}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  +1 (555) 123-4567
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">First Response</span>
                <span className="font-medium">34 minutes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Response</span>
                <span className="font-medium">28 minutes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Time</span>
                <span className="font-medium">1.2 hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
