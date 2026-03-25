/**
 * Invoices List
 *
 * Full invoice management with status filtering, stats, and actions.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { invoicingApi } from "@/lib/api";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional(),
});

export const Route = createFileRoute("/app/invoicing/invoices/_index")({
  validateSearch: searchSchema,
  component: InvoicesPage,
});

const STATUS_BADGE: Record<string, string> = {
  paid: "success",
  overdue: "danger",
  sent: "primary",
  draft: "outline",
  viewed: "primary",
  cancelled: "outline",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "text-emerald-400",
  overdue: "text-rose-400",
  sent: "text-cyan-400",
  draft: "text-muted-foreground",
  viewed: "text-cyan-400",
  cancelled: "text-muted-foreground",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function handlePrintInvoice(invoice: any) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoiceNumber ?? invoice.id}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .title { font-size: 32px; font-weight: bold; color: #4f46e5; }
        .label { font-size: 11px; color: #666; text-transform: uppercase; }
        .value { font-size: 14px; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { background: #f5f5f5; padding: 10px; text-align: left; font-size: 12px; }
        td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
        .total-row { font-weight: bold; font-size: 15px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div><div class="title">INVOICE</div><div style="color:#666;margin-top:4px">${invoice.invoiceNumber ?? "#" + invoice.id}</div></div>
        <div style="text-align:right">
          <div class="label">Status</div><div class="value">${invoice.status ?? "Draft"}</div>
          <div class="label" style="margin-top:8px">Due Date</div><div class="value">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}</div>
        </div>
      </div>
      <div style="margin-bottom:24px">
        <div class="label">Bill To</div>
        <div class="value" style="font-size:16px;font-weight:600">${invoice.clientName ?? invoice.client ?? "—"}</div>
        <div style="color:#666;font-size:13px">${invoice.clientEmail ?? ""}</div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          ${(invoice.lineItems ?? invoice.items ?? [{ description: "Services", quantity: 1, rate: invoice.amount ?? 0, amount: invoice.amount ?? 0 }])
            .map((item: any) => `<tr><td>${item.description ?? item.name ?? "—"}</td><td>${item.quantity ?? 1}</td><td>$${(item.rate ?? item.unitPrice ?? 0).toLocaleString()}</td><td>$${(item.amount ?? item.total ?? 0).toLocaleString()}</td></tr>`).join("")}
        </tbody>
        <tfoot>
          <tr class="total-row"><td colspan="3">Total</td><td>$${(invoice.amount ?? invoice.total ?? invoice.totalAmount ?? 0).toLocaleString()}</td></tr>
        </tfoot>
      </table>
      <button onclick="window.print()" style="margin-top:32px;padding:10px 24px;background:#4f46e5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">Print / Save as PDF</button>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function InvoicesPage() {
  const qc = useQueryClient();
  const { q: search = "", status: statusFilter = "all", page = 1 } = useSearch({ from: "/app/invoicing/invoices/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/invoices/_index" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/invoices", statusFilter, search, page],
    queryFn: () =>
      invoicingApi.invoices.list({
        page,
        limit: PAGE_SIZE,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      }),
    retry: false,
  });

  const INVOICES_KEY = ["invoicing/invoices"] as const;

  const sendMutation = useMutation({
    mutationFn: (id: string) => invoicingApi.invoices.send(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: INVOICES_KEY });
      const previous = qc.getQueryData([...INVOICES_KEY, statusFilter, search]);
      qc.setQueryData([...INVOICES_KEY, statusFilter, search], (old: any) => ({
        ...old,
        data: (old?.data ?? []).map((item: any) => item.id === id ? { ...item, status: "sent" } : item),
      }));
      return { previous };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...INVOICES_KEY, statusFilter, search], ctx.previous);
      toast.error("Failed to send invoice");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicingApi.invoices.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: INVOICES_KEY });
      const previous = qc.getQueryData([...INVOICES_KEY, statusFilter, search]);
      qc.setQueryData([...INVOICES_KEY, statusFilter, search], (old: any) => ({
        ...old,
        data: (old?.data ?? []).filter((item: any) => item.id !== id),
      }));
      return { previous };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...INVOICES_KEY, statusFilter, search], ctx.previous);
      toast.error("Failed to delete invoice");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
  });

  const invoices: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

  const paidThisMonth = invoices
    .filter((i) => {
      if (i.status !== "paid") return false;
      const d = new Date(i.paidAt ?? i.updatedAt ?? "");
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  const allSelected =
    invoices.length > 0 && invoices.every((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkExport = () => {
    const selected = invoices.filter((i) => selectedIds.has(i.id));
    const csv = [
      ["Invoice #", "Client", "Amount", "Status", "Due Date"].join(","),
      ...selected.map((i: any) =>
        [
          i.invoiceNumber ?? i.id?.slice(0, 8) ?? "",
          i.clientName ?? i.clientEmail ?? "",
          String(Number(i.totalAmount) || 0),
          i.status ?? "",
          i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "",
        ].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkSend = async () => {
    const draftIds = invoices
      .filter((i) => selectedIds.has(i.id) && i.status === "draft")
      .map((i) => i.id);
    for (const id of draftIds) {
      await invoicingApi.invoices.send(id);
    }
    qc.invalidateQueries({ queryKey: ["invoicing/invoices"] });
    setSelectedIds(new Set());
    if (draftIds.length > 0) {
      toast.success(`Sent ${draftIds.length} invoice(s)`);
    }
  };

  const statuses = ["all", "draft", "sent", "paid", "overdue", "cancelled"];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load invoices.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Invoice?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteMutation.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outstanding</p>
                <p className="mt-0.5 text-2xl font-black">{fmt(outstanding)}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paid This Month</p>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{fmt(paidThisMonth)}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overdue</p>
                <p className="mt-0.5 text-2xl font-black text-rose-400">{overdueCount}</p>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => navigate({ search: (prev) => ({ ...prev, status: s, page: 1 }) })}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) =>
                navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined, page: 1 }) })
              }
              className="pl-9 h-8 w-56 text-sm"
            />
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkSend}>
            <Send className="h-3.5 w-3.5 mr-1" /> Send Drafts
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={8} cols={5} />
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No invoices found</p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create your first invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                        aria-label="Select all invoices"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv.id)}
                          onChange={() => toggleSelect(inv.id)}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                          aria-label={`Select invoice ${inv.invoiceNumber ?? inv.id}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-primary">
                        {inv.invoiceNumber ?? inv.id?.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{inv.clientName ?? inv.clientEmail ?? "—"}</p>
                        {inv.clientEmail && inv.clientName && (
                          <p className="text-xs text-muted-foreground">{inv.clientEmail}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        {fmt(Number(inv.totalAmount) || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {fmtDate(inv.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[inv.status ?? "draft"] as any}>
                          {inv.status ?? "draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs"
                              onClick={() => sendMutation.mutate(inv.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="h-3 w-3" />
                              Send
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handlePrintInvoice(inv)}
                            title="Print / Download PDF"
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({ id: inv.id, name: inv.invoiceNumber ?? inv.clientName ?? inv.id?.slice(0, 8) ?? inv.id })}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
