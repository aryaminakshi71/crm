import { createFileRoute } from "@tanstack/react-router";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  Route as RouteIcon,
  MapPin,
  Clock,
  Navigation,
  Truck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Settings,
  Play,
  RotateCcw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/field-service/routes")({
  component: Routes,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

const MOCK_ROUTES = [
  {
    id: "RT-001",
    name: "Manhattan Morning Route",
    technician: "John Smith",
    status: "active",
    jobs: 6,
    totalDistance: "24.5 mi",
    estimatedDuration: "4h 30m",
    startTime: "8:00 AM",
    jobsCompleted: 2,
    jobsRemaining: 4,
    efficiency: "+18%",
    stops: [
      { id: 1, address: "123 Park Ave", job: "JOB-1043", time: "8:30 AM", status: "completed" },
      { id: 2, address: "456 5th Ave", job: "JOB-1044", time: "9:45 AM", status: "completed" },
      { id: 3, address: "789 Broadway", job: "JOB-1047", time: "11:00 AM", status: "current" },
      { id: 4, address: "321 Madison Ave", job: "JOB-1048", time: "12:30 PM", status: "pending" },
      { id: 5, address: "654 Lexington Ave", job: "JOB-1049", time: "2:00 PM", status: "pending" },
      { id: 6, address: "987 3rd Ave", job: "JOB-1050", time: "3:30 PM", status: "pending" },
    ],
  },
  {
    id: "RT-002",
    name: "Brooklyn Mid-Day Route",
    technician: "Sarah Johnson",
    status: "active",
    jobs: 4,
    totalDistance: "18.2 mi",
    estimatedDuration: "3h 45m",
    startTime: "9:00 AM",
    jobsCompleted: 1,
    jobsRemaining: 3,
    efficiency: "+12%",
    stops: [
      { id: 1, address: "200 Atlantic Ave", job: "JOB-1051", time: "9:30 AM", status: "completed" },
      { id: 2, address: "350 Court St", job: "JOB-1052", time: "10:45 AM", status: "current" },
      { id: 3, address: "500 Flatbush Ave", job: "JOB-1053", time: "12:00 PM", status: "pending" },
      { id: 4, address: "650 Nostrand Ave", job: "JOB-1054", time: "1:30 PM", status: "pending" },
    ],
  },
  {
    id: "RT-003",
    name: "Queens Afternoon Route",
    technician: "Mike Wilson",
    status: "scheduled",
    jobs: 5,
    totalDistance: "22.8 mi",
    estimatedDuration: "4h 00m",
    startTime: "1:00 PM",
    jobsCompleted: 0,
    jobsRemaining: 5,
    efficiency: null,
    stops: [
      { id: 1, address: "100 Queens Blvd", job: "JOB-1055", time: "1:30 PM", status: "scheduled" },
      { id: 2, address: "250 Junction Blvd", job: "JOB-1056", time: "2:45 PM", status: "scheduled" },
      { id: 3, address: "400 Main St", job: "JOB-1057", time: "3:45 PM", status: "scheduled" },
      { id: 4, address: "550 Roosevelt Ave", job: "JOB-1058", time: "4:30 PM", status: "scheduled" },
      { id: 5, address: "700 Flushing Ave", job: "JOB-1059", time: "5:15 PM", status: "scheduled" },
    ],
  },
];

function Routes() {
  const routesQuery = useQuery({
    queryKey: ["field-service", "routes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/field-service/routes?limit=50`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch routes");
      return res.json();
    },
    retry: false,
  });
  if (routesQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => routesQuery.refetch()}>Retry</Button>
    </div>
  );

  const routes = routesQuery.data?.data ?? MOCK_ROUTES;

  if (routesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/40 rounded animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Route Planning</h2>
          <p className="text-sm text-muted-foreground">
            AI-optimized routes for maximum efficiency
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Create Route
          </button>
        </div>
      </div>

      {/* AI Optimization Banner */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/20 p-2">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI Route Optimization</p>
                <p className="text-xs text-muted-foreground">
                  System automatically optimizes routes based on location, traffic, and job priority
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-2xl font-bold text-primary">+15%</p>
                <p className="text-xs text-muted-foreground">Avg efficiency gain</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Optimize All Routes
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <RouteIcon className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Active Routes</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <MapPin className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">15</p>
            <p className="text-xs text-muted-foreground">Total Stops</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Truck className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Technicians</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">12.3h</p>
            <p className="text-xs text-muted-foreground">Total Drive Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {routes.map((route) => (
          <Card key={route.id} className="border-border/60">
            <CardContent className="p-6">
              {/* Route Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RouteIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{route.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        route.status === "active" ? "bg-green-500/10 text-green-500" :
                        route.status === "scheduled" ? "bg-blue-500/10 text-blue-500" :
                        "bg-muted/10 text-muted-foreground"
                      }`}>
                        {route.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {route.technician} - {route.startTime} start
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {route.efficiency && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{route.efficiency}</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-lg font-bold">{route.totalDistance}</p>
                    <p className="text-xs text-muted-foreground">Distance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{route.estimatedDuration}</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                  <div className="flex gap-1">
                    {route.status === "active" ? (
                      <>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                          <Play className="h-4 w-4 text-primary" />
                        </button>
                      </>
                    ) : (
                      <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                        Start Route
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{route.jobsCompleted} of {route.jobs} jobs completed</span>
                  <span>{route.jobsRemaining} remaining</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(route.jobsCompleted / route.jobs) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stops */}
              <div className="space-y-2">
                {route.stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      stop.status === "current" ? "bg-primary/10 border border-primary/30" :
                      stop.status === "completed" ? "bg-green-500/5" :
                      "bg-muted/20"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        stop.status === "completed" ? "bg-green-500" :
                        stop.status === "current" ? "bg-primary" :
                        "bg-muted"
                      }`}>
                        {stop.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <span className="text-xs text-white">{idx + 1}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        stop.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                      }`}>
                        {stop.address}
                      </p>
                      <p className="text-xs text-muted-foreground">{stop.job}</p>
                    </div>
                    <span className={`text-sm ${
                      stop.status === "completed" ? "text-green-500" :
                      stop.status === "current" ? "text-primary font-medium" :
                      "text-muted-foreground"
                    }`}>
                      {stop.time}
                    </span>
                    {stop.status === "pending" && (
                      <button className="p-1 rounded hover:bg-muted transition-colors">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
