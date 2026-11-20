import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Camera,
  Signature,
  CheckCircle2,
  AlertTriangle,
  Package,
  DollarSign,
  MessageSquare,
  Play,
  Check,
  User,
  Wrench,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/orpc";

export const Route = createFileRoute("/app/field-service/jobs/$id")({
  component: JobDetail,
});

function JobDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["fieldService", "job", id],
    queryFn: () => api.fieldService.getJob({ id }),
  });

  const startMutation = useMutation({
    mutationFn: () => api.fieldService.startJob({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fieldService", "job", id] });
      queryClient.invalidateQueries({ queryKey: ["fieldService", "jobs"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => api.fieldService.completeJob({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fieldService", "job", id] });
      queryClient.invalidateQueries({ queryKey: ["fieldService", "jobs"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Job not found</p>
        <Link to="/app/field-service/jobs" className="text-primary hover:underline mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const statusColor =
    job.status === "completed" ? "bg-green-500/10 text-green-500" :
    job.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
    job.status === "scheduled" ? "bg-amber-500/10 text-amber-500" :
    "bg-muted/10 text-muted-foreground";

  const priorityColor =
    job.priority === "high" || job.priority === "urgent" ? "bg-red-500/10 text-red-500" :
    job.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
    "bg-blue-500/10 text-blue-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/field-service/jobs" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{job.jobNumber || job.id.slice(0, 8)}</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor}`}>
              {job.status?.replace("_", " ")}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${priorityColor}`}>
              {job.priority} priority
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{job.title}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <MessageSquare className="h-4 w-4" />
            Message
          </button>
          {job.status === "in_progress" ? (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {completeMutation.isPending ? "Completing..." : "Complete Job"}
            </button>
          ) : job.status === "scheduled" ? (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {startMutation.isPending ? "Starting..." : "Start Job"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Job Information</h3>
              <div className="space-y-4">
                {job.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{job.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Scheduled Start</p>
                    <p className="text-sm">
                      {job.scheduledStart
                        ? new Date(job.scheduledStart).toLocaleString()
                        : "Not scheduled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Scheduled End</p>
                    <p className="text-sm">
                      {job.scheduledEnd
                        ? new Date(job.scheduledEnd).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  {job.actualStart && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Actual Start</p>
                      <p className="text-sm">{new Date(job.actualStart).toLocaleString()}</p>
                    </div>
                  )}
                  {job.actualEnd && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Actual End</p>
                      <p className="text-sm">{new Date(job.actualEnd).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {job.tags && job.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {job.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-muted/50 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {job.notes && (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-3">Notes</h3>
                <p className="text-sm text-muted-foreground">{job.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Proof of Service */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Proof of Service</h3>
                <button className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <Camera className="h-3 w-3" />
                  Add Photo
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="aspect-square rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center hover:bg-muted/30 transition-colors">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Customer Signature</h4>
                  <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Signature className="h-3 w-3" />
                    Capture Signature
                  </button>
                </div>
                <div className="h-24 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No signature captured yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Customer</h3>
              <div className="space-y-3">
                {job.customerName && (
                  <p className="font-medium">{job.customerName}</p>
                )}
                {job.customerAddress && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{job.customerAddress}</span>
                  </div>
                )}
                {job.customerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{job.customerPhone}</span>
                  </div>
                )}
                {job.customerEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{job.customerEmail}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technician */}
          {job.technicianId && (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4">Technician</h3>
                <Link
                  to="/app/field-service/technicians/$id"
                  params={{ id: job.technicianId }}
                  className="flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary hover:underline">View Profile</p>
                    <p className="text-xs text-muted-foreground">{job.technicianId}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Invoice & Payment */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Invoice</h3>
                <Link to="/app/field-service/invoicing" className="text-xs text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Labor</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>—</span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <DollarSign className="h-4 w-4" />
                  Generate Invoice
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
