/**
 * Payment Tracking
 *
 * Track payments received and payment history.
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
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Plus,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { invoicingApi } from "@/lib/api";

export const Route = createFileRoute("/app/invoicing/payments")({
  component: PaymentTracking,
});

type Payment = {
  id: string;
  invoiceNumber: string;
  client: string;
  amount: number;
  method: "bank" | "card" | "paypal" | "check";
  status: "completed" | "pending" | "failed";
  date: string;
  reference: string;
};

const EMPTY_PAYMENTS: any[] = [];

function PaymentTracking() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const paymentsQuery = useQuery({
    queryKey: ["invoicing/payments"],
    queryFn: () => invoicingApi.payments.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (paymentsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => paymentsQuery.refetch()}>Retry</Button>
    </div>
  );

  const payments: any[] = (paymentsQuery as any)?.data?.data ?? [];

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    if (methodFilter !== "all" && payment.method !== methodFilter) return false;
    if (!search.trim()) return true;
    return (
      payment.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      payment.client.toLowerCase().includes(search.toLowerCase()) ||
      payment.reference.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalReceived = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  const getMethodIcon = (method: Payment["method"]) => {
    switch (method) {
      case "bank": return <Banknote className="h-4 w-4" />;
      case "card": return <CreditCard className="h-4 w-4" />;
      case "paypal": return <Wallet className="h-4 w-4" />;
      case "check": return <Receipt className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const variants: Record<Payment["status"], "success" | "warning" | "danger"> = {
      completed: "success",
      pending: "warning",
      failed: "danger",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Payments</h2>
          <p className="text-sm text-muted-foreground">Track payments received and history</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Record Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Received" value={`$${(totalReceived / 1000).toFixed(1)}K`} color="text-emerald-400" />
        <StatCard title="Pending" value={`$${(pendingPayments / 1000).toFixed(1)}K`} color="text-amber-400" />
        <StatCard title="This Month" value="$23.85K" color="text-primary" />
        <StatCard title="Transactions" value={payments.length + ""} color="text-violet-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Methods</option>
          <option value="bank">Bank Transfer</option>
          <option value="card">Credit Card</option>
          <option value="paypal">PayPal</option>
          <option value="check">Check</option>
        </select>
      </div>

      {/* Payment List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Reference</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{payment.reference}</td>
                  <td className="px-4 py-3 text-sm text-primary">{payment.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm">{payment.client}</td>
                  <td className="px-4 py-3 text-sm font-medium text-emerald-400">${payment.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(payment.method)}
                      <span className="text-sm capitalize">{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className={`font-black text-xl mt-0.5 ${color}`}>{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
