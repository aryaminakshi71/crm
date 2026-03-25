/**
 * HRM Payroll Route
 *
 * Manage payroll runs, process payments, and view per-employee pay entries.
 * Data is fetched from the API with mock fallbacks.
 */

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
  LoadingSkeleton,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Plus,
  Users,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/hrm/payroll")({
  component: HrmPayrollPage,
});

// ─── Mock fallbacks ──────────────────────────────────────────────────────────

const MOCK_PAYROLL_RUNS = [
  {
    id: "mock-run-1",
    period: "March 2025",
    status: "completed",
    totalAmount: "128500.00",
    totalGross: "145000.00",
    totalNet: "128500.00",
    totalDeductions: "16500.00",
    employeeCount: 42,
    processedAt: "2025-03-31T00:00:00.000Z",
    payDate: "2025-03-31T00:00:00.000Z",
    createdAt: "2025-03-25T00:00:00.000Z",
  },
  {
    id: "mock-run-2",
    period: "February 2025",
    status: "completed",
    totalAmount: "127200.00",
    totalGross: "143800.00",
    totalNet: "127200.00",
    totalDeductions: "16600.00",
    employeeCount: 41,
    processedAt: "2025-02-28T00:00:00.000Z",
    payDate: "2025-02-28T00:00:00.000Z",
    createdAt: "2025-02-22T00:00:00.000Z",
  },
  {
    id: "mock-run-3",
    period: "April 2025",
    status: "draft",
    totalAmount: "0.00",
    totalGross: "0.00",
    totalNet: "0.00",
    totalDeductions: "0.00",
    employeeCount: 0,
    processedAt: null,
    payDate: "2025-04-30T00:00:00.000Z",
    createdAt: "2025-04-01T00:00:00.000Z",
  },
];

const MOCK_ENTRIES = [
  {
    id: "entry-1",
    payrollRunId: "mock-run-1",
    employeeName: "Alice Chen",
    grossPay: "8500.00",
    deductions: "1200.00",
    netPay: "7300.00",
    status: "paid",
  },
  {
    id: "entry-2",
    payrollRunId: "mock-run-1",
    employeeName: "Bob Martinez",
    grossPay: "7200.00",
    deductions: "980.00",
    netPay: "6220.00",
    status: "paid",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<
  string,
  "default" | "outline" | "warning" | "success" | "danger"
> = {
  completed: "success",
  processing: "warning",
  draft: "outline",
  failed: "danger",
};

function formatCurrency(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: unknown): string {
  if (!value) return "-";
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

function HrmPayrollPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [newRun, setNewRun] = useState({
    periodLabel: "",
    payDate: "",
  });

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: runsData, isLoading: runsLoading, isError, refetch} = useQuery({
    queryKey: ["hrm-payroll-runs"],
    queryFn: () => nucleoApi.hrm.payroll.runs.list({ page: 1, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const { data: statsData } = useQuery({
    queryKey: ["hrm-payroll-stats"],
    queryFn: () => nucleoApi.hrm.payroll.stats(),
    placeholderData: (prev) => prev,
  });

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ["hrm-payroll-entries", selectedRunId],
    queryFn: () =>
      nucleoApi.hrm.payroll.entries.list({
        page: 1,
        limit: 200,
        payrollRunId: selectedRunId ?? undefined,
      }),
    enabled: !!selectedRunId,
    placeholderData: (prev) => prev,
  });

  const payrollRuns: any[] = runsData?.data ?? [];
  const recentPayments: any[] = selectedRunId
    ? (entriesData?.data ?? [])
    : [];

  const stats = statsData ?? {
    totalPaid: 0,
    avgSalary: 0,
    nextRunDate: null,
  };

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createRun = useMutation({
    mutationFn: (payload: { periodLabel: string; payDate: string }) =>
      nucleoApi.hrm.payroll.runs.create({
        periodLabel: payload.periodLabel,
        payDate: payload.payDate,
        status: "draft",
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hrm-payroll-runs"] });
      setIsModalOpen(false);
      setNewRun({ periodLabel: "", payDate: "" });
      toast.success("Payroll run created");
    },
    onError: () => toast.error("Failed to create payroll run"),
  });

  const processRun = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.payroll.runs.update(id, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hrm-payroll-runs"] });
      toast.success("Payroll run marked as processed");
    },
    onError: () => toast.error("Failed to process payroll run"),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateRun = () => {
    if (!newRun.periodLabel.trim() || !newRun.payDate.trim()) {
      toast.error("Period label and pay date are required");
      return;
    }
    createRun.mutate({
      periodLabel: newRun.periodLabel,
      payDate: new Date(`${newRun.payDate}T00:00:00.000Z`).toISOString(),
    });
  };

  const latestCompletedRun = payrollRuns.find((r) => r.status === "completed");
  const totalPaid =
    stats.totalPaid > 0
      ? stats.totalPaid
      : payrollRuns
          .filter((r) => r.status === "completed")
          .reduce((s, r) => s + Number(r.totalNet ?? r.totalAmount ?? 0), 0);

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Payroll</h2>
          <p className="text-sm text-muted-foreground">
            Process payroll runs and view employee pay entries
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Payroll Run
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalPaid)}
                </p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BadgeDollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.avgSalary)}
                </p>
                <p className="text-sm text-muted-foreground">Avg Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <CalendarClock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.nextRunDate ? formatDate(stats.nextRunDate) : "-"}
                </p>
                <p className="text-sm text-muted-foreground">Next Run</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll runs list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : payrollRuns.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-8 h-8" />}
              title="No payroll runs yet"
              description="Create the first payroll run to get started."
            />
          ) : (
            <div className="space-y-3">
              {payrollRuns.map((run: any) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() =>
                    setSelectedRunId(
                      selectedRunId === run.id ? null : run.id,
                    )
                  }
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{run.period}</p>
                    <p className="text-xs text-muted-foreground">
                      Net:{" "}
                      {formatCurrency(run.totalNet ?? run.totalAmount ?? 0)}
                      {run.employeeCount > 0 && (
                        <>
                          {" "}
                          &nbsp;·&nbsp;{" "}
                          <Users className="w-3 h-3 inline" />{" "}
                          {run.employeeCount} employees
                        </>
                      )}
                    </p>
                    {run.processedAt && (
                      <p className="text-xs text-muted-foreground">
                        Processed: {formatDate(run.processedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>
                      {run.status}
                    </Badge>
                    {run.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          processRun.mutate(run.id);
                        }}
                        disabled={processRun.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Process
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay entries for selected run */}
      {selectedRunId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Employee Pay Entries
              {latestCompletedRun && (
                <span className="font-normal text-muted-foreground ml-2">
                  — {payrollRuns.find((r) => r.id === selectedRunId)?.period}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
            ) : recentPayments.length === 0 ? (
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="No entries"
                description="No pay entries found for this payroll run."
              />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                        Employee
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                        Gross
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                        Deductions
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                        Net Pay
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((entry: any) => (
                      <tr
                        key={entry.id}
                        className="border-t border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {entry.employeeName || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(entry.grossPay)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(entry.deductions)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(entry.netPay)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant={
                              STATUS_VARIANT[entry.status] ?? "outline"
                            }
                          >
                            {entry.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Payroll Run Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Payroll Run"
        onSubmit={handleCreateRun}
        isLoading={createRun.isPending}
      >
        <FormField label="Period Label" required>
          <Input
            placeholder="e.g. April 2025"
            value={newRun.periodLabel}
            onChange={(e) =>
              setNewRun((prev) => ({ ...prev, periodLabel: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Pay Date" required>
          <Input
            type="date"
            value={newRun.payDate}
            onChange={(e) =>
              setNewRun((prev) => ({ ...prev, payDate: e.target.value }))
            }
          />
        </FormField>
      </FormModal>
    </div>
  );
}
