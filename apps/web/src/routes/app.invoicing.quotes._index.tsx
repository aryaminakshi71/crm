/**
 * Quotes List
 *
 * Manage quotes with conversion tracking and stats.
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRightCircle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Printer,
  Search,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/invoicing/quotes/_index")({
  validateSearch: searchSchema,
  component: QuotesPage,
});

const STATUS_BADGE: Record<string, string> = {
  accepted: "success",
  declined: "danger",
  sent: "primary",
  draft: "outline",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function handlePrintQuote(quote: any) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Quote ${quote.quoteNumber ?? "#" + quote.id}</title>
  <style>body{font-family:sans-serif;padding:40px;color:#111}
  .header{display:flex;justify-content:space-between;margin-bottom:32px}
  .title{font-size:32px;font-weight:bold;color:#4f46e5}
  table{width:100%;border-collapse:collapse;margin-top:24px}
  th{background:#f5f5f5;padding:10px;text-align:left;font-size:12px}
  td{padding:10px;border-bottom:1px solid #eee;font-size:13px}
  .total{font-weight:bold;font-size:16px}
  @media print{button{display:none}}</style></head>
  <body>
  <div class="header">
    <div><div class="title">QUOTE</div><div style="color:#666;margin-top:4px">${quote.quoteNumber ?? "#" + quote.id}</div></div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#666;text-transform:uppercase">Valid Until</div>
      <div>${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "—"}</div>
      <div style="font-size:11px;color:#666;text-transform:uppercase;margin-top:8px">Status</div>
      <div>${quote.status ?? "Draft"}</div>
    </div>
  </div>
  <div style="margin-bottom:24px">
    <div style="font-size:11px;color:#666;text-transform:uppercase">Prepared For</div>
    <div style="font-size:16px;font-weight:600">${quote.clientName ?? quote.client ?? "—"}</div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>
      ${(quote.lineItems ?? quote.items ?? [{ description: "Services", quantity: 1, rate: quote.amount ?? 0, amount: quote.amount ?? 0 }])
        .map((item: any) => `<tr><td>${item.description ?? "—"}</td><td>${item.quantity ?? 1}</td><td>$${(item.rate ?? 0).toLocaleString()}</td><td>$${(item.amount ?? 0).toLocaleString()}</td></tr>`).join("")}
    </tbody>
    <tfoot><tr class="total"><td colspan="3">Total</td><td>$${(quote.amount ?? quote.total ?? 0).toLocaleString()}</td></tr></tfoot>
  </table>
  <button onclick="window.print()" style="margin-top:32px;padding:10px 24px;background:#4f46e5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">Print / Save as PDF</button>
  </body></html>`);
  win.document.close();
}

function QuotesPage() {
  const qc = useQueryClient();
  const { q = "", status, page = 1 } = useSearch({ from: "/app/invoicing/quotes/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/quotes/_index" });
  const search = q;
  const statusFilter = status ?? "all";
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v, page: 1 }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/quotes", statusFilter],
    queryFn: () =>
      invoicingApi.quotes.list({
        page: 1,
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    retry: false,
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => invoicingApi.quotes.convert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoicing/quotes"] }),
  });

  const quotes: any[] = (data as any)?.data ?? [];

  const filtered = search
    ? quotes.filter(
        (q) =>
          q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
          q.clientName?.toLowerCase().includes(search.toLowerCase()) ||
          q.clientEmail?.toLowerCase().includes(search.toLowerCase()),
      )
    : quotes;

  const totalSent = quotes.filter((q) => q.status !== "draft").length;
  const accepted = quotes.filter((q) => q.status === "accepted").length;
  const conversionRate = totalSent > 0 ? Math.round((accepted / totalSent) * 100) : 0;
  const pendingValue = quotes
    .filter((q) => q.status === "sent")
    .reduce((s, q) => s + (Number(q.totalAmount) || 0), 0);

  const statuses = ["all", "draft", "sent", "accepted", "declined"];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load quotes.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Sent</p>
                <p className="mt-0.5 text-2xl font-black">{totalSent}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conversion Rate</p>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{conversionRate}%</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Value</p>
                <p className="mt-0.5 text-2xl font-black text-amber-400">{fmt(pendingValue)}</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <Clock className="h-4 w-4 text-amber-400" />
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
              onClick={() => setStatusFilter(s)}
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
              placeholder="Search quotes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 w-56 text-sm"
            />
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading quotes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No quotes found</p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create your first quote
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Quote #</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Valid Until</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q: any) => (
                    <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-primary">
                        {q.quoteNumber ?? q.id?.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{q.clientName ?? q.clientEmail ?? "—"}</p>
                        {q.clientEmail && q.clientName && (
                          <p className="text-xs text-muted-foreground">{q.clientEmail}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        {fmt(Number(q.totalAmount) || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {fmtDate(q.validUntil ?? q.expiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[q.status ?? "draft"] as any}>
                          {q.status ?? "draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {q.status === "accepted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs text-emerald-400"
                              onClick={() => convertMutation.mutate(q.id)}
                              disabled={convertMutation.isPending}
                            >
                              <ArrowRightCircle className="h-3 w-3" />
                              Convert
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handlePrintQuote(q)}
                            title="Print / Save as PDF"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
