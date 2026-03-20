import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Play,
  Pause,
  FileText,
  Users,
  Calendar,
  ChevronDown,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/payroll")({
  component: PayrollManagement,
});

const payrollRuns = [
  {
    id: "1",
    name: "March 2026 Payroll",
    period: "Mar 1 - Mar 15, 2026",
    status: "Completed",
    payDate: "Mar 20, 2026",
    employees: 248,
    grossPay: "$1,245,000",
    deductions: "$298,800",
    netPay: "$946,200",
    createdBy: "Amanda White",
    completedAt: "Mar 18, 2026",
  },
  {
    id: "2",
    name: "March 2026 Bonus Run",
    period: "Q1 Performance Bonuses",
    status: "Completed",
    payDate: "Mar 15, 2026",
    employees: 45,
    grossPay: "$225,000",
    deductions: "$54,000",
    netPay: "$171,000",
    createdBy: "Amanda White",
    completedAt: "Mar 14, 2026",
  },
  {
    id: "3",
    name: "February 2026 Payroll",
    period: "Feb 1 - Feb 15, 2026",
    status: "Completed",
    payDate: "Feb 20, 2026",
    employees: 246,
    grossPay: "$1,230,000",
    deductions: "$295,200",
    netPay: "$934,800",
    createdBy: "Amanda White",
    completedAt: "Feb 18, 2026",
  },
  {
    id: "4",
    name: "February 2026 Payroll (Second Half)",
    period: "Feb 16 - Feb 28, 2026",
    status: "In Progress",
    payDate: "Mar 5, 2026",
    employees: 248,
    grossPay: "$1,245,000",
    deductions: "$298,800",
    netPay: "$946,200",
    createdBy: "Amanda White",
    completedAt: null,
  },
];

const recentPayments = [
  { id: "1", employee: "Sarah Chen", amount: "$5,962.50", type: "Salary", status: "Paid", date: "Mar 20, 2026" },
  { id: "2", employee: "Marcus Johnson", amount: "$4,833.33", type: "Salary", status: "Paid", date: "Mar 20, 2026" },
  { id: "3", employee: "Jessica Lee", amount: "$3,750.00", type: "Salary", status: "Paid", date: "Mar 20, 2026" },
  { id: "4", employee: "David Kim", amount: "$4,166.67", type: "Salary + Commission", status: "Paid", date: "Mar 20, 2026" },
  { id: "5", employee: "Emily Rodriguez", amount: "$3,958.33", type: "Salary", status: "Pending", date: "Mar 20, 2026" },
];

const deductions = [
  { name: "Federal Income Tax", amount: "$156,000", percent: "12.5%" },
  { name: "State Income Tax", amount: "$42,000", percent: "3.4%" },
  { name: "Social Security", amount: "$77,190", percent: "6.2%" },
  { name: "Medicare", amount: "$18,052", percent: "1.45%" },
  { name: "401(k) Contributions", amount: "$37,350", percent: "3.0%" },
  { name: "Health Insurance", amount: "$27,280", percent: "2.2%" },
];

function PayrollManagement() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showNewRunModal, setShowNewRunModal] = useState(false);

  const filteredRuns = payrollRuns.filter((run) => {
    const matchesSearch = run.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["All", "Completed", "In Progress", "Scheduled", "Failed"];
  const totalPayroll = payrollRuns.filter((r) => r.status === "Completed").reduce((acc, r) => acc + parseFloat(r.netPay.replace(/[$,]/g, "")), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Payroll Management</h2>
          <p className="text-sm text-muted-foreground">
            Run payroll, manage compensation, and track payments
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export Reports
          </button>
          <button
            onClick={() => setShowNewRunModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Payroll Run
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payroll (YTD)</p>
              <p className="text-xl font-bold text-foreground">${(totalPayroll / 1000000).toFixed(2)}M</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employees Paid</p>
              <p className="text-xl font-bold text-foreground">248</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-xl font-bold text-foreground">1</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Pay Date</p>
              <p className="text-xl font-bold text-foreground">Mar 20</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payroll runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payroll Runs */}
      <div className="space-y-4">
        {filteredRuns.map((run) => (
          <div key={run.id} className="rounded-lg border border-border/60 bg-card">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  run.status === "Completed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : run.status === "In Progress"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {run.status === "Completed" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : run.status === "In Progress" ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{run.name}</p>
                  <p className="text-xs text-muted-foreground">{run.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Pay Date</p>
                  <p className="text-sm font-medium text-foreground">{run.payDate}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p className="text-sm font-medium text-foreground">{run.employees}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Net Pay</p>
                  <p className="text-sm font-semibold text-foreground">{run.netPay}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  run.status === "Completed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : run.status === "In Progress"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {run.status}
                </span>
                <div className="relative">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <div className="border-t border-border/40 bg-muted/20 p-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gross Pay</p>
                  <p className="text-sm font-semibold text-foreground">{run.grossPay}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deductions</p>
                  <p className="text-sm font-semibold text-foreground">{run.deductions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created By</p>
                  <p className="text-sm font-semibold text-foreground">{run.createdBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completed At</p>
                  <p className="text-sm font-semibold text-foreground">{run.completedAt || "—"}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                  <FileText className="h-3 w-3 inline mr-1" />
                  View Details
                </button>
                {run.status === "Completed" && (
                  <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                    <Download className="h-3 w-3 inline mr-1" />
                    Download Report
                  </button>
                )}
                {run.status === "In Progress" && (
                  <>
                    <button className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" />
                      Approve & Finalize
                    </button>
                    <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                      <XCircle className="h-3 w-3 inline mr-1" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Payments */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold text-foreground">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{payment.employee}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-foreground">{payment.amount}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{payment.type}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      payment.status === "Paid"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deductions Summary */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold text-foreground">Deductions Breakdown (Latest Run)</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {deductions.map((deduction) => (
              <div key={deduction.name} className="text-center">
                <p className="text-lg font-bold text-foreground">{deduction.amount}</p>
                <p className="text-xs text-muted-foreground">{deduction.name}</p>
                <p className="text-xs text-primary">{deduction.percent}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredRuns.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No payroll runs found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
