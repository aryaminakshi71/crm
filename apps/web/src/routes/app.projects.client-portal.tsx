import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  MessageSquare,
  Plus,
  Search,
  Share2,
  Shield,
  TrendingUp,
  User,
  Users,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { nucleoApi } from "@/lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/client-portal")({
  component: ClientPortalPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type ClientProject = {
  id: string;
  name: string;
  clientName: string;
  status: "active" | "completed" | "on_hold";
  progress: number;
  lastUpdated: string;
  nextMilestone?: string;
  nextMilestoneDate?: string;
};

type ClientAccess = {
  id: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  accessLevel: "view" | "comment" | "full";
  invitedAt: string;
  lastViewed?: string;
};

type PortalActivity = {
  id: string;
  projectId: string;
  action: string;
  user: string;
  timestamp: string;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function ClientPortalPage() {
  const [search, setSearch] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [newInvite, setNewInvite] = useState({
    clientName: "",
    clientEmail: "",
    projectId: "",
    accessLevel: "view" as ClientAccess["accessLevel"],
  });

  // Fetch real projects from API
  const { data: projectsData, isError, refetch} = useQuery({
    queryKey: ["nucleo-projects-client-portal"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const rawProjects = projectsData?.data ?? [];

  // Map API projects to ClientProject shape
  const clientProjects: ClientProject[] = rawProjects.map((p: any) => ({
    id: p.id,
    name: p.name,
    clientName: p.clientName ?? p.description?.split(" ")[0] ?? "External Client",
    status: (p.status === "completed" ? "completed" : p.status === "on_hold" ? "on_hold" : "active") as ClientProject["status"],
    progress: p.progress ?? 0,
    lastUpdated: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
  }));

  // Mock client accesses
  const clientAccesses: ClientAccess[] = [
    { id: "a1", projectId: "p1", clientName: "John Smith", clientEmail: "john@acme.com", accessLevel: "full", invitedAt: "2024-01-05", lastViewed: "2024-01-15" },
    { id: "a2", projectId: "p1", clientName: "Jane Doe", clientEmail: "jane@acme.com", accessLevel: "view", invitedAt: "2024-01-06", lastViewed: "2024-01-14" },
    { id: "a3", projectId: "p2", clientName: "Bob Wilson", clientEmail: "bob@techstart.com", accessLevel: "comment", invitedAt: "2024-01-10", lastViewed: "2024-01-14" },
  ];

  // Mock portal activity
  const portalActivity: PortalActivity[] = [
    { id: "1", projectId: "p1", action: "Viewed project dashboard", user: "John Smith", timestamp: "2024-01-15 10:30" },
    { id: "2", projectId: "p1", action: "Downloaded progress report", user: "Jane Doe", timestamp: "2024-01-15 09:15" },
    { id: "3", projectId: "p2", action: "Left comment on task", user: "Bob Wilson", timestamp: "2024-01-14 16:45" },
    { id: "4", projectId: "p1", action: "Approved milestone", user: "John Smith", timestamp: "2024-01-14 11:20" },
  ];

  // Filter
  const filteredProjects = clientProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  // Get access level badge
  const getAccessBadge = (level: string) => {
    switch (level) {
      case "full":
        return <Badge variant="primary">Full Access</Badge>;
      case "comment":
        return <Badge variant="warning">Comment</Badge>;
      default:
        return <Badge variant="default">View Only</Badge>;
    }
  };

  // Stats
  const totalClients = new Set(clientAccesses.map((a) => a.clientEmail)).size;
  const activePortals = clientProjects.filter((p) => p.status === "active").length;
  const viewsThisWeek = 47;
  const commentsThisWeek = 12;

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Client Portal</h2>
          <p className="text-muted-foreground text-sm">
            Share project progress with clients securely
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Invite Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePortals}</p>
                <p className="text-xs text-muted-foreground">Active Portals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{viewsThisWeek}</p>
                <p className="text-xs text-muted-foreground">Views This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{commentsThisWeek}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Portal Engagement (Last 8 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={[
                { week: "W1", views: 18, comments: 4, downloads: 3 },
                { week: "W2", views: 24, comments: 6, downloads: 5 },
                { week: "W3", views: 19, comments: 3, downloads: 2 },
                { week: "W4", views: 31, comments: 8, downloads: 7 },
                { week: "W5", views: 27, comments: 5, downloads: 4 },
                { week: "W6", views: 38, comments: 10, downloads: 9 },
                { week: "W7", views: 42, comments: 11, downloads: 8 },
                { week: "W8", views: 47, comments: 12, downloads: 11 },
              ]}
            >
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#6366f1" fill="url(#viewsGrad)" strokeWidth={2} name="Views" />
              <Area type="monotone" dataKey="comments" stroke="#10b981" fill="none" strokeWidth={2} name="Comments" />
              <Area type="monotone" dataKey="downloads" stroke="#f59e0b" fill="none" strokeWidth={2} name="Downloads" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Client Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Client Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
              />
            </div>

            {/* Projects List */}
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.clientName}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        project.status === "active"
                          ? "success"
                          : project.status === "completed"
                            ? "default"
                            : "warning"
                      }
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {project.lastUpdated}
                    </div>
                    {project.nextMilestone && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {project.nextMilestone} ({project.nextMilestoneDate})
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredProjects.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No projects found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Access & Activity */}
        <div className="space-y-4">
          {/* Client Access */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Client Access</CardTitle>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientAccesses.map((access) => (
                <div
                  key={access.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {access.clientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {access.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {access.clientEmail}
                    </p>
                    {getAccessBadge(access.accessLevel)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portalActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} · {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Secure Sharing</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All client access is secured with role-based permissions.
                    Clients can only view content you explicitly share.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Portal Preview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">What Clients See</CardTitle>
          <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
            Preview Portal
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Progress Dashboard</p>
              <p className="text-xs text-muted-foreground">Real-time updates</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm font-medium">Milestones</p>
              <p className="text-xs text-muted-foreground">Key dates & goals</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-cyan-400/10 flex items-center justify-center mx-auto mb-2">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-sm font-medium">Documents</p>
              <p className="text-xs text-muted-foreground">Shared files</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-5 w-5 text-warning" />
              </div>
              <p className="text-sm font-medium">Feedback</p>
              <p className="text-xs text-muted-foreground">Leave comments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <FormModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Client"
        onSubmit={(e) => {
          e.preventDefault();
          // Handle invite
          setIsInviteModalOpen(false);
          setNewInvite({
            clientName: "",
            clientEmail: "",
            projectId: "",
            accessLevel: "view",
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Client Name" required>
            <Input
              value={newInvite.clientName}
              onChange={(e) =>
                setNewInvite((i) => ({ ...i, clientName: e.target.value }))
              }
              placeholder="Enter client name..."
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={newInvite.clientEmail}
              onChange={(e) =>
                setNewInvite((i) => ({ ...i, clientEmail: e.target.value }))
              }
              placeholder="client@company.com"
            />
          </FormField>
          <FormField label="Project" required>
            <select
              value={newInvite.projectId}
              onChange={(e) =>
                setNewInvite((i) => ({ ...i, projectId: e.target.value }))
              }
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="">Select project...</option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Access Level">
            <select
              value={newInvite.accessLevel}
              onChange={(e) =>
                setNewInvite((i) => ({
                  ...i,
                  accessLevel: e.target.value as ClientAccess["accessLevel"],
                }))
              }
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="view">View Only</option>
              <option value="comment">Can Comment</option>
              <option value="full">Full Access</option>
            </select>
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
