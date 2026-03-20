/**
 * CRM Lead Detail
 *
 * Detailed view of a single lead with score breakdown and activities.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Star,
  Target,
  Trash2,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/crm/leads/$id")({
  component: LeadDetail,
});

function LeadDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  // Mock lead data
  const lead = {
    id,
    name: "Alex Rivera",
    email: "alex.r@techventures.com",
    phone: "+1 (555) 111-2222",
    company: "Tech Ventures LLC",
    jobTitle: "CTO",
    location: "San Francisco, CA",
    website: "techventures.com",
    source: "Website",
    status: "qualified" as const,
    score: 92,
    scoreBreakdown: {
      engagement: { score: 30, max: 35, label: "Engagement", description: "Website visits, email opens, content downloads" },
      firmographics: { score: 35, max: 40, label: "Firmographics", description: "Company size, industry, revenue" },
      demographic: { score: 27, max: 25, label: "Demographics", description: "Job title, seniority, decision-making authority" },
    },
    assignedTo: "Sarah Chen",
    createdAt: "2024-03-10",
    lastActivity: "2024-03-15",
    estimatedValue: 150000,
    notes: "Highly engaged prospect. Visited pricing page 5 times in the last week. Downloaded ROI calculator. Responded to email within 2 hours. Perfect fit for enterprise tier.",
    tags: ["hot-lead", "enterprise", "decision-maker", "tech"],
    activities: [
      {
        id: "1",
        type: "page_view",
        title: "Viewed Pricing Page",
        description: "Enterprise tier pricing viewed for 3 minutes",
        date: "2024-03-15",
        user: "System",
      },
      {
        id: "2",
        type: "email",
        title: "Opened Email: Product Demo Invite",
        date: "2024-03-14",
        user: "Sales Team",
      },
      {
        id: "3",
        type: "download",
        title: "Downloaded ROI Calculator",
        date: "2024-03-13",
        user: "System",
      },
      {
        id: "4",
        type: "email",
        title: "Replied to Outreach Email",
        description: "Interested in scheduling a demo this week",
        date: "2024-03-12",
        user: "Alex Rivera",
      },
      {
        id: "5",
        type: "form",
        title: "Submitted Contact Form",
        date: "2024-03-10",
        user: "System",
      },
    ],
    deals: [
      { id: "1", name: "Enterprise SaaS License", value: 150000, stage: "Qualified" },
    ],
  };

  const statusConfig = {
    new: { label: "New", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Zap },
    contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Mail },
    qualified: { label: "Qualified", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    unqualified: { label: "Unqualified", color: "bg-gray-100 text-gray-700 border-gray-200", icon: XCircle },
  };

  const activityIcons: Record<string, React.ReactNode> = {
    page_view: <Globe className="h-4 w-4 text-blue-600" />,
    email: <Mail className="h-4 w-4 text-purple-600" />,
    download: <TrendingUp className="h-4 w-4 text-green-600" />,
    form: <Target className="h-4 w-4 text-orange-600" />,
    call: <Phone className="h-4 w-4 text-green-600" />,
    meeting: <Calendar className="h-4 w-4 text-purple-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/crm/leads" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl text-foreground">{lead.name}</h1>
            <Badge variant="outline" className={statusConfig[lead.status].color}>
              {statusConfig[lead.status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {lead.jobTitle} at {lead.company}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
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
          {/* Lead Score Card */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Lead Score</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      lead.score >= 80
                        ? "bg-green-100 text-green-700 border-green-200"
                        : lead.score >= 50
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }
                  >
                    {lead.score >= 80 ? "Hot Lead" : lead.score >= 50 ? "Warm Lead" : "Cold Lead"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={
                        lead.score >= 80
                          ? "#22c55e"
                          : lead.score >= 50
                          ? "#eab308"
                          : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeDasharray={`${(lead.score / 100) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{lead.score}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">Total Score: {lead.score}/100</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on engagement, firmographics, and demographic factors
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Star className="h-4 w-4 mr-2" />
                    Recalculate Score
                  </Button>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-4">
                {Object.entries(lead.scoreBreakdown).map(([key, data]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm">{data.label}</span>
                        <p className="text-xs text-muted-foreground">{data.description}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {data.score}/{data.max}
                      </span>
                    </div>
                    <Progress value={(data.score / data.max) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${lead.email}`} className="text-sm hover:text-primary">
                      {lead.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:${lead.phone}`} className="text-sm hover:text-primary">
                      {lead.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a
                      href={`https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary flex items-center gap-1"
                    >
                      {lead.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">{lead.location}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lead.activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-muted p-2">
                        {activityIcons[activity.type]}
                      </div>
                      {index < lead.activities.length - 1 && (
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
                        {activity.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                <Target className="h-4 w-4 mr-2" />
                Convert to Deal
              </Button>
            </CardContent>
          </Card>

          {/* Lead Stats */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Lead Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Source</span>
                <Badge variant="secondary">{lead.source}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <span className="text-sm font-medium">{lead.assignedTo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{lead.createdAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Est. Value</span>
                <span className="text-sm font-semibold">
                  ${(lead.estimatedValue / 1000).toFixed(0)}K
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{lead.notes}</p>
              <Button variant="ghost" size="sm" className="mt-2">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Notes
              </Button>
            </CardContent>
          </Card>

          {/* Deal */}
          {lead.deals.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Related Deal</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/app/crm/deals/${lead.deals[0].id}` as string}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm">{lead.deals[0].name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline">{lead.deals[0].stage}</Badge>
                    <span className="font-semibold">
                      ${(lead.deals[0].value / 1000).toFixed(0)}K
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
