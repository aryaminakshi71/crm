import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { MapPin, Navigation, Route as RouteIcon, Search, User } from "lucide-react";
import { z } from "zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { fieldServiceApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["all", "planned", "in_progress", "completed", "cancelled"]).optional(),
});

export const Route = createFileRoute("/app/field-service/routes/_index")({
  validateSearch: searchSchema,
  component: RoutesPage,
});

function statusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "completed": return "bg-green-100 text-green-700";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "planned": return "bg-gray-100 text-gray-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
}

function RoutesPage() {
  const { q = "", status = "all" } = useSearch({ from: "/app/field-service/routes/_index" });
  const navigate = useNavigate({ from: "/app/field-service/routes/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : (v as any) }) });

  const { data, isLoading } = useQuery({
    queryKey: ["field-service", "routes"],
    queryFn: () => fieldServiceApi.routes.list(),
  });

  const allRoutes: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const routes = allRoutes
    .filter((r: any) =>
      !q ||
      (r.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.technicianName ?? r.technician ?? "").toLowerCase().includes(q.toLowerCase()),
    )
    .filter((r: any) => status === "all" || (r.status ?? "").toLowerCase() === status);

  const today = new Date().toDateString();
  const routesToday = allRoutes.filter(
    (r: any) => r.date && new Date(r.date).toDateString() === today,
  ).length;

  const avgStops =
    allRoutes.length > 0
      ? Math.round(allRoutes.reduce((acc, r) => acc + (r.stopsCount ?? r.stops?.length ?? 0), 0) / allRoutes.length)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Routes</h1>
        <p className="text-muted-foreground mt-1">
          Optimized technician routes for efficient job completion
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Routes Today</p>
                <p className="text-2xl font-bold">{routesToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Stops / Route</p>
                <p className="text-2xl font-bold">{avgStops}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Efficiency Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Route Efficiency (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={[
                { day: "Mon", planned: 8, completed: 7, avgDistance: 42 },
                { day: "Tue", planned: 10, completed: 9, avgDistance: 38 },
                { day: "Wed", planned: 12, completed: 11, avgDistance: 45 },
                { day: "Thu", planned: 9, completed: 8, avgDistance: 51 },
                { day: "Fri", planned: 11, completed: 10, avgDistance: 39 },
                { day: "Sat", planned: 6, completed: 6, avgDistance: 28 },
                { day: "Sun", planned: 3, completed: 3, avgDistance: 22 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="planned" fill="#e5e7eb" name="Planned" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#6366f1" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle>All Routes</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search routes..."
                  className="pl-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "planned", "in_progress", "completed", "cancelled"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      status === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "all" ? "All" : s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : routes.length === 0 ? (
            <EmptyState
              title="No routes found"
              description="No routes match your current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Route</th>
                    <th className="pb-3 pr-4 font-medium">Technician</th>
                    <th className="pb-3 pr-4 font-medium">Stops</th>
                    <th className="pb-3 pr-4 font-medium">Distance</th>
                    <th className="pb-3 pr-4 font-medium">Est. Duration</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {routes.map((route: any) => {
                    const stops = route.stopsCount ?? route.stops?.length ?? 0;
                    const distance = route.totalDistance ?? route.distance;
                    const duration = route.estimatedDuration ?? route.duration;
                    return (
                      <tr key={route.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-medium flex items-center gap-2">
                          <RouteIcon className="h-4 w-4 text-primary shrink-0" />
                          {route.name ?? `Route #${(route.id ?? "").slice(0, 6)}`}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {route.technicianName ?? route.technician ?? "Unassigned"}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-center font-medium">{stops}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {distance != null ? `${distance} km` : "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {duration != null ? `${duration} min` : "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">
                          {route.date ? new Date(route.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={statusColor(route.status)}>
                            {(route.status ?? "planned").replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info("Map view coming soon")}
                            className="gap-1.5"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            View Map
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
