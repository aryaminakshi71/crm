import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Mail,
  Phone,
  MoreVertical,
  UserPlus,
  Download,
  Upload,
  ChevronDown,
  Users,
  Loader2,
} from "lucide-react";
import { hrmApi } from "@/lib/api";

export const Route = createFileRoute("/app/hrm/directory")({
  component: EmployeeDirectory,
  loader: async (): Promise<{ data: any[] }> => {
    const result = await hrmApi.employees.list({ limit: 100 });
    return result as any;
  },
});

const defaultEmployees = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    dept: "Engineering",
    email: "sarah.chen@nucleo.one",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    status: "Active",
    avatar: "SC",
    startDate: "Jan 15, 2023",
    manager: "David Park",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Product Manager",
    dept: "Product",
    email: "marcus.johnson@nucleo.one",
    phone: "+1 (555) 234-5678",
    location: "New York, NY",
    status: "Active",
    avatar: "MJ",
    startDate: "Mar 10, 2026",
    manager: "Emily Watson",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "UX Designer",
    dept: "Design",
    email: "emily.rodriguez@nucleo.one",
    phone: "+1 (555) 345-6789",
    location: "Austin, TX",
    status: "Active",
    avatar: "ER",
    startDate: "Jun 1, 2023",
    manager: "Lisa Park",
  },
  {
    id: "4",
    name: "David Kim",
    role: "Sales Executive",
    dept: "Sales",
    email: "david.kim@nucleo.one",
    phone: "+1 (555) 456-7890",
    location: "Seattle, WA",
    status: "Active",
    avatar: "DK",
    startDate: "Mar 1, 2026",
    manager: "Robert Chen",
  },
  {
    id: "5",
    name: "Jessica Lee",
    role: "Data Analyst",
    dept: "Engineering",
    email: "jessica.lee@nucleo.one",
    phone: "+1 (555) 567-8901",
    location: "San Francisco, CA",
    status: "Active",
    avatar: "JL",
    startDate: "Aug 12, 2023",
    manager: "David Park",
  },
  {
    id: "6",
    name: "Michael Brown",
    role: "Marketing Manager",
    dept: "Marketing",
    email: "michael.brown@nucleo.one",
    phone: "+1 (555) 678-9012",
    location: "Chicago, IL",
    status: "Active",
    avatar: "MB",
    startDate: "Nov 8, 2022",
    manager: "Sarah Miller",
  },
  {
    id: "7",
    name: "Amanda White",
    role: "HR Specialist",
    dept: "Operations",
    email: "amanda.white@nucleo.one",
    phone: "+1 (555) 789-0123",
    location: "Denver, CO",
    status: "Active",
    avatar: "AW",
    startDate: "Feb 20, 2023",
    manager: "Tom Wilson",
  },
  {
    id: "8",
    name: "Chris Martinez",
    role: "DevOps Engineer",
    dept: "Engineering",
    email: "chris.martinez@nucleo.one",
    phone: "+1 (555) 890-1234",
    location: "Portland, OR",
    status: "On Leave",
    avatar: "CM",
    startDate: "Apr 15, 2022",
    manager: "David Park",
  },
  {
    id: "9",
    name: "Lisa Wang",
    role: "Content Strategist",
    dept: "Marketing",
    email: "lisa.wang@nucleo.one",
    phone: "+1 (555) 901-2345",
    location: "Los Angeles, CA",
    status: "Active",
    avatar: "LW",
    startDate: "Jul 22, 2024",
    manager: "Michael Brown",
  },
  {
    id: "10",
    name: "James Wilson",
    role: "Account Executive",
    dept: "Sales",
    email: "james.wilson@nucleo.one",
    phone: "+1 (555) 012-3456",
    location: "Boston, MA",
    status: "Active",
    avatar: "JW",
    startDate: "Sep 5, 2023",
    manager: "Robert Chen",
  },
  {
    id: "11",
    name: "Rachel Green",
    role: "Frontend Developer",
    dept: "Engineering",
    email: "rachel.green@nucleo.one",
    phone: "+1 (555) 111-2222",
    location: "San Francisco, CA",
    status: "Active",
    avatar: "RG",
    startDate: "Jan 8, 2024",
    manager: "David Park",
  },
  {
    id: "12",
    name: "Kevin Zhang",
    role: "Backend Developer",
    dept: "Engineering",
    email: "kevin.zhang@nucleo.one",
    phone: "+1 (555) 333-4444",
    location: "Vancouver, BC",
    status: "Active",
    avatar: "KZ",
    startDate: "Mar 18, 2024",
    manager: "David Park",
  },
];

const departments = ["All Departments", "Engineering", "Design", "Product", "Sales", "Marketing", "Operations"];
const statuses = ["All Status", "Active", "On Leave", "Remote"];

function EmployeeDirectory() {
  const loaderData = Route.useLoaderData();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loaderData?.data) setLoading(false);
  }, [loaderData]);

  const apiEmployees = loaderData?.data || [];
  const employeesList = apiEmployees.length > 0 ? apiEmployees.map((emp: any) => ({
    id: emp.id,
    name: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    role: emp.jobTitle || "Employee",
    dept: emp.department || "General",
    email: emp.workEmail || emp.email || "",
    phone: emp.phone || "",
    location: emp.location || "N/A",
    status: emp.status || "Active",
    avatar: (emp.firstName?.[0] || "") + (emp.lastName?.[0] || ""),
    startDate: emp.startDate ? new Date(emp.startDate).toLocaleDateString() : "N/A",
    manager: emp.managerName || "N/A",
  })) : defaultEmployees;

  const filteredEmployees = employeesList.filter((emp: any) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.role && emp.role.toLowerCase().includes(search.toLowerCase())) ||
      (emp.email && emp.email.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = deptFilter === "All Departments" || emp.dept === deptFilter;
    const matchesStatus = statusFilter === "All Status" || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Employee Directory</h2>
          <p className="text-sm text-muted-foreground">
            {filteredEmployees.length} employees
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <UserPlus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              showFilters ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted/50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <div className="inline-flex rounded-lg border border-border bg-card">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="flex gap-4 rounded-lg border border-border/60 bg-card p-4">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <a
              key={employee.id}
              href={`/app/hrm/employees/${employee.id}`}
              className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold group-hover:scale-105 transition-transform">
                  {employee.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{employee.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{employee.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      employee.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {employee.status}
                    </span>
                  </div>
                </div>
                <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{employee.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">{employee.dept}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Start Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {employee.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.dept}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.location}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      employee.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.startDate}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No employees found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
