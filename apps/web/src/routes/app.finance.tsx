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
import { CreditCard, DollarSign, Plus, Receipt, Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/finance")({
  component: FinancePage,
});

type FinanceView = "overview" | "transactions" | "payroll";

function FinancePage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<FinanceView>("overview");
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isPayrollEntryModalOpen, setIsPayrollEntryModalOpen] = useState(false);
  const [selectedPayrollRunId, setSelectedPayrollRunId] = useState<string>("");

  const [newTransaction, setNewTransaction] = useState({
    type: "expense",
    category: "general",
    amount: "",
    currency: "USD",
    reference: "",
    counterparty: "",
    description: "",
  });

  const [newPayrollRun, setNewPayrollRun] = useState({
    periodLabel: "",
    payDate: "",
    totalGross: "",
    totalDeductions: "",
    totalNet: "",
    notes: "",
  });

  const [newPayrollEntry, setNewPayrollEntry] = useState({
    employeeId: "",
    grossPay: "",
    deductions: "",
    netPay: "",
    notes: "",
  });

  const invoicesQuery = useQuery({
    queryKey: ["nucleo-invoices-finance"],
    queryFn: () => nucleoApi.invoices.list({ page: 1, limit: 200 }),
  });

  const summaryQuery = useQuery({
    queryKey: ["ops-summary"],
    queryFn: () => nucleoApi.operations.summary(),
  });

  const transactionsQuery = useQuery({
    queryKey: ["ops-finance-transactions"],
    queryFn: () =>
      nucleoApi.operations.financeTransactions.list({ page: 1, limit: 200 }),
  });

  const payrollRunsQuery = useQuery({
    queryKey: ["ops-payroll-runs"],
    queryFn: () => nucleoApi.operations.payrollRuns.list({ page: 1, limit: 100 }),
  });

  const payrollEntriesQuery = useQuery({
    queryKey: ["ops-payroll-entries", selectedPayrollRunId],
    queryFn: () =>
      nucleoApi.operations.payrollEntries.list({
        page: 1,
        limit: 300,
        payrollRunId: selectedPayrollRunId || undefined,
      }),
  });

  const employeesQuery = useQuery({
    queryKey: ["hrm-employees-for-payroll"],
    queryFn: () => nucleoApi.hrm.employees.list({ page: 1, limit: 200 }),
  });

  const createTransaction = useMutation({
    mutationFn: (payload: any) =>
      nucleoApi.operations.financeTransactions.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ops-finance-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["ops-summary"] }),
      ]);
      toast.success("Transaction recorded");
      setIsTxnModalOpen(false);
      setNewTransaction({
        type: "expense",
        category: "general",
        amount: "",
        currency: "USD",
        reference: "",
        counterparty: "",
        description: "",
      });
    },
    onError: () => toast.error("Failed to record transaction"),
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.financeTransactions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-finance-transactions"] });
      toast.success("Transaction updated");
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.financeTransactions.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ops-finance-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["ops-summary"] }),
      ]);
      toast.success("Transaction deleted");
    },
  });

  const createPayrollRun = useMutation({
    mutationFn: (payload: any) => nucleoApi.operations.payrollRuns.create(payload),
    onSuccess: async (run: any) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ops-payroll-runs"] }),
        queryClient.invalidateQueries({ queryKey: ["ops-summary"] }),
      ]);
      if (run?.id) setSelectedPayrollRunId(run.id);
      toast.success("Payroll run created");
      setIsPayrollModalOpen(false);
      setNewPayrollRun({
        periodLabel: "",
        payDate: "",
        totalGross: "",
        totalDeductions: "",
        totalNet: "",
        notes: "",
      });
    },
    onError: () => toast.error("Failed to create payroll run"),
  });

  const updatePayrollRun = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.payrollRuns.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-payroll-runs"] });
      toast.success("Payroll run updated");
    },
  });

  const deletePayrollRun = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.payrollRuns.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ops-payroll-runs"] }),
        queryClient.invalidateQueries({ queryKey: ["ops-payroll-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["ops-summary"] }),
      ]);
      toast.success("Payroll run deleted");
      setSelectedPayrollRunId("");
    },
  });

  const createPayrollEntry = useMutation({
    mutationFn: (payload: any) =>
      nucleoApi.operations.payrollEntries.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-payroll-entries"] });
      toast.success("Payroll entry added");
      setIsPayrollEntryModalOpen(false);
      setNewPayrollEntry({ employeeId: "", grossPay: "", deductions: "", netPay: "", notes: "" });
    },
    onError: () => toast.error("Failed to add payroll entry"),
  });

  const deletePayrollEntry = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.payrollEntries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-payroll-entries"] });
      toast.success("Payroll entry deleted");
    },
  });

  const invoices = useMemo(() => invoicesQuery.data?.data || [], [invoicesQuery.data]);
  const transactions = useMemo(() => transactionsQuery.data?.data || [], [transactionsQuery.data]);
  const payrollRuns = useMemo(() => payrollRunsQuery.data?.data || [], [payrollRunsQuery.data]);
  const payrollEntries = useMemo(() => payrollEntriesQuery.data?.data || [], [payrollEntriesQuery.data]);
  const employees = useMemo(() => employeesQuery.data?.data || [], [employeesQuery.data]);
  const summary = summaryQuery.data || { financeSpend: 0, payrollRuns: 0 };

  if (
    invoicesQuery.isLoading ||
    summaryQuery.isLoading ||
    transactionsQuery.isLoading ||
    payrollRunsQuery.isLoading ||
    payrollEntriesQuery.isLoading ||
    employeesQuery.isLoading
  ) {
    return <Loading text="Loading finance workspace..." />;
  }

  const invoiceRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
  const paidRevenue = invoices
    .filter((inv: any) => inv.status === "paid")
    .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
  const transactionBalance = transactions.reduce((sum: number, txn: any) => {
    const amt = Number(txn.amount || 0);
    return sum + (txn.type === "income" ? amt : -amt);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Finance</h1>
          <p className="text-muted-foreground">
            Real finance workspace across invoicing, transactions, and payroll operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsTxnModalOpen(true)}>
            New Transaction
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsPayrollModalOpen(true)}>
            New Payroll Run
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Tile title="Invoiced Amount" value={`$${invoiceRevenue.toLocaleString()}`} icon={<Receipt className="h-4 w-4 text-primary" />} />
        <Tile title="Collected Revenue" value={`$${paidRevenue.toLocaleString()}`} icon={<Wallet className="h-4 w-4 text-success" />} />
        <Tile title="Ledger Balance" value={`$${transactionBalance.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-warning" />} />
        <Tile title="Payroll Runs" value={summary.payrollRuns || 0} icon={<CreditCard className="h-4 w-4 text-foreground" />} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["overview", "Overview"],
          ["transactions", "Transactions"],
          ["payroll", "Payroll"],
        ] as const).map(([key, label]) => (
          <Button key={key} size="sm" variant={view === key ? "primary" : "outline"} onClick={() => setView(key)}>
            {label}
          </Button>
        ))}
      </div>

      {view === "overview" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Latest Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transactions.slice(0, 6).map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{txn.category}</p>
                    <p className="text-muted-foreground text-xs">{txn.counterparty || "-"} | {txn.reference || "-"}</p>
                  </div>
                  <p className="font-semibold text-foreground">{txn.type === "income" ? "+" : "-"}${Number(txn.amount || 0).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Payroll Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payrollRuns.slice(0, 6).map((run: any) => (
                <div key={run.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{run.periodLabel}</p>
                    <p className="text-muted-foreground text-xs">Pay date: {new Date(run.payDate).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={run.status === "posted" ? "success" : "outline"}>{run.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "transactions" ? (
        transactions.length === 0 ? (
          <EmptyState icon={<Receipt className="h-10 w-10" />} title="No transactions" description="Create the first finance transaction." />
        ) : (
          <div className="space-y-3">
            {transactions.map((txn: any) => (
              <Card key={txn.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{txn.type} | {txn.category}</p>
                      <p className="text-muted-foreground text-sm">{txn.counterparty || "-"} | {txn.reference || "-"}</p>
                      <p className="text-muted-foreground text-xs">{txn.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={txn.status === "posted" ? "success" : "outline"}>{txn.status}</Badge>
                      <select className="flex h-8 rounded-md border border-border bg-card px-2 text-xs" value={txn.status} onChange={(e) => updateTransaction.mutate({ id: txn.id, data: { status: e.target.value } })}>
                        <option value="draft">draft</option>
                        <option value="posted">posted</option>
                        <option value="void">void</option>
                      </select>
                      <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => deleteTransaction.mutate(txn.id)}>Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {view === "payroll" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Payroll Runs</CardTitle>
                <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsPayrollModalOpen(true)}>
                  Run
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {payrollRuns.map((run: any) => (
                <div key={run.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{run.periodLabel}</p>
                      <p className="text-muted-foreground text-sm">Pay date: {new Date(run.payDate).toLocaleDateString()}</p>
                      <p className="text-muted-foreground text-xs">Gross: ${Number(run.totalGross || 0).toLocaleString()} | Net: ${Number(run.totalNet || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={run.status === "posted" ? "success" : "outline"}>{run.status}</Badge>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={selectedPayrollRunId === run.id ? "primary" : "outline"} onClick={() => setSelectedPayrollRunId(run.id)}>
                          Select
                        </Button>
                        <select className="flex h-8 rounded-md border border-border bg-card px-2 text-xs" value={run.status} onChange={(e) => updatePayrollRun.mutate({ id: run.id, data: { status: e.target.value } })}>
                          <option value="draft">draft</option>
                          <option value="approved">approved</option>
                          <option value="posted">posted</option>
                        </select>
                        <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => deletePayrollRun.mutate(run.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Payroll Entries</CardTitle>
                <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => {
                  if (!selectedPayrollRunId) {
                    toast.error("Select a payroll run first");
                    return;
                  }
                  setIsPayrollEntryModalOpen(true);
                }}>
                  Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedPayrollRunId ? (
                <p className="text-muted-foreground text-sm">Select a payroll run to manage entries.</p>
              ) : payrollEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">No entries yet for selected run.</p>
              ) : (
                <div className="space-y-3">
                  {payrollEntries.map((entry: any) => (
                    <div key={entry.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{entry.employeeName || "Unassigned employee"}</p>
                          <p className="text-muted-foreground text-xs">Gross: ${Number(entry.grossPay || 0).toLocaleString()} | Deductions: ${Number(entry.deductions || 0).toLocaleString()} | Net: ${Number(entry.netPay || 0).toLocaleString()}</p>
                        </div>
                        <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => deletePayrollEntry.mutate(entry.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <FormModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        title="Record Transaction"
        submitText="Save"
        loading={createTransaction.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const amount = Number(newTransaction.amount);
          if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Amount must be a positive number");
            return;
          }
          createTransaction.mutate({
            type: newTransaction.type,
            category: newTransaction.category,
            amount,
            currency: newTransaction.currency,
            reference: newTransaction.reference.trim() || undefined,
            counterparty: newTransaction.counterparty.trim() || undefined,
            description: newTransaction.description.trim() || undefined,
            status: "posted",
            transactionDate: new Date().toISOString(),
          });
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Type">
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newTransaction.type} onChange={(e) => setNewTransaction((prev) => ({ ...prev, type: e.target.value }))}>
                <option value="income">income</option>
                <option value="expense">expense</option>
              </select>
            </FormField>
            <FormField label="Category">
              <Input value={newTransaction.category} onChange={(e) => setNewTransaction((prev) => ({ ...prev, category: e.target.value }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Amount" required>
              <Input type="number" min="0" step="0.01" value={newTransaction.amount} onChange={(e) => setNewTransaction((prev) => ({ ...prev, amount: e.target.value }))} />
            </FormField>
            <FormField label="Currency">
              <Input value={newTransaction.currency} onChange={(e) => setNewTransaction((prev) => ({ ...prev, currency: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Reference">
            <Input value={newTransaction.reference} onChange={(e) => setNewTransaction((prev) => ({ ...prev, reference: e.target.value }))} />
          </FormField>
          <FormField label="Counterparty">
            <Input value={newTransaction.counterparty} onChange={(e) => setNewTransaction((prev) => ({ ...prev, counterparty: e.target.value }))} />
          </FormField>
          <FormField label="Description">
            <Textarea rows={3} value={newTransaction.description} onChange={(e) => setNewTransaction((prev) => ({ ...prev, description: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        title="Create Payroll Run"
        submitText="Create"
        loading={createPayrollRun.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newPayrollRun.periodLabel.trim() || !newPayrollRun.payDate) {
            toast.error("Period label and pay date are required");
            return;
          }
          const gross = Number(newPayrollRun.totalGross || 0);
          const deductions = Number(newPayrollRun.totalDeductions || 0);
          const net = Number(newPayrollRun.totalNet || 0);
          if (!Number.isFinite(gross) || !Number.isFinite(deductions) || !Number.isFinite(net)) {
            toast.error("Payroll totals must be valid numbers");
            return;
          }
          createPayrollRun.mutate({
            periodLabel: newPayrollRun.periodLabel.trim(),
            payDate: new Date(newPayrollRun.payDate).toISOString(),
            status: "draft",
            totalGross: gross,
            totalDeductions: deductions,
            totalNet: net,
            notes: newPayrollRun.notes.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Period Label" required>
            <Input value={newPayrollRun.periodLabel} onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, periodLabel: e.target.value }))} />
          </FormField>
          <FormField label="Pay Date" required>
            <Input type="date" value={newPayrollRun.payDate} onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, payDate: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Total Gross">
              <Input type="number" min="0" step="0.01" value={newPayrollRun.totalGross} onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, totalGross: e.target.value }))} />
            </FormField>
            <FormField label="Total Deductions">
              <Input type="number" min="0" step="0.01" value={newPayrollRun.totalDeductions} onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, totalDeductions: e.target.value }))} />
            </FormField>
            <FormField label="Total Net">
              <Input type="number" min="0" step="0.01" value={newPayrollRun.totalNet} onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, totalNet: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea rows={3} value={newPayrollRun.notes} onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, notes: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isPayrollEntryModalOpen}
        onClose={() => setIsPayrollEntryModalOpen(false)}
        title="Add Payroll Entry"
        submitText="Add Entry"
        loading={createPayrollEntry.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!selectedPayrollRunId) {
            toast.error("Select a payroll run first");
            return;
          }
          const grossPay = Number(newPayrollEntry.grossPay || 0);
          const deductions = Number(newPayrollEntry.deductions || 0);
          const netPay = Number(newPayrollEntry.netPay || 0);
          if (!Number.isFinite(grossPay) || !Number.isFinite(deductions) || !Number.isFinite(netPay)) {
            toast.error("Payroll values must be valid numbers");
            return;
          }

          createPayrollEntry.mutate({
            payrollRunId: selectedPayrollRunId,
            employeeId: newPayrollEntry.employeeId || undefined,
            grossPay,
            deductions,
            netPay,
            status: "draft",
            notes: newPayrollEntry.notes.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Employee">
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newPayrollEntry.employeeId} onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, employeeId: e.target.value }))}>
              <option value="">Unassigned</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Gross Pay" required>
              <Input type="number" min="0" step="0.01" value={newPayrollEntry.grossPay} onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, grossPay: e.target.value }))} />
            </FormField>
            <FormField label="Deductions">
              <Input type="number" min="0" step="0.01" value={newPayrollEntry.deductions} onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, deductions: e.target.value }))} />
            </FormField>
            <FormField label="Net Pay" required>
              <Input type="number" min="0" step="0.01" value={newPayrollEntry.netPay} onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, netPay: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea rows={3} value={newPayrollEntry.notes} onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, notes: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function Tile({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
          </div>
          <div className="rounded-md bg-muted p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
