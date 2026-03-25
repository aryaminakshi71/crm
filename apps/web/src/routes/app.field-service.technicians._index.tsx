import {
  Badge,
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
import { Search, Star, User, Users, Wrench } from "lucide-react";
import { fieldServiceApi } from "@/lib/api";
import { z } from "zod";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/field-service/technicians/_index")({
  validateSearch: searchSchema,
  component: TechniciansPage,
});

function StatusDot({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "available") return <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />;
  if (s === "on_job") return <span className="h-2.5 w-2.5 rounded-full bg-orange-500 inline-block" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" />;
}

function statusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case "available": return "Available";
    case "on_job": return "On Job";
    case "off_duty": return "Off Duty";
    default: return status ?? "Unknown";
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${star <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating?.toFixed(1) ?? "—"}</span>
    </div>
  );
}

function TechniciansPage() {
  const { q = "", status = "all", page = 1 } = useSearch({ from: "/app/field-service/technicians/_index" });
  const navigate = useNavigate({ from: "/app/field-service/technicians/_index" });
  const search = q;
  const statusFilter = status;
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data, isLoading } = useQuery({
    queryKey: ["field-service", "technicians", page],
    queryFn: () => fieldServiceApi.technicians.list({ page, limit: PAGE_SIZE }),
    refetchInterval: 30000,
  });

  const technicians: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = technicians.filter((t: any) => {
    const matchSearch =
      !search ||
      (t.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.skills ?? []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || t.status?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const availableCount = technicians.filter((t: any) => t.status?.toLowerCase() === "available").length;
  const avgRating =
    technicians.length > 0
      ? (technicians.reduce((acc, t) => acc + (t.rating ?? 0), 0) / technicians.length).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Technicians</h1>
        <p className="text-muted-foreground mt-1">
          Manage your field service technician workforce
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Technicians</p>
                <p className="text-2xl font-bold">{technicians.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available Now</p>
                <p className="text-2xl font-bold">{availableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{avgRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or skill..."
            className="pl-9"
            value={search}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "available", "on_job", "off_duty"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Technicians{" "}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({filtered.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No technicians found"
              description="No technicians match your current filters."
            />
          ) : (
            <div className="divide-y">
              {filtered.map((tech: any) => (
                <div key={tech.id} className="py-4 hover:bg-muted/20 px-2 rounded transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{tech.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StatusDot status={tech.status} />
                          <span className="text-xs text-muted-foreground">
                            {statusLabel(tech.status)}
                          </span>
                          {tech.currentJob && (
                            <span className="text-xs text-muted-foreground">
                              — {tech.currentJob}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(tech.skills ?? []).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              <Wrench className="h-2.5 w-2.5 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {tech.rating != null && <StarRating rating={tech.rating} />}
                      {tech.jobsThisWeek != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {tech.jobsThisWeek} jobs this week
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
