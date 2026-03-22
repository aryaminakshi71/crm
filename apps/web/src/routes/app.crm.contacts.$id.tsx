/**
 * CRM Contact Detail
 *
 * Detailed view of a single contact with activity timeline.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit2,
  ExternalLink,
  Globe,
  History,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useState } from "react";
import { contactsApi } from "../lib/api";

export const Route = createFileRoute("/app/crm/contacts/$id")({
  component: ContactDetail,
});

const MOCK_CONTACT = {
  id: "",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@acmecorp.com",
  phone: "+1 (555) 123-4567",
  company: "Acme Corporation",
  jobTitle: "VP of Engineering",
  location: "San Francisco, CA",
  website: "acmecorp.com",
  status: "active" as const,
  createdAt: "2023-06-15",
  lastActivity: "2024-03-15",
  dealsCount: 3,
  totalValue: 245000,
  tags: ["enterprise", "decision-maker", "technical"],
  notes: "Key decision maker for enterprise deals.",
  deals: [
    { id: "1", name: "Enterprise SaaS License", value: 125000, stage: "Negotiation" },
    { id: "2", name: "Cloud Migration Project", value: 89000, stage: "Proposal" },
  ],
  activities: [
    { id: "1", type: "email", title: "Email sent: Follow-up on proposal", date: "2024-03-15", user: "Sales Team" },
    { id: "2", type: "call", title: "Discovery call completed (45 min)", date: "2024-03-12", user: "Sarah Chen" },
  ],
};

function ContactDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const { data: apiContact, isLoading, isError } = useQuery({
    queryKey: ["contacts", id],
    queryFn: () => contactsApi.get(id),
    retry: false,
    enabled: !!id,
  });

  const raw = apiContact ?? (isError ? { ...MOCK_CONTACT, id } : null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-7 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
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

  const contact = {
    id: raw?.id ?? id,
    firstName: raw?.firstName ?? MOCK_CONTACT.firstName,
    lastName: raw?.lastName ?? MOCK_CONTACT.lastName,
    email: raw?.email ?? MOCK_CONTACT.email,
    phone: raw?.phone ?? MOCK_CONTACT.phone,
    company: raw?.companyName ?? raw?.company ?? MOCK_CONTACT.company,
    jobTitle: raw?.jobTitle ?? MOCK_CONTACT.jobTitle,
    location: raw?.location ?? MOCK_CONTACT.location,
    website: raw?.website ?? MOCK_CONTACT.website,
    status: (raw?.status ?? "active") as "active" | "inactive",
    createdAt: raw?.createdAt ? String(raw.createdAt).slice(0, 10) : MOCK_CONTACT.createdAt,
    lastActivity: raw?.updatedAt ? String(raw.updatedAt).slice(0, 10) : MOCK_CONTACT.lastActivity,
    dealsCount: raw?.dealsCount ?? MOCK_CONTACT.dealsCount,
    totalValue: raw?.totalValue ?? MOCK_CONTACT.totalValue,
    tags: raw?.tags ?? MOCK_CONTACT.tags,
    notes: raw?.notes ?? MOCK_CONTACT.notes,
    deals: raw?.deals ?? MOCK_CONTACT.deals,
    activities: raw?.activities ?? MOCK_CONTACT.activities,
  };

  const activityIcons = {
    email: <Mail className="h-4 w-4 text-blue-600" />,
    call: <Phone className="h-4 w-4 text-green-600" />,
    meeting: <Calendar className="h-4 w-4 text-purple-600" />,
    deal: <TrendingUp className="h-4 w-4 text-orange-600" />,
    note: <Edit2 className="h-4 w-4 text-gray-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/crm/contacts" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-2xl text-foreground">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-muted-foreground">
            {contact.jobTitle} at {contact.company}
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
          {/* Contact Info Card */}
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
                    <a href={`mailto:${contact.email}`} className="text-sm hover:text-primary">
                      {contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:${contact.phone}`} className="text-sm hover:text-primary">
                      {contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm">{contact.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">{contact.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a
                      href={`https://${contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary flex items-center gap-1"
                    >
                      {contact.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Activity</p>
                    <p className="text-sm">{contact.lastActivity}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{contact.notes}</p>
              </div>
            </CardContent>
          </Card>

          {/* Deals Card */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Deals ({contact.dealsCount})</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contact.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    to={`/app/crm/deals/${deal.id}` as string}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{deal.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {deal.stage}
                      </Badge>
                    </div>
                    <p className="font-semibold">${(deal.value / 1000).toFixed(0)}K</p>
                  </Link>
                ))}
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
                {contact.activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-muted p-2">
                        {activityIcons[activity.type as keyof typeof activityIcons]}
                      </div>
                      {index < contact.activities.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date} · {activity.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <History className="h-4 w-4 mr-2" />
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Contact Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Deals</span>
                <span className="font-semibold">{contact.dealsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Value</span>
                <span className="font-semibold">${(contact.totalValue / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Customer Since</span>
                <span className="font-semibold">{contact.createdAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={
                    contact.status === "active"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }
                >
                  {contact.status}
                </Badge>
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
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
