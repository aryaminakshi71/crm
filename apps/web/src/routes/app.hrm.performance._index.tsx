import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Star,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { hrmApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/hrm/performance/_index")({
  validateSearch: searchSchema,
  component: PerformanceIndexPage,
});

const STATUS_BADGE: Record<string, "warning" | "primary" | "success" | "default"> = {
  pending: "warning",
  in_progress: "primary",
  completed: "success",
  draft: "default",
};

function StarRating({ score }: { score: number }) {
  const rounded = Math.round(score);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rounded ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-foreground">{score.toFixed(1)}</span>
    </div>
  );
}

function PerformanceIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", status = "all", page = 1 } = useSearch({ from: "/app/hrm/performance/_index" });
  const navigate = useNavigate({ from: "/app/hrm/performance/_index" });
  const search = q;
  const statusFilter = status;
  const setSearch = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val, page: 1 }) });
  const setStatusFilter = (val: string) => navigate({ search: (prev) => ({ ...prev, status: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrm-performance-index", page],
    queryFn: () => (hrmApi as any).performance.list({ page, limit: PAGE_SIZE }),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => (hrmApi as any).performance.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-performance-index"] });
      toast.success("Performance review created");
    },
    onError: () => toast.error("Failed to create review"),
  });

  const reviews: any[] = (data?.data as any[]) ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const employee = r.employeeName || r.employee?.name || "";
      const matchSearch = !search.trim() || employee.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reviews, search, statusFilter]);

  const completedReviews = reviews.filter((r) => r.status === "completed");
  const pendingReviews = reviews.filter((r) => r.status === "pending" || r.status === "in_progress");
  const avgScore =
    completedReviews.length > 0
      ? completedReviews.reduce((acc, r) => acc + (r.overallScore ?? r.score ?? 3), 0) /
        completedReviews.length
      : 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load performance data. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Performance Reviews</h2>
          <p className="text-muted-foreground text-sm">
            Manage employee performance reviews and feedback cycles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Review
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Reviews Completed",
            value: isLoading ? "—" : completedReviews.length,
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "Avg Score",
            value: isLoading ? "—" : avgScore > 0 ? `${avgScore.toFixed(1)}/5` : "—",
            icon: <Star className="h-4 w-4" />,
            color: "text-amber-400",
          },
          {
            label: "Pending Reviews",
            value: isLoading ? "—" : pendingReviews.length,
            icon: <Clock className="h-4 w-4" />,
            color: pendingReviews.length > 0 ? "text-amber-400" : "text-muted-foreground",
          },
          {
            label: "Total Reviews",
            value: isLoading ? "—" : reviews.length,
            icon: <TrendingUp className="h-4 w-4" />,
            color: "text-primary",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-xl bg-muted/30 p-2.5 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reviews Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Reviews ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-4 items-center">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-5 w-20 bg-muted/50 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No reviews found"
                description="Create performance reviews to get started."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Employee</div>
                <div className="col-span-2">Review Period</div>
                <div className="col-span-2">Reviewer</div>
                <div className="col-span-3">Overall Score</div>
                <div className="col-span-2">Status</div>
              </div>
              {filtered.map((review) => {
                const employee = review.employeeName || review.employee?.name || "Unknown";
                const period = review.reviewPeriod || review.period || "—";
                const reviewer = review.reviewerName || review.reviewer?.name || "—";
                const score = review.overallScore ?? review.score ?? null;

                return (
                  <div
                    key={review.id}
                    className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm truncate">{employee}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">{period}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">{reviewer}</p>
                    </div>
                    <div className="col-span-3">
                      {score != null ? (
                        <StarRating score={Number(score)} />
                      ) : (
                        <span className="text-xs text-muted-foreground">Not scored</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Badge variant={STATUS_BADGE[review.status] ?? "default"}>
                        {review.status ?? "—"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
