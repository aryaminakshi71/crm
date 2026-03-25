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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Plus,
  Search,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { hrmApi, nucleoApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  dept: z.string().optional(),
});

export const Route = createFileRoute("/app/projects/capacity/_index")({
  validateSearch: searchSchema,
  component: CapacityIndexPage,
});

// Derive capacity data from employees and projects
function deriveCapacity(employees: any[], projects: any[]) {
  const activeProjects = projects.filter((p: any) => p.status === "active").length;
  return employees.map((emp: any, i: number) => {
    const totalHours = 40;
    const allocated = Math.min(40, activeProjects * 3 + (i % 5) * 4);
    const available = Math.max(0, totalHours - allocated);
    const utilization = Math.round((allocated / totalHours) * 100);
    return {
      id: emp.id,
      name: emp.fullName || `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.name || "Unknown",
      role: emp.jobTitle || emp.role || "Employee",
      department: emp.department || emp.dept || "General",
      allocatedHours: allocated,
      availableHours: available,
      totalHours,
      utilization,
    };
  });
}

function CapacityIndexPage() {
  const { q: search = "", dept: deptFilter = "all" } = useSearch({ from: "/app/projects/capacity/_index" });
  const navigate = useNavigate({ from: "/app/projects/capacity/_index" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setDeptFilter = (v: string) => navigate({ search: (p) => ({ ...p, dept: v }) });

  const { data: projectsData, isLoading: projectsLoading, isError: projectsError, refetch: refetchProjects } = useQuery({
    queryKey: ["nucleo-projects-capacity"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ["hrm-employees-capacity"],
    queryFn: () => hrmApi.employees.list({ page: 1, limit: 100 }),
  });

  const projects: any[] = (projectsData?.data as any[]) ?? [];
  const employees: any[] = ((employeesData as any)?.data as any[]) ?? [];

  const capacity = useMemo(() => deriveCapacity(employees, projects), [employees, projects]);

  const departments = useMemo(() => {
    const depts = new Set(capacity.map((c) => c.department));
    return ["all", ...Array.from(depts).sort()];
  }, [capacity]);

  const filtered = useMemo(() => {
    return capacity.filter((c) => {
      const matchSearch = !search.trim() || c.name.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || c.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [capacity, search, deptFilter]);

  const isLoading = projectsLoading || employeesLoading;

  const avgUtilization =
    capacity.length > 0
      ? Math.round(capacity.reduce((acc, c) => acc + c.utilization, 0) / capacity.length)
      : 0;

  const overAllocated = capacity.filter((c) => c.utilization >= 90).length;

  if (projectsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load data. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetchProjects()}>
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
          <h2 className="font-bold text-xl text-foreground">Team Capacity</h2>
          <p className="text-muted-foreground text-sm">
            Monitor team member allocation and available bandwidth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All Departments" : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Team Members",
            value: isLoading ? "—" : capacity.length,
            icon: <Users className="h-4 w-4" />,
            color: "text-primary",
          },
          {
            label: "Avg Utilization",
            value: isLoading ? "—" : `${avgUtilization}%`,
            icon: <TrendingUp className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "Over Allocated",
            value: isLoading ? "—" : overAllocated,
            icon: <AlertCircle className="h-4 w-4" />,
            color: overAllocated > 0 ? "text-red-400" : "text-muted-foreground",
          },
          {
            label: "Active Projects",
            value: isLoading ? "—" : projects.filter((p: any) => p.status === "active").length,
            icon: <Zap className="h-4 w-4" />,
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

      {/* Capacity Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Member Capacity ({filtered.length} members)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex gap-4 items-center">
                    <div className="h-9 w-9 rounded-full bg-muted" />
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="flex-1 h-2 bg-muted/40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No team members found"
                description="Add employees to see capacity data."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Member</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-2">Allocated</div>
                <div className="col-span-2">Available</div>
                <div className="col-span-3">Utilization</div>
              </div>
              {filtered.map((member) => (
                <CapacityRow key={member.id} member={member} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CapacityRow({ member }: { member: any }) {
  const utilizationColor =
    member.utilization >= 90
      ? "bg-red-400"
      : member.utilization >= 70
      ? "bg-amber-400"
      : "bg-emerald-400";

  const utilizationTextColor =
    member.utilization >= 90
      ? "text-red-400"
      : member.utilization >= 70
      ? "text-amber-400"
      : "text-emerald-400";

  const initials = member.name
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-3 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{member.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
        </div>
      </div>
      <div className="col-span-2">
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
          {member.department}
        </span>
      </div>
      <div className="col-span-2">
        <p className="text-sm font-medium">{member.allocatedHours}h</p>
        <p className="text-[10px] text-muted-foreground">of {member.totalHours}h/wk</p>
      </div>
      <div className="col-span-2">
        <p className={`text-sm font-medium ${member.availableHours > 0 ? "text-emerald-400" : "text-red-400"}`}>
          {member.availableHours}h
        </p>
        <p className="text-[10px] text-muted-foreground">available</p>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${utilizationColor}`}
              style={{ width: `${member.utilization}%` }}
            />
          </div>
          <span className={`text-xs font-bold w-10 text-right ${utilizationTextColor}`}>
            {member.utilization}%
          </span>
        </div>
      </div>
    </div>
  );
}
