import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wrench,
  TrendingUp,
  Clock,
  AlertCircle,
  Edit,
  MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/orpc";

export const Route = createFileRoute("/app/field-service/technicians/$id")({
  component: TechnicianDetail,
});

function TechnicianDetail() {
  const { id } = Route.useParams();

  const { data: technician, isLoading } = useQuery({
    queryKey: ["fieldService", "technician", id],
    queryFn: () => api.fieldService.getTechnician({ id }),
  });

  const { data: jobsData } = useQuery({
    queryKey: ["fieldService", "jobs", "technician", id],
    queryFn: () =>
      api.fieldService.listJobs({ page: 1, limit: 10, technicianId: id }),
    enabled: !!id,
  });

  const recentJobs = jobsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-48 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Technician not found</p>
        <Link to="/app/field-service/technicians" className="text-primary hover:underline mt-2 inline-block">
          Back to Technicians
        </Link>
      </div>
    );
  }

  const initials = technician.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/app/field-service/technicians"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">Technician Details</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
          <Edit className="h-4 w-4" />
          Edit
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <MessageSquare className="h-4 w-4" />
          Message
        </button>
      </div>

      {/* Profile Card */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">{initials}</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{technician.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="font-medium">{(technician.rating || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-sm text-muted-foreground">
                      {technician.jobsCompleted || 0} jobs completed
                    </span>
                  </div>
                </div>
                <span className={`rounded-full px-4 py-1 text-sm font-medium ${
                  technician.status === "available" ? "bg-green-500/10 text-green-500" :
                  technician.status === "on_job" ? "bg-blue-500/10 text-blue-500" :
                  "bg-amber-500/10 text-amber-500"
                }`}>
                  {(technician.status || "unknown").replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {technician.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{technician.email}</span>
                  </div>
                )}
                {technician.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{technician.phone}</span>
                  </div>
                )}
                {technician.specialization && (
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{technician.specialization}</span>
                  </div>
                )}
              </div>

              {technician.skills && technician.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {technician.skills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{(technician.rating || 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{technician.jobsCompleted || 0}</p>
            <p className="text-xs text-muted-foreground">Jobs Completed</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{technician.maxJobsPerDay || 5}</p>
            <p className="text-xs text-muted-foreground">Max Jobs/Day</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{recentJobs.length}</p>
            <p className="text-xs text-muted-foreground">Recent Jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Recent Jobs</h3>
            <div className="space-y-3">
              {recentJobs.map((job: any) => (
                <Link
                  key={job.id}
                  to="/app/field-service/jobs/$id"
                  params={{ id: job.id }}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    job.status === "completed" ? "bg-green-500" :
                    job.status === "in_progress" ? "bg-blue-500" : "bg-amber-500"
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.customerName || "No customer"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === "completed" ? "bg-green-500/10 text-green-500" :
                    job.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                    "bg-amber-500/10 text-amber-500"
                  }`}>
                    {job.status?.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
