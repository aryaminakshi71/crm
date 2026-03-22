/**
 * CRM Deal Detail
 *
 * Detailed view of a single deal with activity timeline.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { dealsApi } from "../lib/api";

export const Route = createFileRoute("/app/crm/deals/$id")({
  component: DealDetail,
});

const MOCK_DEAL = {
  id: "",
  title: "Enterprise SaaS License",
  company: "Acme Corporation",
  contact: "John Smith",
  contactEmail: "john.smith@acmecorp.com",
  contactPhone: "+1 (555) 123-4567",
  value: 125000,
  stage: "negotiation" as const,
  probability: 75,
  expectedClose: "2024-04-15",
  createdAt: "2024-02-01",
  lastActivity: "2024-03-15",
  owner: "Sarah Chen",
  description: "Enterprise license agreement for Acme Corporation's engineering team.",
  nextStep: "Awaiting legal review of contract terms",
  tags: ["enterprise", "hot", "multi-year"],
  activities: [
    { id: "1", type: "stage_change", title: "Stage changed to Negotiation", description: "Deal moved from Proposal to Negotiation", date: "2024-03-15", user: "Sarah Chen" },
    { id: "2", type: "email", title: "Sent Proposal Document", date: "2024-03-10", user: "Sales Team" },
  ],
  timeline: [
    { date: "2024-02-01", title: "Lead Created", stage: "lead" },
    { date: "2024-02-15", title: "Qualified", stage: "qualified" },
    { date: "2024-03-05", title: "Proposal Sent", stage: "proposal" },
    { date: "2024-03-15", title: "Negotiation", stage: "negotiation" },
  ],
};

function DealDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<"timeline" | "details" | "files">("timeline");

  const { data: apiDeal, isLoading, isError } = useQuery({
    queryKey: ["deals", id],
    queryFn: () => dealsApi.get(id),
    retry: false,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-7 w-64 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="h-48 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const raw = apiDeal ?? (isError ? { ...MOCK_DEAL, id } : MOCK_DEAL);

  const deal: {
    id: string;
    title: string;
    company: string;
    contact: string;
    contactEmail: string;
    contactPhone: string;
    value: number;
    stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
    probability: number;
    expectedClose: string;
    createdAt: string;
    lastActivity: string;
    owner: string;
    description: string;
    nextStep: string;
    tags: string[];
    activities: Array<{ id: string; type: string; title: string; description?: string; date: string; user: string }>;
    timeline: Array<{ date: string; title: string; stage: string }>;
  } = {
    id: raw.id ?? id,
    title: raw.name ?? raw.title ?? MOCK_DEAL.title,
    company: raw.companyName ?? raw.company ?? MOCK_DEAL.company,
    contact: raw.contactName ?? raw.contact ?? MOCK_DEAL.contact,
    contactEmail: raw.contactEmail ?? MOCK_DEAL.contactEmail,
    contactPhone: raw.contactPhone ?? MOCK_DEAL.contactPhone,
    value: typeof raw.value === "string" ? parseFloat(raw.value) || 0 : (raw.value ?? MOCK_DEAL.value),
    stage: raw.stage ?? MOCK_DEAL.stage,
    probability: raw.probability ?? MOCK_DEAL.probability,
    expectedClose: raw.expectedCloseDate ?? raw.expectedClose ?? MOCK_DEAL.expectedClose,
    createdAt: raw.createdAt ? String(raw.createdAt).slice(0, 10) : MOCK_DEAL.createdAt,
    lastActivity: raw.updatedAt ? String(raw.updatedAt).slice(0, 10) : MOCK_DEAL.lastActivity,
    owner: raw.ownerName ?? raw.owner ?? MOCK_DEAL.owner,
    description: raw.notes ?? raw.description ?? MOCK_DEAL.description,
    nextStep: raw.nextStep ?? MOCK_DEAL.nextStep,
    tags: raw.tags ?? MOCK_DEAL.tags,
    activities: raw.activities ?? MOCK_DEAL.activities,
    timeline: raw.timeline ?? MOCK_DEAL.timeline,
  };

  const stageColors: Record<string, string> = {
    lead: "bg-purple-500",
    qualified: "bg-blue-500",
    proposal: "bg-cyan-500",
    negotiation: "bg-yellow-500",
    closed_won: "bg-green-500",
    closed_lost: "bg-red-500",
  };

  const stageLabels: Record<string, string> = {
    lead: "Lead",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };

  const activityIcons: Record<string, React.ReactNode> = {
    stage_change: <TrendingUp className="h-4 w-4 text-blue-600" />,
    meeting: <Calendar className="h-4 w-4 text-purple-600" />,
    email: <Mail className="h-4 w-4 text-green-600" />,
    call: <Phone className="h-4 w-4 text-orange-600" />,
    note: <MessageSquare className="h-4 w-4 text-gray-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/crm/deals" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl text-foreground">{deal.title}</h1>
            <Badge
              variant="outline"
              className={
                deal.stage === "closed_won"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : deal.stage === "closed_lost"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
              }
            >
              {stageLabels[deal.stage]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {deal.company} · {deal.contact}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Progress */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Deal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">${(deal.value / 1000).toFixed(0)}K</span>
                <span className="text-sm text-muted-foreground">
                  {deal.probability}% probability
                </span>
              </div>
              <Progress value={deal.probability} className="h-3 mb-6" />

              {/* Timeline */}
              <div className="flex items-center justify-between">
                {deal.timeline.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full ${stageColors[item.stage]} flex items-center justify-center`}
                      >
                        {index === deal.timeline.length - 1 ? (
                          <Clock className="h-4 w-4 text-white" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <p className="text-xs mt-2 font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    {index < deal.timeline.length - 1 && (
                      <div className="w-[80px] h-0.5 bg-border mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "timeline"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Activity Timeline
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Deal Details
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "files"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Files & Documents
              </button>
            </nav>
          </div>

          {/* Activity Timeline Tab */}
          {activeTab === "timeline" && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {deal.activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-muted p-2">
                          {activityIcons[activity.type]}
                        </div>
                        {index < deal.activities.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.date} · {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Deal Details Tab */}
          {activeTab === "details" && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{deal.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Next Step</p>
                    <p className="text-sm text-muted-foreground">{deal.nextStep}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Expected Close</p>
                      <p className="text-sm text-muted-foreground">{deal.expectedClose}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Created</p>
                      <p className="text-sm text-muted-foreground">{deal.createdAt}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {deal.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No files uploaded yet</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deal Value */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">${(deal.value / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground mt-1">Deal Value</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold">${((deal.value * deal.probability) / 100 / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Weighted</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{deal.probability}%</p>
                  <p className="text-xs text-muted-foreground">Probability</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to={`/app/crm/contacts/${deal.contact}` as string}
                className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{deal.contact}</p>
                  <p className="text-xs text-muted-foreground">{deal.company}</p>
                </div>
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${deal.contactEmail}`} className="hover:text-primary">
                  {deal.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${deal.contactPhone}`} className="hover:text-primary">
                  {deal.contactPhone}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Deal Info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Deal Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Owner</span>
                <span className="text-sm font-medium">{deal.owner}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expected Close</span>
                <span className="text-sm">{deal.expectedClose}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span className="text-sm">{deal.lastActivity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{deal.createdAt}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
