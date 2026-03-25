import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Building2,
  Download,
  Grid3X3,
  List,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { hrmApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  dept: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/hrm/directory/_index")({
  validateSearch: searchSchema,
  component: DirectoryIndexPage,
});


function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 50;

function DirectoryIndexPage() {
  const { q = "", dept = "all", page = 1 } = useSearch({ from: "/app/hrm/directory/_index" });
  const navigate = useNavigate({ from: "/app/hrm/directory/_index" });
  const search = q;
  const deptFilter = dept;
  const setSearch = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val, page: 1 }) });
  const setDeptFilter = (val: string) => navigate({ search: (prev) => ({ ...prev, dept: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    department: "",
    workEmail: "",
    phone: "",
  });
  const qc = useQueryClient();

  const EMP_KEY = ["hrm-employees-dir-index", page];

  const addEmployee = useMutation({
    mutationFn: (payload: any) => hrmApi.employees.create(payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: EMP_KEY });
      const previous = qc.getQueryData(EMP_KEY);
      qc.setQueryData(EMP_KEY, (old: any) => ({
        ...old,
        data: [{ ...payload, id: `temp-${Date.now()}`, status: "active" }, ...(old?.data ?? [])],
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(EMP_KEY, ctx.previous);
      toast.error("Failed to add employee");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["hrm-employees-dir-index"] }),
    onSuccess: () => {
      toast.success("Employee added");
      setIsAddOpen(false);
      setNewEmployee({ firstName: "", lastName: "", jobTitle: "", department: "", workEmail: "", phone: "" });
    },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: EMP_KEY,
    queryFn: () => hrmApi.employees.list({ page, limit: PAGE_SIZE }),
  });

  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const employees: any[] = ((data as any)?.data as any[]) ?? [];

  const mapped = useMemo(() =>
    employees.map((emp: any) => ({
      id: emp.id,
      name: emp.fullName || `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "Unknown",
      title: emp.jobTitle || "Employee",
      department: emp.department || "General",
      email: emp.workEmail || emp.email || "—",
      phone: emp.phone || "—",
      status: emp.status || "active",
      initials: (
        (emp.firstName?.[0] ?? emp.name?.[0] ?? "?") +
        (emp.lastName?.[0] ?? emp.name?.split(" ")[1]?.[0] ?? "")
      ).toUpperCase(),
    })),
  [employees]);

  const departments = useMemo(() => {
    const depts = new Set(mapped.map((e) => e.department));
    return ["all", ...Array.from(depts).sort()];
  }, [mapped]);

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mapped.forEach((e) => {
      counts[e.department] = (counts[e.department] ?? 0) + 1;
    });
    return counts;
  }, [mapped]);

  const filtered = useMemo(() => {
    return mapped.filter((e) => {
      const matchSearch =
        !search.trim() ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [mapped, search, deptFilter]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load employees. Please try again.</p>
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
          <h2 className="font-bold text-xl text-foreground">Employee Directory</h2>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Loading..." : `${mapped.length} employees across ${departments.length - 1} departments`}
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
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = ["Name", "Title", "Department", "Email", "Phone", "Status"];
              const rows = filtered.map((e: any) => [
                e.name,
                e.title,
                e.department,
                e.email,
                e.phone,
                e.status,
              ]);
              exportToCsv("employees.csv", headers, rows);
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Department Stats */}
      {!isLoading && deptFilter === "all" && departments.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {departments.slice(1).map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-primary/40 transition-colors"
            >
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{dept}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                {departmentCounts[dept] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-black text-primary mt-0.5">
              {isLoading ? "—" : mapped.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Departments</p>
            <p className="text-2xl font-black text-cyan-400 mt-0.5">
              {isLoading ? "—" : departments.length - 1}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              {isLoading ? "—" : mapped.filter((e) => e.status === "active").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Grid / List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse h-40 rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try adjusting your search or department filter."
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border/40">
            <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
              <div className="col-span-4">Employee</div>
              <div className="col-span-2">Department</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-1">Status</div>
            </div>
            {filtered.map((emp) => (
              <div key={emp.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                <div className="col-span-4 flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{emp.initials}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{emp.title}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">{emp.department}</span>
                </div>
                <div className="col-span-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{emp.phone}</span>
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${emp.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {emp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <FormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Employee"
        submitText="Add Employee"
        loading={addEmployee.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newEmployee.firstName.trim() || !newEmployee.lastName.trim()) {
            toast.error("First and last name are required");
            return;
          }
          addEmployee.mutate({
            firstName: newEmployee.firstName.trim(),
            lastName: newEmployee.lastName.trim(),
            jobTitle: newEmployee.jobTitle.trim() || undefined,
            department: newEmployee.department.trim() || undefined,
            workEmail: newEmployee.workEmail.trim() || undefined,
            phone: newEmployee.phone.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Jane"
                required
              />
            </FormField>
            <FormField label="Last Name" required>
              <Input
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Smith"
                required
              />
            </FormField>
          </div>
          <FormField label="Job Title">
            <Input
              value={newEmployee.jobTitle}
              onChange={(e) => setNewEmployee((p) => ({ ...p, jobTitle: e.target.value }))}
              placeholder="Software Engineer"
            />
          </FormField>
          <FormField label="Department">
            <Input
              value={newEmployee.department}
              onChange={(e) => setNewEmployee((p) => ({ ...p, department: e.target.value }))}
              placeholder="Engineering"
            />
          </FormField>
          <FormField label="Work Email">
            <Input
              type="email"
              value={newEmployee.workEmail}
              onChange={(e) => setNewEmployee((p) => ({ ...p, workEmail: e.target.value }))}
              placeholder="jane@company.com"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function EmployeeCard({ emp }: { emp: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <span className="text-sm font-bold text-primary">{emp.initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{emp.name}</p>
          <p className="text-xs text-muted-foreground truncate">{emp.title}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${emp.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
            {emp.status}
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{emp.department}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{emp.email}</span>
        </div>
        {emp.phone !== "—" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{emp.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
