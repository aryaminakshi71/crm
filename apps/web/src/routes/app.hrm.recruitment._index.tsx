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
  Briefcase,
  Calendar,
  MapPin,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { hrmApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/hrm/recruitment/_index")({
  validateSearch: searchSchema,
  component: RecruitmentIndexPage,
});

const STATUS_BADGE: Record<string, "primary" | "success" | "warning" | "danger" | "default"> = {
  open: "primary",
  active: "primary",
  filled: "success",
  closed: "default",
  paused: "warning",
  cancelled: "danger",
};

function RecruitmentIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", status = "all", page = 1 } = useSearch({ from: "/app/hrm/recruitment/_index" });
  const navigate = useNavigate({ from: "/app/hrm/recruitment" });
  const search = q;
  const statusFilter = status;
  const setSearch = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val, page: 1 }) });
  const setStatusFilter = (val: string) => navigate({ search: (prev) => ({ ...prev, status: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });
  const [deptFilter, setDeptFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrm-recruitment-index", page],
    queryFn: () => (hrmApi as any).recruitment.list({ page, limit: PAGE_SIZE }),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => (hrmApi as any).recruitment.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-recruitment-index"] });
      toast.success("Job posting created");
    },
    onError: () => toast.error("Failed to create job posting"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => (hrmApi as any).recruitment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-recruitment-index"] });
      toast.success("Job posting deleted");
    },
    onError: () => toast.error("Failed to delete job posting"),
  });

  const postings: any[] = (data?.data as any[]) ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const departments = useMemo(() => {
    const depts = new Set(postings.map((p: any) => p.department || "General"));
    return ["all", ...Array.from(depts).sort()];
  }, [postings]);

  const filtered = useMemo(() => {
    return postings.filter((p: any) => {
      const matchSearch =
        !search.trim() ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.jobTitle?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchDept = deptFilter === "all" || (p.department || "General") === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [postings, search, statusFilter, deptFilter]);

  const openPositions = postings.filter((p: any) => p.status === "open" || p.status === "active").length;

  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
  const recentApplications = postings.reduce(
    (acc, p: any) => acc + (p.recentApplications ?? p.applicationsThisWeek ?? 0),
    0,
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load recruitment data. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Job Posting?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteMut.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Recruitment</h2>
          <p className="text-muted-foreground text-sm">
            Manage job postings, applications, and hiring pipelines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search positions..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="active">Active</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All Departments" : d}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Post Job
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Open Positions",
            value: isLoading ? "—" : openPositions,
            icon: <Briefcase className="h-4 w-4" />,
            color: "text-primary",
          },
          {
            label: "Applications This Week",
            value: isLoading ? "—" : recentApplications,
            icon: <TrendingUp className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "Total Postings",
            value: isLoading ? "—" : postings.length,
            icon: <Users className="h-4 w-4" />,
            color: "text-cyan-400",
          },
          {
            label: "Filled This Month",
            value: isLoading ? "—" : postings.filter((p: any) => p.status === "filled").length,
            icon: <AlertCircle className="h-4 w-4" />,
            color: "text-amber-400",
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

      {/* Job Postings */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Job Postings ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-4 items-center">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-5 w-16 bg-muted/50 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No job postings"
                description='Post a job opening to start recruiting.'
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Job Title</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">Applications</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Posted</div>
                <div className="col-span-1"></div>
              </div>
              {filtered.map((posting: any) => (
                <JobPostingRow
                  key={posting.id}
                  posting={posting}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function JobPostingRow({ posting, onDelete }: { posting: any; onDelete: (id: string, name: string) => void }) {
  const title = posting.title || posting.jobTitle || "Untitled";
  const department = posting.department || "General";
  const location = posting.location || posting.workLocation || "Remote";
  const applications = posting.applicationsCount ?? posting.applications ?? 0;
  const postedDate = posting.postedAt || posting.createdAt
    ? new Date(posting.postedAt ?? posting.createdAt).toLocaleDateString()
    : "—";

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="font-medium text-sm truncate">{title}</p>
        </div>
      </div>
      <div className="col-span-2">
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
          {department}
        </span>
      </div>
      <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{location}</span>
      </div>
      <div className="col-span-2 flex items-center gap-1.5 text-sm">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{applications}</span>
      </div>
      <div className="col-span-1">
        <Badge variant={STATUS_BADGE[posting.status] ?? "default"}>
          {posting.status ?? "—"}
        </Badge>
      </div>
      <div className="col-span-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3 shrink-0" />
        <span>{postedDate}</span>
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          onClick={() => onDelete(posting.id, title)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Delete job posting"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
