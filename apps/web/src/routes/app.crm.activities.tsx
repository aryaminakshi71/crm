/**
 * CRM Activities Feed
 *
 * Activity tracking and logging for CRM events.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  TrendingUp,
  Video,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/crm/activities")({
  component: ActivitiesFeed,
});

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "deal" | "task";
  title: string;
  description?: string;
  date: string;
  time: string;
  user: string;
  entityType?: "lead" | "contact" | "deal";
  entityId?: string;
  entityName?: string;
  duration?: string;
  outcome?: string;
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "call",
    title: "Discovery Call with John Smith",
    description: "Discussed enterprise licensing requirements and timeline",
    date: "2024-03-20",
    time: "10:30 AM",
    user: "Sarah Chen",
    entityType: "contact",
    entityId: "1",
    entityName: "John Smith",
    duration: "45 min",
    outcome: "Interested",
  },
  {
    id: "2",
    type: "email",
    title: "Sent Proposal to TechStart Inc",
    description: "Cloud migration project proposal with pricing tiers",
    date: "2024-03-20",
    time: "09:15 AM",
    user: "David Park",
    entityType: "deal",
    entityId: "2",
    entityName: "Cloud Migration Project",
  },
  {
    id: "3",
    type: "meeting",
    title: "Product Demo - Global Industries",
    description: "Full platform demo with engineering team",
    date: "2024-03-19",
    time: "02:00 PM",
    user: "Emily Zhang",
    entityType: "lead",
    entityId: "4",
    entityName: "Emily Wong",
    duration: "60 min",
  },
  {
    id: "4",
    type: "deal",
    title: "Deal Closed: Annual Support Contract",
    description: "Won deal worth $36,000",
    date: "2024-03-19",
    time: "11:30 AM",
    user: "Mike Lee",
    entityType: "deal",
    entityId: "5",
    entityName: "Annual Support Contract",
  },
  {
    id: "5",
    type: "call",
    title: "Follow-up Call - Jennifer Lee",
    description: "Discussed analytics suite requirements",
    date: "2024-03-19",
    time: "10:00 AM",
    user: "Emily Zhang",
    entityType: "contact",
    entityId: "6",
    entityName: "Jennifer Lee",
    duration: "30 min",
    outcome: "Very Interested",
  },
  {
    id: "6",
    type: "email",
    title: "Sequence Email Sent - 3rd step",
    description: "Follow-up sequence to 45 warm leads",
    date: "2024-03-18",
    time: "04:30 PM",
    user: "Sales Team",
  },
  {
    id: "7",
    type: "meeting",
    title: "Contract Review - Acme Corp",
    description: "Legal review meeting for enterprise license",
    date: "2024-03-18",
    time: "02:00 PM",
    user: "Sarah Chen",
    entityType: "deal",
    entityId: "1",
    entityName: "Enterprise SaaS License",
    duration: "90 min",
  },
  {
    id: "8",
    type: "note",
    title: "Note: Budget Approved for Q2",
    description: "Confirmed with CFO - budget approved for new software investments",
    date: "2024-03-17",
    time: "03:45 PM",
    user: "David Park",
    entityType: "lead",
    entityId: "1",
    entityName: "Alex Rivera",
  },
  {
    id: "9",
    type: "task",
    title: "Task Completed: Send case studies",
    description: "Sent 3 case studies to Robert Kim",
    date: "2024-03-17",
    time: "11:00 AM",
    user: "David Park",
    entityType: "contact",
    entityId: "7",
    entityName: "Robert Kim",
  },
  {
    id: "10",
    type: "call",
    title: "Cold Call - Michelle Chang",
    description: "Initial outreach to startup founder",
    date: "2024-03-17",
    time: "10:15 AM",
    user: "David Park",
    entityType: "lead",
    entityId: "2",
    entityName: "Michelle Chang",
    duration: "15 min",
    outcome: "Callback Scheduled",
  },
];

function ActivitiesFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch =
      searchQuery === "" ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.entityName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || activity.type === typeFilter;
    const matchesUser = userFilter === "all" || activity.user === userFilter;

    return matchesSearch && matchesType && matchesUser;
  });

  const activityIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-5 w-5 text-green-600" />,
    email: <Mail className="h-5 w-5 text-blue-600" />,
    meeting: <Video className="h-5 w-5 text-purple-600" />,
    note: <MessageSquare className="h-5 w-5 text-gray-600" />,
    deal: <TrendingUp className="h-5 w-5 text-orange-600" />,
    task: <CheckCircle2 className="h-5 w-5 text-cyan-600" />,
  };

  const activityColors: Record<string, string> = {
    call: "border-l-green-500",
    email: "border-l-blue-500",
    meeting: "border-l-purple-500",
    note: "border-l-gray-500",
    deal: "border-l-orange-500",
    task: "border-l-cyan-500",
  };

  const uniqueUsers = [...new Set(mockActivities.map((a) => a.user))];

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="call">Calls</option>
            <option value="email">Emails</option>
            <option value="meeting">Meetings</option>
            <option value="note">Notes</option>
            <option value="deal">Deals</option>
            <option value="task">Tasks</option>
          </select>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Today's Activities</p>
                <p className="font-bold text-2xl">
                  {mockActivities.filter((a) => a.date === "2024-03-20").length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Calls This Week</p>
                <p className="font-bold text-2xl">
                  {mockActivities.filter((a) => a.type === "call").length}
                </p>
              </div>
              <Phone className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Meetings This Week</p>
                <p className="font-bold text-2xl">
                  {mockActivities.filter((a) => a.type === "meeting").length}
                </p>
              </div>
              <Video className="h-8 w-8 text-purple-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Emails Sent</p>
                <p className="font-bold text-2xl">
                  {mockActivities.filter((a) => a.type === "email").length}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          {Object.keys(groupedActivities).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No activities found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            Object.entries(groupedActivities).map(([date, activities]) => (
              <div key={date} className="mb-8 last:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{date}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 ${activityColors[activity.type]}`}
                    >
                      <div className="rounded-full bg-card p-2 h-fit">
                        {activityIcons[activity.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                            {activity.entityName && (
                              <Link
                                to={
                                  activity.entityType === "contact"
                                    ? `/app/crm/contacts/${activity.entityId}` as string
                                    : activity.entityType === "lead"
                                    ? `/app/crm/leads/${activity.entityId}` as string
                                    : `/app/crm/deals/${activity.entityId}` as string
                                }
                                className="text-xs text-primary hover:underline mt-1 inline-block"
                              >
                                {activity.entityName}
                              </Link>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.user}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {activity.duration && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.duration}
                            </Badge>
                          )}
                          {activity.outcome && (
                            <Badge
                              variant="outline"
                              className={
                                activity.outcome === "Interested" ||
                                activity.outcome === "Very Interested"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : activity.outcome === "Callback Scheduled"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }
                            >
                              {activity.outcome}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
