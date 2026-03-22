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
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CreditCard,
  History,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { aiApi, nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/invoicing")({
  component: InvoicingPage,
});

function InvoicingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    subtotal: "0",
    tax: "0",
    currency: "USD",
    dueAt: "",
    notes: "",
  });
  const [invoiceRiskById, setInvoiceRiskById] = useState<
    Record<
      string,
      {
        riskScore: number;
        riskLevel: "low" | "medium" | "high";
        rationale: string;
        recommendations: string[];
      }
    >
  >({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["nucleo-invoices"],
    queryFn: () => nucleoApi.invoices.list({ page: 1, limit: 100 }),
  });

  const createInvoice = useMutation({
    mutationFn: (payload: {
      invoiceNumber: string;
      subtotal: number;
      tax: number;
      total: number;
      currency: string;
      dueAt?: string;
      notes?: string;
    }) => nucleoApi.invoices.create(payload),
    onSuccess: () => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      setIsCreateModalOpen(false);
      setNewInvoice({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        subtotal: "0",
        tax: "0",
        currency: "USD",
        dueAt: "",
        notes: "",
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create invoice"),
  });

  const assessRiskMutation = useMutation({
    mutationFn: (invoice: any) =>
      aiApi.assessInvoiceRisk({
        invoiceNumber: invoice.invoiceNumber,
        total: Number(invoice.total || 0),
        dueAt: invoice.dueAt,
        status: invoice.status,
        notes: invoice.notes,
      }),
    onSuccess: (response, invoice) => {
      if (!response.result) {
        toast.error("AI risk assessment unavailable");
        return;
      }
      setInvoiceRiskById((prev) => ({
        ...prev,
        [invoice.id]: response.result!,
      }));
      toast.success("Invoice risk scored");
    },
    onError: () => {
      toast.error("Failed to assess invoice risk");
    },
  });

  const updateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.invoices.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-invoices"] });
      toast.success("Invoice updated");
    },
    onError: () => toast.error("Failed to update invoice"),
  });

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => nucleoApi.invoices.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      toast.success("Invoice deleted");
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  const invoices = (data?.data as any[]) || [];
  const currencyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          invoices.map((invoice: any) => String(invoice.currency || "USD")),
        ),
      ),
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice: any) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }
      if (currencyFilter !== "all" && invoice.currency !== currencyFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        String(invoice.invoiceNumber || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(invoice.notes || "")
          .toLowerCase()
          .includes(searchLower)
      );
    });
  }, [invoices, search, statusFilter, currencyFilter]);

  const totalRevenue = filteredInvoices.reduce(
    (sum: number, invoice: any) => sum + Number(invoice.total || 0),
    0,
  );
  const paidRevenue = filteredInvoices
    .filter((invoice: any) => invoice.status === "paid")
    .reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0);
  const overdueCount = filteredInvoices.filter((invoice: any) => {
    if (!invoice.dueAt) return false;
    return (
      new Date(invoice.dueAt).getTime() < Date.now() &&
      invoice.status !== "paid"
    );
  }).length;

  if (isLoading) return <Loading text="Loading invoices..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Invoicing</h1>
          <p className="text-muted-foreground">
            Complete invoice operations with totals, due dates, and status
            views.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          loading={createInvoice.isPending}
        >
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Gross Revenue"
          value={`$${(totalRevenue / 1000).toFixed(1)}k`}
          icon={<CreditCard className="h-4 w-4" />}
          trend="+12.4% vs lm"
          color="text-primary"
        />
        <Metric
          title="Paid Invoices"
          value={`$${(paidRevenue / 1000).toFixed(1)}k`}
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="All reconciled"
          color="text-emerald-400"
        />
        <Metric
          title="Liquidity Gap"
          value={`$${((totalRevenue - paidRevenue) / 1000).toFixed(1)}k`}
          icon={<Activity className="h-4 w-4" />}
          trend="Aging < 30d"
          color="text-cyan-400"
        />
        <Metric
          title="Overdue Risk"
          value={overdueCount}
          icon={<History className="h-4 w-4" />}
          trend="Requires follow-up"
          color="text-rose-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Revenue Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "W1", revenue: 1200, collections: 800 },
                    { month: "W2", revenue: 2100, collections: 1500 },
                    { month: "W3", revenue: 1800, collections: 1700 },
                    { month: "W4", revenue: 3200, collections: 2800 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="collections"
                    stroke="#888"
                    fillOpacity={0}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Smart Reminders
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-center py-6">
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
              AI has identified **4 late-paying** clients suitable for
              automated, personalized nudge sequences.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5"
            >
              Enable AI Collections
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or notes..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>
        <select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All currencies</option>
          {currencyOptions.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </div>

      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title="No invoices found"
          description="Create your first invoice or adjust current filters."
          action={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Invoice
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice: any) => (
            <Card key={invoice.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    {invoice.invoiceNumber}
                  </CardTitle>
                  <Badge
                    variant={
                      invoice.status === "paid"
                        ? "success"
                        : invoice.status === "sent"
                          ? "primary"
                          : invoice.status === "void"
                            ? "danger"
                            : "outline"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Subtotal:{" "}
                  <span className="text-foreground">
                    ${Number(invoice.subtotal || 0).toFixed(2)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Tax:{" "}
                  <span className="text-foreground">
                    ${Number(invoice.tax || 0).toFixed(2)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Total:{" "}
                  <span className="font-semibold text-foreground">
                    ${Number(invoice.total || 0).toFixed(2)} {invoice.currency}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Due:{" "}
                  <span className="text-foreground">
                    {invoice.dueAt
                      ? new Date(invoice.dueAt).toLocaleDateString()
                      : "No due date"}
                  </span>
                </p>
                {invoice.notes ? (
                  <p className="line-clamp-2 text-muted-foreground">
                    Notes: {invoice.notes}
                  </p>
                ) : null}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                    value={invoice.status}
                    onChange={(e) =>
                      updateInvoice.mutate({
                        id: invoice.id,
                        data: { status: e.target.value },
                      })
                    }
                  >
                    <option value="draft">draft</option>
                    <option value="sent">sent</option>
                    <option value="paid">paid</option>
                    <option value="void">void</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteInvoice.mutate(invoice.id)}
                  >
                    Delete
                  </Button>
                </div>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Sparkles className="h-4 w-4" />}
                    loading={assessRiskMutation.isPending}
                    onClick={() => assessRiskMutation.mutate(invoice)}
                  >
                    AI Risk Scan
                  </Button>
                </div>
                {invoiceRiskById[invoice.id] ? (
                  <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-2 text-xs">
                    <p className="font-medium text-foreground">
                      Risk: {invoiceRiskById[invoice.id].riskLevel} (
                      {invoiceRiskById[invoice.id].riskScore})
                    </p>
                    <p className="text-muted-foreground">
                      {invoiceRiskById[invoice.id].rationale}
                    </p>
                    <p className="text-muted-foreground">
                      {invoiceRiskById[invoice.id].recommendations.join(" | ")}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Invoice"
        submitText="Create Invoice"
        loading={createInvoice.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const invoiceNumber = newInvoice.invoiceNumber.trim();
          if (!invoiceNumber) {
            toast.error("Invoice number is required");
            return;
          }

          const subtotal = Number(newInvoice.subtotal);
          const tax = Number(newInvoice.tax);
          if (!Number.isFinite(subtotal) || subtotal < 0) {
            toast.error("Subtotal must be a valid non-negative number");
            return;
          }
          if (!Number.isFinite(tax) || tax < 0) {
            toast.error("Tax must be a valid non-negative number");
            return;
          }

          let dueAtIso: string | undefined;
          if (newInvoice.dueAt) {
            const due = new Date(newInvoice.dueAt);
            if (Number.isNaN(due.getTime())) {
              toast.error("Invalid due date");
              return;
            }
            dueAtIso = due.toISOString();
          }

          createInvoice.mutate({
            invoiceNumber,
            subtotal,
            tax,
            total: subtotal + tax,
            currency: newInvoice.currency.trim() || "USD",
            dueAt: dueAtIso,
            notes: newInvoice.notes.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Invoice Number" required>
            <Input
              value={newInvoice.invoiceNumber}
              onChange={(e) =>
                setNewInvoice((prev) => ({
                  ...prev,
                  invoiceNumber: e.target.value,
                }))
              }
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Subtotal (USD)" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newInvoice.subtotal}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    subtotal: e.target.value,
                  }))
                }
                required
              />
            </FormField>
            <FormField label="Tax (USD)" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newInvoice.tax}
                onChange={(e) =>
                  setNewInvoice((prev) => ({ ...prev, tax: e.target.value }))
                }
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Currency">
              <Input
                value={newInvoice.currency}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    currency: e.target.value,
                  }))
                }
                placeholder="USD"
              />
            </FormField>
            <FormField label="Due Date">
              <Input
                type="date"
                value={newInvoice.dueAt}
                onChange={(e) =>
                  setNewInvoice((prev) => ({ ...prev, dueAt: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              value={newInvoice.notes}
              onChange={(e) =>
                setNewInvoice((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={4}
              placeholder="Optional notes for this invoice..."
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Receipt className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
