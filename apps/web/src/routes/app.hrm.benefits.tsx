import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit,
  Eye,
  Users,
  Shield,
  GraduationCap,
  Home,
  Car,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/benefits")({
  component: BenefitsManagement,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_BENEFIT_PLANS = [
  {
    id: "1",
    name: "Premium Health Insurance",
    type: "Health",
    provider: "Blue Shield of California",
    cost: "$450/month",
    employeesEnrolled: 186,
    status: "Active",
    description: "Comprehensive medical coverage including preventive care, specialist visits, and hospital stays.",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "2",
    name: "Dental Plus",
    type: "Dental",
    provider: "Delta Dental",
    cost: "$35/month",
    employeesEnrolled: 162,
    status: "Active",
    description: "Full dental coverage including preventive care, basic procedures, and major services.",
    icon: Smile,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "3",
    name: "Vision Care",
    type: "Vision",
    provider: "VSP",
    cost: "$15/month",
    employeesEnrolled: 148,
    status: "Active",
    description: "Eye exams, prescription glasses, and contact lens coverage.",
    icon: Eye,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "4",
    name: "401(k) Retirement Plan",
    type: "Retirement",
    provider: "Fidelity",
    cost: "3% match",
    employeesEnrolled: 224,
    status: "Active",
    description: "Employer-matched retirement savings with automatic enrollment.",
    icon: GraduationCap,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "5",
    name: "Life Insurance",
    type: "Life",
    provider: "MetLife",
    cost: "Free",
    employeesEnrolled: 248,
    status: "Active",
    description: "$200,000 life insurance policy for all full-time employees.",
    icon: Shield,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "6",
    name: "Disability Insurance",
    type: "Disability",
    provider: "Unum",
    cost: "$25/month",
    employeesEnrolled: 198,
    status: "Active",
    description: "Short-term and long-term disability coverage for income protection.",
    icon: AlertCircle,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "7",
    name: "Commuter Benefits",
    type: "Transportation",
    provider: "WageWorks",
    cost: "Pre-tax",
    employeesEnrolled: 87,
    status: "Active",
    description: "Pre-tax commuter benefits for public transit and parking.",
    icon: Car,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    id: "8",
    name: "Housing Assistance",
    type: "Housing",
    provider: "Internal",
    cost: "Varies",
    employeesEnrolled: 12,
    status: "Active",
    description: "Down payment assistance and housing relocation support.",
    icon: Home,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const MOCK_ENROLLMENTS = [
  { id: "1", employee: "Sarah Chen", plan: "Premium Health Insurance", status: "Enrolled", effectiveDate: "Jan 1, 2026", dependents: 2 },
  { id: "2", employee: "Marcus Johnson", plan: "Dental Plus", status: "Enrolled", effectiveDate: "Mar 10, 2026", dependents: 1 },
  { id: "3", employee: "Jessica Lee", plan: "401(k) Retirement Plan", status: "Enrolled", effectiveDate: "Aug 12, 2023", dependents: 0 },
  { id: "4", employee: "David Kim", plan: "Life Insurance", status: "Enrolled", effectiveDate: "Mar 1, 2026", dependents: 3 },
  { id: "5", employee: "Emily Rodriguez", plan: "Vision Care", status: "Pending", effectiveDate: "Apr 1, 2026", dependents: 1 },
  { id: "6", employee: "Michael Brown", plan: "Disability Insurance", status: "Enrolled", effectiveDate: "Nov 8, 2022", dependents: 2 },
];

function BenefitsManagement() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [viewMode, setViewMode] = useState<"plans" | "enrollments">("plans");

  const plansQuery = useQuery({
    queryKey: ["hrm", "benefit-plans"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hrm/benefit-plans`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch benefit plans");
      return res.json();
    },
    retry: false,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["hrm", "benefit-enrollments"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hrm/benefit-enrollments`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch benefit enrollments");
      return res.json();
    },
    retry: false,
  });

  const benefitPlans = plansQuery.data?.data ?? MOCK_BENEFIT_PLANS;
  const enrollments = enrollmentsQuery.data?.data ?? MOCK_ENROLLMENTS;

  const filteredPlans = benefitPlans.filter((plan: any) => {
    const matchesSearch = plan.name.toLowerCase().includes(search.toLowerCase()) || plan.provider.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All Types" || plan.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const types = ["All Types", "Health", "Dental", "Vision", "Retirement", "Life", "Disability", "Transportation", "Housing"];
  const totalEnrolled = enrollments.filter((e: any) => e.status === "Enrolled").length;
  const pendingEnrollments = enrollments.filter((e: any) => e.status === "Pending").length;

  const isLoading = plansQuery.isLoading || enrollmentsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Benefits Management</h2>
          <p className="text-sm text-muted-foreground">
            {totalEnrolled} enrolled · {pendingEnrollments} pending
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Health Plans</p>
              <p className="text-xl font-bold text-foreground">1</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
              <p className="text-xl font-bold text-foreground">248</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-foreground">{pendingEnrollments}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-xl font-bold text-foreground">$89K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60">
        <button
          onClick={() => setViewMode("plans")}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            viewMode === "plans"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Benefit Plans
        </button>
        <button
          onClick={() => setViewMode("enrollments")}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            viewMode === "enrollments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Enrollments
        </button>
      </div>

      {/* Search and Filters */}
      {viewMode === "plans" && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && viewMode === "plans" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-card p-6 animate-pulse">
              <div className="h-12 w-12 rounded-lg bg-muted mb-4" />
              <div className="h-4 bg-muted rounded mb-2 w-3/4" />
              <div className="h-3 bg-muted rounded mb-3 w-1/2" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Plans Grid */}
      {viewMode === "plans" && !isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlans.map((plan: any) => {
            const PlanIcon = plan.icon ?? Heart;
            return (
              <div key={plan.id} className="rounded-lg border border-border/60 bg-card p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${plan.bgColor ?? "bg-primary/10"}`}>
                    <PlanIcon className={`h-6 w-6 ${plan.color ?? "text-primary"}`} />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {plan.status}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{plan.provider}</p>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{plan.description}</p>
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="text-sm font-semibold text-foreground">{plan.cost}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                    <p className="text-sm font-semibold text-foreground">{plan.employeesEnrolled}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50">
                    <Edit className="h-3 w-3 inline mr-1" />
                    Edit
                  </button>
                  <button className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50">
                    <Eye className="h-3 w-3 inline mr-1" />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enrollments Table */}
      {viewMode === "enrollments" && (
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          {enrollmentsQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Dependents</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Effective Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-sm">{enrollment.employee}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{enrollment.plan}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{enrollment.dependents}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{enrollment.effectiveDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        enrollment.status === "Enrolled"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredPlans.length === 0 && viewMode === "plans" && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No plans found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

// Missing icon component
function Smile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
