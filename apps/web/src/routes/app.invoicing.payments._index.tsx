/**
 * Payments List
 *
 * View all received payments with method breakdown and stats.
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Banknote,
  CreditCard,
  DollarSign,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/invoicing/payments/_index")({
  validateSearch: searchSchema,
  component: PaymentsPage,
});

const METHOD_ICON: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-3.5 w-3.5" />,
  bank: <Banknote className="h-3.5 w-3.5" />,
  cash: <Wallet className="h-3.5 w-3.5" />,
};

const METHOD_COLOR: Record<string, string> = {
  card: "text-primary",
  bank: "text-emerald-400",
  cash: "text-amber-400",
  stripe: "text-primary",
  paypal: "text-blue-400",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PaymentsPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/invoicing/payments/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/payments" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/payments"],
    queryFn: () => invoicingApi.payments.list({ page: 1, limit: 50 }),
    retry: false,
  });

  const payments: any[] = (data as any)?.data ?? [];

  const now = new Date();
  const collectedThisMonth = payments
    .filter((p) => {
      const d = new Date(p.paidAt ?? p.createdAt ?? "");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const methodBreakdown = payments.reduce(
    (acc, p) => {
      const m = p.paymentMethod ?? p.method ?? "other";
      acc[m] = (acc[m] || 0) + (Number(p.amount) || 0);
      return acc;
    },
    {} as Record<string, number>,
  );

  const filtered = search
    ? payments.filter(
        (p) =>
          p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
          p.clientName?.toLowerCase().includes(search.toLowerCase()),
      )
    : payments;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load payments.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collected This Month</p>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{fmt(collectedThisMonth)}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        {Object.entries(methodBreakdown)
          .slice(0, 3)
          .map(([method, total]) => (
            <Card key={method} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground capitalize">
                      {method}
                    </p>
                    <p className={`mt-0.5 text-xl font-black ${METHOD_COLOR[method] ?? "text-foreground"}`}>
                      {fmt(total as number)}
                    </p>
                  </div>
                  <div className={`rounded-xl bg-muted/30 p-2.5 ${METHOD_COLOR[method] ?? ""}`}>
                    {METHOD_ICON[method] ?? <Wallet className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 w-56 text-sm"
          />
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Record Payment
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading payments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <DollarSign className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No payments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Method</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => {
                    const method = p.paymentMethod ?? p.method ?? "other";
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {fmtDate(p.paidAt ?? p.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-medium text-primary">
                          {p.invoiceNumber ?? p.invoiceId?.slice(0, 8) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {p.clientName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-400">
                          {fmt(Number(p.amount) || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1.5 text-sm capitalize ${METHOD_COLOR[method] ?? "text-muted-foreground"}`}>
                            {METHOD_ICON[method] ?? <Wallet className="h-3.5 w-3.5" />}
                            {method}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.status === "completed" ? "success" : p.status === "failed" ? "danger" : "outline"}>
                            {p.status ?? "completed"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
