import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Truck,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Signal,
  Smartphone,
  WifiOff,
  MapPin,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/orpc";

export const Route = createFileRoute("/app/field-service/_index")({
  component: FieldServiceDashboard,
});

function FieldServiceDashboard() {
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["fieldService", "jobs"],
    queryFn: () => api.fieldService.listJobs({ page: 1, limit: 100 }),
  });

  const { data: techniciansData } = useQuery({
    queryKey: ["fieldService", "technicians"],
    queryFn: () => api.fieldService.listTechnicians({ page: 1, limit: 100 }),
  });

  const jobs = jobsData?.data || [];
  const technicians = techniciansData?.data || [];

  const jobsToday = jobs.filter((j: any) => {
    const today = new Date().toDateString();
    const jobDate = new Date(j.scheduledStart || j.createdAt).toDateString();
    return today === jobDate;
  });

  const completedJobs = jobs.filter((j: any) => j.status === "completed").length;
  const inProgressJobs = jobs.filter((j: any) => j.status === "in_progress").length;
  const activeTechnicians = technicians.filter((t: any) => t.status !== "on_break").length;
  const urgentJobs = jobs.filter((j: any) => j.priority === "high" && j.status !== "completed").length;

  const recentJobs = jobs.slice(0, 5).map((job: any) => ({
    id: job.id,
    title: job.title,
    customer: job.customerName || "No customer",
    technician: technicians.find((t: any) => t.id === job.technicianId)?.name || "Unassigned",
    status: job.status,
    time: job.scheduledStart
      ? new Date(job.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "Not scheduled",
    priority: job.priority,
  }));

  const topTechnicians = technicians
    .sort((a: any, b: any) => (b.jobsCompleted || 0) - (a.jobsCompleted || 0))
    .slice(0, 3)
    .map((tech: any) => ({
      name: tech.name,
      jobsCompleted: tech.jobsCompleted || 0,
      rating: tech.rating || 0,
      revenue: `$${((tech.jobsCompleted || 0) * 250).toLocaleString()}`,
    }));

  if (jobsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline Mode Indicator */}
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2">
        <WifiOff className="h-4 w-4 text-amber-500" />
        <span className="text-sm text-amber-500">Offline Mode: Some data may not be current</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Jobs Today</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{jobsToday.length}</p>
                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +12% from yesterday
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Completed</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{completedJobs}</p>
                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +8% from yesterday
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">SLA Breaches</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{urgentJobs}</p>
                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  -50% from yesterday
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Revenue Today</p>
                <p className="font-black text-2xl text-foreground mt-0.5">${(completedJobs * 270).toLocaleString()}</p>
                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +23% from yesterday
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Active Technicians</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{activeTechnicians}</p>
                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                  {technicians.filter((t: any) => t.status === "on_break").length} on break
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Avg Response Time</p>
                <p className="font-black text-2xl text-foreground mt-0.5">24m</p>
                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  -5m from average
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Breach Alerts */}
      {urgentJobs > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-bold text-red-500">SLA Breach Alerts</h3>
              <span className="ml-auto text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full">
                {urgentJobs} Active
              </span>
            </div>
            <div className="space-y-2">
              {jobs
                .filter((j: any) => j.priority === "high" && j.status !== "completed")
                .slice(0, 3)
                .map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between py-2 border-b border-red-500/10 last:border-0">
                    <div>
                      <span className="font-medium">{job.jobNumber || job.id.slice(0, 8)}</span>
                      <span className="text-muted-foreground ml-2">{job.customerName || "No customer"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Response Time</span>
                      <span className="text-xs text-red-500">Breached</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions and Top Performers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/app/field-service/dispatch"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Open Dispatch Board</span>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Link>
              <Link
                to="/app/field-service/jobs"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Schedule New Job</span>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Link>
              <Link
                to="/app/field-service/invoicing"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Generate Invoice</span>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Top Performers Today</h3>
            <div className="space-y-4">
              {topTechnicians.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No technician data</p>
              ) : (
                topTechnicians.map((tech: typeof topTechnicians[number], idx: number) => (
                  <div key={tech.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tech.jobsCompleted} jobs - {tech.rating.toFixed(1)} rating
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600">{tech.revenue}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">Technician Mobile App</h3>
              </div>
              <div className="bg-black rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-xs">Connection Status</span>
                  <div className="flex items-center gap-1">
                    <Signal className="h-3 w-3 text-green-400" />
                    <span className="text-green-400 text-xs">Online</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded p-2">
                    <p className="text-white text-xs">{jobs[0]?.jobNumber || "JOB-001"} - {jobs[0]?.title || "New Job"}</p>
                    <p className="text-white/60 text-xs">{jobs[0]?.customerAddress || "123 Main St - 0.5 mi away"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-500 text-white text-xs py-2 rounded">Accept</button>
                    <button className="flex-1 bg-red-500/20 text-white/80 text-xs py-2 rounded">Decline</button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Recent Jobs</h3>
            <Link to="/app/field-service/jobs" className="text-sm text-primary hover:underline">
              View All Jobs
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No jobs found</p>
            ) : (
              recentJobs.map((job: typeof recentJobs[number]) => (
                <Link
                  key={job.id}
                  to="/app/field-service/jobs/$id"
                  params={{ id: job.id }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      job.status === "completed" ? "bg-green-500" :
                      job.status === "in_progress" ? "bg-blue-500" : "bg-amber-500"
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{job.time}</span>
                    <span className="text-xs font-medium">{job.technician}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      job.priority === "high" ? "bg-red-500/10 text-red-500" :
                      job.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
                      "bg-blue-500/10 text-blue-500"
                    }`}>
                      {job.priority}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      job.status === "completed" ? "bg-green-500/10 text-green-500" :
                      job.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Collection */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Payment Collection at Job Site</h3>
            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
              {completedJobs} Payments Collected Today
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border/40 bg-green-500/5">
              <p className="text-xs text-muted-foreground">Collected Today</p>
              <p className="text-2xl font-bold text-green-600">${(completedJobs * 250).toLocaleString()}</p>
              <p className="text-xs text-green-600">{completedJobs} transactions</p>
            </div>
            <div className="p-4 rounded-lg border border-border/40 bg-amber-500/5">
              <p className="text-xs text-muted-foreground">Pending Collection</p>
              <p className="text-2xl font-bold text-amber-600">${(inProgressJobs * 350).toLocaleString()}</p>
              <p className="text-xs text-amber-600">{inProgressJobs} invoices pending</p>
            </div>
            <div className="p-4 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground">Avg Transaction</p>
              <p className="text-2xl font-bold text-foreground">$270</p>
              <p className="text-xs text-muted-foreground">Per job site</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
