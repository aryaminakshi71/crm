import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  User,
  Truck,
  Navigation,
  Clock,
  Phone,
  AlertCircle,
  Layers,
  ZoomIn,
  ZoomOut,
  Locate,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service/dispatch/map")({
  component: MapView,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const MOCK_TECHNICIANS = [
  { id: 1, name: "John Smith", lat: 40.7128, lng: -74.006, status: "available", job: null },
  { id: 2, name: "Jane Doe", lat: 40.7580, lng: -73.9855, status: "on_job", job: "JOB-1042" },
  { id: 3, name: "Mike Wilson", lat: 40.7484, lng: -73.9857, status: "on_break", job: null },
  { id: 4, name: "Sarah Johnson", lat: 40.7614, lng: -73.9776, status: "available", job: null },
  { id: 5, name: "Tom Brown", lat: 40.7282, lng: -73.9942, status: "on_job", job: "JOB-1039" },
  { id: 6, name: "Lisa Chen", lat: 40.7527, lng: -73.9772, status: "available", job: null },
];

const MOCK_JOBS = [
  { id: "JOB-1043", title: "HVAC System Check", lat: 40.7200, lng: -74.0100, priority: "high", status: "unassigned" },
  { id: "JOB-1044", title: "Electrical Inspection", lat: 40.7400, lng: -73.9900, priority: "medium", status: "unassigned" },
  { id: "JOB-1045", title: "Plumbing Repair", lat: 40.7300, lng: -74.0000, priority: "low", status: "unassigned" },
  { id: "JOB-1046", title: "Generator Maintenance", lat: 40.7550, lng: -73.9800, priority: "medium", status: "unassigned" },
];

function MapView() {
  const { data: techData } = useQuery({
    queryKey: ["field-service-technicians"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/field-service/technicians`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch technicians");
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const { data: jobsData } = useQuery({
    queryKey: ["field-service-jobs-map"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/field-service/jobs`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const technicians = (techData as any)?.data ?? [];
  const jobs = (jobsData as any)?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Live Map View</h2>
          <p className="text-sm text-muted-foreground">
            Real-time technician tracking and job locations
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors">
            <Layers className="h-4 w-4" />
            Layers
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors">
            <Navigation className="h-4 w-4" />
            Optimize Routes
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20" style={{ height: "600px" }}>
        {/* Map Background (Simulated) */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-primary/5">
          {/* Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Simulated Map Markers */}
          <div className="absolute inset-0 p-8">
            {/* Technician Markers */}
            {technicians.map((tech: any, idx: any) => {
              const left = 15 + (idx % 3) * 25;
              const top = 20 + Math.floor(idx / 3) * 35;
              return (
                <div
                  key={tech.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <div className={`relative ${
                    tech.status === "available" ? "text-green-500" :
                    tech.status === "on_job" ? "text-blue-500" :
                    "text-amber-500"
                  }`}>
                    <div className="w-10 h-10 rounded-full bg-current/20 flex items-center justify-center animate-pulse">
                      {tech.status === "on_job" ? (
                        <Truck className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-muted-foreground capitalize">{tech.status.replace("_", " ")}</p>
                        {tech.job && <p className="text-primary">{tech.job}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Job Markers */}
            {jobs.map((job: any, idx: any) => {
              const left = 35 + (idx % 2) * 30;
              const top = 30 + idx * 20;
              return (
                <div
                  key={job.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <div className={`relative ${
                    job.priority === "high" ? "text-red-500" :
                    job.priority === "medium" ? "text-amber-500" :
                    "text-blue-500"
                  }`}>
                    <div className="w-8 h-8 rounded-full bg-current/20 flex items-center justify-center">
                      <MapPin className="h-4 w-4" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                        <p className="font-medium">{job.title}</p>
                        <p className="text-muted-foreground">{job.id}</p>
                        <p className={`capitalize ${
                          job.priority === "high" ? "text-red-400" :
                          job.priority === "medium" ? "text-amber-400" :
                          "text-blue-400"
                        }`}>{job.priority} Priority</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Route Lines (Simulated) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 15 20 Q 25 35 35 30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-primary/50" />
              <path d="M 40 55 Q 55 45 65 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-blue-500/50" />
            </svg>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors">
            <Locate className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur border border-border rounded-lg p-3">
          <p className="text-xs font-medium text-foreground mb-2">Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">On Job</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">On Break</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">High Priority</span>
            </div>
          </div>
        </div>

        {/* Real-time Indicator */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur border border-border rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium">Live</span>
          <span className="text-xs text-muted-foreground">{technicians.length} technicians tracked</span>
        </div>
      </div>

      {/* Technician Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {technicians.slice(0, 3).map((tech: any) => (
          <Card key={tech.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  tech.status === "available" ? "bg-green-500/20 text-green-500" :
                  tech.status === "on_job" ? "bg-blue-500/20 text-blue-500" :
                  "bg-amber-500/20 text-amber-500"
                }`}>
                  {tech.status === "on_job" ? <Truck className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{tech.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tech.status.replace("_", " ")}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              {tech.job && (
                <div className="mt-3 p-2 rounded-lg bg-blue-500/10">
                  <div className="flex items-center gap-2 text-xs text-blue-500">
                    <Clock className="h-3 w-3" />
                    <span>Currently: {tech.job}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">AI Dispatch Suggestion</p>
              <p className="text-xs text-muted-foreground">
                Assign JOB-1043 to John Smith - closest available technician, saves 12 min travel time
              </p>
            </div>
            <button className="ml-auto px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
              Apply
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
