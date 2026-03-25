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
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { hrmApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/hrm/training/_index")({
  validateSearch: searchSchema,
  component: TrainingIndexPage,
});

const STATUS_BADGE: Record<string, "primary" | "success" | "warning" | "default"> = {
  active: "primary",
  completed: "success",
  draft: "default",
  upcoming: "warning",
  archived: "default",
};

function TrainingIndexPage() {
  const queryClient = useQueryClient();
  const { q: search = "", status: statusFilter = "all" } = useSearch({ from: "/app/hrm/training/_index" });
  const navigate = useNavigate({ from: "/app/hrm/training/_index" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrm-training-index"],
    queryFn: () => (hrmApi as any).training.list(),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => (hrmApi as any).training.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-training-index"] });
      toast.success("Training course created");
    },
    onError: () => toast.error("Failed to create training course"),
  });

  const courses: any[] = (data?.data as any[]) ?? [];

  const filtered = useMemo(() => {
    return courses.filter((c: any) => {
      const matchSearch =
        !search.trim() ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [courses, search, statusFilter]);

  const activeCourses = courses.filter((c: any) => c.status === "active");

  const thisMonth = new Date().toISOString().slice(0, 7);
  const completionsThisMonth = courses.reduce((acc, c: any) => {
    if (!c.completedAt?.startsWith(thisMonth)) return acc;
    return acc + (c.completedCount ?? 0);
  }, 0);

  const avgCompletionRate =
    courses.length > 0
      ? Math.round(
          courses.reduce((acc, c: any) => acc + (c.completionRate ?? c.completion ?? 0), 0) /
            courses.length,
        )
      : 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load training data. Please try again.</p>
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
          <h2 className="font-bold text-xl text-foreground">Training & Development</h2>
          <p className="text-muted-foreground text-sm">
            Manage training courses, enrollments, and completion tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Course
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Active Courses",
            value: isLoading ? "—" : activeCourses.length,
            icon: <BookOpen className="h-4 w-4" />,
            color: "text-primary",
          },
          {
            label: "Completions This Month",
            value: isLoading ? "—" : completionsThisMonth,
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "Avg Completion Rate",
            value: isLoading ? "—" : `${avgCompletionRate}%`,
            icon: <Award className="h-4 w-4" />,
            color: "text-amber-400",
          },
          {
            label: "Total Courses",
            value: isLoading ? "—" : courses.length,
            icon: <GraduationCap className="h-4 w-4" />,
            color: "text-cyan-400",
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

      {/* Courses Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Courses ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-4 items-center">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-2 flex-1 bg-muted/40 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No training courses"
                description="Create your first training course to get started."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Course</div>
                <div className="col-span-2">Instructor</div>
                <div className="col-span-2">Enrolled</div>
                <div className="col-span-3">Completion Rate</div>
                <div className="col-span-2">Status</div>
              </div>
              {filtered.map((course: any) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CourseRow({ course }: { course: any }) {
  const name = course.title || course.name || "Untitled";
  const instructor = course.instructor || course.instructorName || "—";
  const enrolled = course.enrolledCount ?? course.enrolled ?? course.participants ?? 0;
  const completionRate = course.completionRate ?? course.completion ?? 0;

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="font-medium text-sm truncate">{name}</p>
        </div>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-muted-foreground truncate">{instructor}</p>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{enrolled}</span>
        </div>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                completionRate >= 80
                  ? "bg-emerald-400"
                  : completionRate >= 50
                  ? "bg-amber-400"
                  : "bg-primary"
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-xs font-bold w-10 text-right">{completionRate}%</span>
        </div>
      </div>
      <div className="col-span-2">
        <Badge variant={STATUS_BADGE[course.status] ?? "default"}>
          {course.status ?? "—"}
        </Badge>
      </div>
    </div>
  );
}
