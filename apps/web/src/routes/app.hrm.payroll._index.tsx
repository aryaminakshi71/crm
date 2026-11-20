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
  BadgeDollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Play,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { hrmApi } from "@/lib/api";

const PAGE_SIZE = 50;

const payrollChartData = [
  { month: "Oct", amount: 284000 },
  { month: "Nov", amount: 291000 },
  { month: "Dec", amount: 298000 },
  { month: "Jan", amount: 276000 },
  { month: "Feb", amount: 285000 },
  { month: "Mar", amount: 292000 },
];

const tooltipStyle = {
  background: "#0f172a",
  border: "none",
  borderRadius: "12px",
  fontSize: "11px",
};

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/hrm/payroll/_index")({
  validateSearch: searchSchema,
  component: PayrollIndexPage,
});

const STATUS_BADGE: Record<string, "default" | "warning" | "success" | "primary"> = {
  draft: "default",
  processing: "warning",
  processed: "primary",
  paid: "success",
};

function fmt(val: number | undefined | null): string {
  if (val == null || isNaN(Number(val))) return "—";
  return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PayrollIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", page = 1 } = useSearch({ from: "/app/hrm/payroll/_index" });
  const navigate = useNavigate({ from: "/app/hrm/payroll/_index" });
  const search = q;
  const setSearch = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrm-payroll-index", page],
    queryFn: () => (hrmApi as any).payroll.list({ page, limit: PAGE_SIZE }),
  });

  const runPayrollMut = useMutation({
    mutationFn: () =>
      (hrmApi as any).payroll.run({
        period: new Date().toISOString().slice(0, 7),
        type: "monthly",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-payroll-index"] });
      toast.success("Payroll run initiated");
    },
    onError: () => toast.error("Failed to run payroll"),
  });

  const runs: any[] = (data?.data as any[]) ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = runs.filter((r) => {
    if (!search.trim()) return true;
    return (
      r.period?.toLowerCase().includes(search.toLowerCase()) ||
      r.status?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRuns = runs.filter((r) => r.period?.startsWith(thisMonth));
  const totalThisMonth = thisMonthRuns.reduce(
    (acc, r) => acc + (r.totalGross ?? r.totalAmount ?? 0),
    0,
  );
  const pendingRuns = runs.filter((r) => r.status === "draft" || r.status === "processing").length;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load payroll data. Please try again.</p>
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
          <h2 className="font-bold text-xl text-foreground">Payroll</h2>
          <p className="text-muted-foreground text-sm">
            Manage payroll runs, pay periods, and employee compensation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payroll runs..."
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => runPayrollMut.mutate()}
            disabled={runPayrollMut.isPending}
          >
            <Play className="h-4 w-4 mr-1" />
            {runPayrollMut.isPending ? "Running..." : "Run Payroll"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Total This Month",
            value: isLoading ? "—" : fmt(totalThisMonth),
            icon: <DollarSign className="h-4 w-4" />,
            color: "text-primary",
          },
          {
            label: "Pending Runs",
            value: isLoading ? "—" : pendingRuns,
            icon: <Clock className="h-4 w-4" />,
            color: pendingRuns > 0 ? "text-amber-400" : "text-muted-foreground",
          },
          {
            label: "Paid Runs",
            value: isLoading ? "—" : runs.filter((r) => r.status === "paid").length,
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "Total Runs",
            value: isLoading ? "—" : runs.length,
            icon: <BadgeDollarSign className="h-4 w-4" />,
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

      {/* Monthly Payroll Trend Chart */}
      <Card className="border-border/60">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">Monthly Payroll Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollChartData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#888"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Payroll Cost"]}
                />
                <Bar dataKey="amount" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Payroll Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Runs Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Payroll Runs ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-4 items-center">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted/60 rounded" />
                  <div className="h-5 w-16 bg-muted/50 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No payroll runs"
                description='Click "Run Payroll" to initiate the first run.'
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-2">Pay Period</div>
                <div className="col-span-2">Employees</div>
                <div className="col-span-3">Total Gross</div>
                <div className="col-span-3">Total Net</div>
                <div className="col-span-2">Status</div>
              </div>
              {filtered.map((run) => (
                <PayrollRow key={run.id} run={run} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function PayrollRow({ run }: { run: any }) {
  const period = run.period || run.payPeriod || "—";
  const empCount = run.employeeCount ?? run.employees ?? "—";
  const gross = fmt(run.totalGross ?? run.totalAmount);
  const net = fmt(run.totalNet ?? (run.totalGross ? run.totalGross * 0.78 : null));

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="font-medium text-sm">{period}</p>
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{empCount}</p>
        </div>
      </div>
      <div className="col-span-3">
        <p className="text-sm font-medium">{gross}</p>
      </div>
      <div className="col-span-3">
        <p className="text-sm font-medium">{net}</p>
      </div>
      <div className="col-span-2">
        <Badge variant={STATUS_BADGE[run.status] ?? "default"}>
          {run.status ?? "—"}
        </Badge>
      </div>
    </div>
  );
}
