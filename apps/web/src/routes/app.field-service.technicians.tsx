import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  Users,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/orpc";
import { useState } from "react";

export const Route = createFileRoute("/app/field-service/technicians")({
  component: Technicians,
});

function Technicians() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["fieldService", "technicians", statusFilter],
    queryFn: () =>
      api.fieldService.listTechnicians({
        page: 1,
        limit: 100,
        ...(statusFilter && { status: statusFilter }),
      }),
  });

  const technicians = (data?.data || []).filter((tech: any) =>
    search
      ? tech.name?.toLowerCase().includes(search.toLowerCase()) ||
        tech.email?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Technician Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage field technicians, skills, and performance
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Technician
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search technicians..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="on_job">On Job</option>
          <option value="on_break">On Break</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Technicians Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : technicians.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No technicians found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech: any) => (
            <Card key={tech.id} className="border-border/60 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <Link
                        to="/app/field-service/technicians/$id"
                        params={{ id: tech.id }}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {tech.name}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{(tech.rating || 0).toFixed(1)}</span>
                        <span className="mx-1">-</span>
                        <span>{tech.jobsCompleted || 0} jobs</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-muted rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {tech.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{tech.email}</span>
                    </div>
                  )}
                  {tech.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{tech.phone}</span>
                    </div>
                  )}
                  {tech.currentLocation && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {typeof tech.currentLocation === "object"
                          ? tech.currentLocation.address || "Location updated"
                          : tech.currentLocation}
                      </span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {tech.skills && tech.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tech.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
                  <div>
                    <p className="text-xs text-muted-foreground">Jobs Completed</p>
                    <p className="font-bold text-green-600">{tech.jobsCompleted || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max/Day</p>
                    <p className="font-medium text-foreground">{tech.maxJobsPerDay || 5}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    tech.status === "available" ? "bg-green-500/10 text-green-500" :
                    tech.status === "on_job" ? "bg-blue-500/10 text-blue-500" :
                    tech.status === "on_break" ? "bg-amber-500/10 text-amber-500" :
                    "bg-muted/10 text-muted-foreground"
                  }`}>
                    {(tech.status || "unknown").replace("_", " ")}
                  </span>
                  <Link
                    to="/app/field-service/technicians/$id"
                    params={{ id: tech.id }}
                    className="text-xs text-primary hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
