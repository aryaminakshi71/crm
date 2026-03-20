/**
 * Webinar Management
 *
 * Manage webinars, registrations, and virtual events.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Globe,
  GraduationCap,
  Mail,
  MessageCircle,
  Monitor,
  Plus,
  RefreshCw,
  Trash2,
  User,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/marketing/webinars")({
  component: WebinarManagement,
});

const webinars = [
  {
    id: "1",
    title: "Product Demo: Advanced Features",
    status: "upcoming",
    date: "2026-03-25",
    time: "2:00 PM EST",
    duration: 60,
    registered: 234,
    capacity: 500,
    presenter: "Sarah Chen",
    type: "product",
  },
  {
    id: "2",
    title: "Q1 Industry Trends 2026",
    status: "live",
    date: "2026-03-20",
    time: "11:00 AM EST",
    duration: 90,
    registered: 456,
    capacity: 500,
    presenter: "Michael Roberts",
    type: "industry",
    attendees: 312,
  },
  {
    id: "3",
    title: "Getting Started with Our Platform",
    status: "completed",
    date: "2026-03-15",
    time: "3:00 PM EST",
    duration: 45,
    registered: 189,
    capacity: 200,
    presenter: "Emily Watson",
    type: "onboarding",
    attendees: 156,
    recording: true,
  },
  {
    id: "4",
    title: "Enterprise Solutions Deep Dive",
    status: "upcoming",
    date: "2026-04-02",
    time: "1:00 PM EST",
    duration: 75,
    registered: 89,
    capacity: 100,
    presenter: "David Kim",
    type: "enterprise",
  },
  {
    id: "5",
    title: "Integration Workshop",
    status: "completed",
    date: "2026-03-10",
    time: "10:00 AM EST",
    duration: 120,
    registered: 145,
    capacity: 150,
    presenter: "Jessica Brown",
    type: "workshop",
    attendees: 138,
    recording: true,
  },
];

function WebinarManagement() {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const [selectedWebinar, setSelectedWebinar] = useState<string | null>(null);

  const filteredWebinars = webinars.filter((webinar) => {
    if (activeTab === "all") return true;
    return webinar.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "primary" | "outline"> = {
      live: "success",
      upcoming: "primary",
      completed: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/marketing">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Webinar Management</h2>
            <p className="text-sm text-muted-foreground">Host and manage virtual events</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Schedule Webinar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Webinars" value="12" icon={<Video className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Upcoming" value="2" icon={<Calendar className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Total Registrations" value="1,847" icon={<User className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Avg Attendance" value="78%" icon={<CheckCircle className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "all", label: "All Webinars" },
            { id: "upcoming", label: "Upcoming" },
            { id: "live", label: "Live Now" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Webinar List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredWebinars.map((webinar) => (
          <Card
            key={webinar.id}
            className={`cursor-pointer transition-colors ${selectedWebinar === webinar.id ? "border-primary" : "hover:border-primary/50"}`}
            onClick={() => setSelectedWebinar(webinar.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{webinar.title}</h3>
                      {getStatusBadge(webinar.status)}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(webinar.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {webinar.time} ({webinar.duration} min)
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {webinar.presenter}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {webinar.registered}/{webinar.capacity} registered
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="capitalize">{webinar.type}</Badge>
                  {webinar.recording && (
                    <Badge variant="secondary">
                      <VideoOff className="mr-1 h-3 w-3" />
                      Recording
                    </Badge>
                  )}
                  <div className="mt-2 flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Registration</span>
                  <span>{Math.round((webinar.registered / webinar.capacity) * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${webinar.registered / webinar.capacity > 0.8 ? "bg-amber-400" : "bg-primary"}`}
                    style={{ width: `${(webinar.registered / webinar.capacity) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Webinar Detail */}
      {selectedWebinar && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Registration Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-4">
                <h4 className="font-medium">Registration Sources</h4>
                <SourceBar label="Email Campaign" value={45} />
                <SourceBar label="Website" value={28} />
                <SourceBar label="Social Media" value={18} />
                <SourceBar label="Direct Link" value={9} />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Attendee Demographics</h4>
                <SourceBar label="Enterprise" value={42} />
                <SourceBar label="Mid-Market" value={35} />
                <SourceBar label="SMB" value={23} />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Engagement Metrics</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Q&A Questions</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Poll Responses</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Chat Messages</span>
                  <span className="font-medium">89</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
