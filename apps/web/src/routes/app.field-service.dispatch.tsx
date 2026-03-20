import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Truck,
  MapPin,
  Clock,
  User,
  Phone,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Filter,
  Plus,
  ArrowRightLeft,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/orpc";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { SkeletonCard } from "@crm/ui";
import { useState } from "react";

export const Route = createFileRoute("/app/field-service/dispatch")({
  component: () => (
    <ErrorBoundaryWrapper>
      <DispatchBoard />
    </ErrorBoundaryWrapper>
  ),
});

function DispatchBoard() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Fetch dispatch data
  const { data: dispatchData, isLoading } = useQuery({
    queryKey: ["fieldService", "dispatch", selectedDate],
    queryFn: () => api.fieldService.getDispatchBoard({ date: selectedDate }),
  });

  // Fetch technicians for assignment dropdown
  const { data: techniciansData } = useQuery({
    queryKey: ["fieldService", "technicians"],
    queryFn: () => api.fieldService.listTechnicians({ page: 1, limit: 100 }),
  });

  // Assign job mutation
  const assignJobMutation = useMutation({
    mutationFn: ({ jobId, technicianId }: { jobId: string; technicianId: string }) =>
      api.fieldService.assignJob({ id: jobId, technicianId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fieldService", "dispatch"] });
    },
  });

  const technicians = techniciansData?.data || [];
  const jobs = dispatchData?.jobs || [];

  // Calculate stats from real data
  const availableTechs = technicians.filter((t: any) => t.status === "available").length;
  const onJobTechs = technicians.filter((t: any) => t.status === "on_job").length;
  const onBreakTechs = technicians.filter((t: any) => t.status === "on_break").length;
  const unassignedJobs = jobs.filter((j: any) => !j.technicianId);
  const scheduledJobs = jobs.filter((j: any) => j.technicianId);

  // Helper to get technician name by ID
  const getTechName = (techId: string | null) => {
    if (!techId) return "Unassigned";
    const tech = technicians.find((t: any) => t.id === techId);
    return tech?.name || "Unknown";
  };

  // Handle assign button click
  const handleAssign = (jobId: string, technicianId: string) => {
    if (technicianId) {
      assignJobMutation.mutate({ jobId, technicianId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Dispatch Board</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Dispatch Board</h2>
          <p className="text-sm text-muted-foreground">
            Smart dispatch with AI route optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/app/field-service/dispatch/map"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Map View
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/20 p-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Available</p>
                <p className="font-bold text-xl">{availableTechs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2">
                <Truck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">On Job</p>
                <p className="font-bold text-xl">{onJobTechs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted/30 p-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">On Break</p>
                <p className="font-bold text-xl">{onBreakTechs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-500/20 p-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Unassigned</p>
                <p className="font-bold text-xl">{unassignedJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Route Optimization Banner */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/20 p-2">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI Route Optimization Active</p>
                <p className="text-xs text-muted-foreground">Estimated 23% reduction in travel time</p>
              </div>
            </div>
            <button className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition-colors">
              Optimize Routes
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Dispatch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technicians Column */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Technicians</h3>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Filter
              </button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {technicians.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No technicians found</p>
              ) : (
                technicians.map((tech: any) => (
                  <div
                    key={tech.id}
                    className="p-4 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{tech.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            tech.status === "available" ? "bg-green-500/10 text-green-500" :
                            tech.status === "on_job" ? "bg-blue-500/10 text-blue-500" :
                            "bg-amber-500/10 text-amber-500"
                          }`}>
                            {(tech.status || "unknown").replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(tech.skills || []).join(", ")} - {(tech.rating || 0).toFixed(1)} rating
                        </p>
                        {tech.currentJob && (
                          <p className="text-xs text-blue-500 mt-1">Working on: {tech.currentJob}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Jobs Column */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Unassigned Jobs</h3>
              <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full">
                {unassignedJobs.length} urgent
              </span>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {unassignedJobs.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No unassigned jobs</p>
              ) : (
                unassignedJobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-lg border border-border/40 bg-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.customerName || "No customer"}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        job.priority === "high" ? "bg-red-500/10 text-red-500" :
                        job.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {job.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.customerAddress || "No address"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.scheduledStart ? new Date(job.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not scheduled"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 rounded-lg border border-border bg-muted/50 px-2 py-2 text-xs"
                        onChange={(e) => handleAssign(job.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="">Assign technician...</option>
                        {technicians.filter((t: any) => t.status === "available").map((tech: any) => (
                          <option key={tech.id} value={tech.id}>{tech.name}</option>
                        ))}
                      </select>
                      <button
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                        disabled={assignJobMutation.isPending}
                      >
                        {assignJobMutation.isPending ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Jobs Timeline */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            {scheduledJobs.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No scheduled jobs for today</p>
            ) : (
              scheduledJobs.map((job: any) => (
                <div key={job.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/40">
                  <div className="w-16 text-center">
                    <p className="text-xs text-muted-foreground">
                      {job.scheduledStart ? new Date(job.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    job.status === "completed" ? "bg-green-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.customerAddress || "No address"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getTechName(job.technicianId)}</span>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    job.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                  }`}>
                    {job.status === "completed" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "In Progress"
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
