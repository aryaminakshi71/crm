/**
 * Expenses List
 *
 * Track and manage business expenses with category/status filtering.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Receipt,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/invoicing/expenses/_index")({
  validateSearch: searchSchema,
  component: ExpensesPage,
});

const STATUS_BADGE: Record<string, string> = {
  approved: "success",
  rejected: "danger",
  pending: "outline",
};

const CATEGORY_COLORS: Record<string, string> = {
  travel: "bg-blue-500/10 text-blue-400",
  software: "bg-violet-500/10 text-violet-400",
  marketing: "bg-amber-500/10 text-amber-400",
  operations: "bg-emerald-500/10 text-emerald-400",
  equipment: "bg-cyan-500/10 text-cyan-400",
  other: "bg-muted text-muted-foreground",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ExpensesPage() {
  const qc = useQueryClient();
  const { q = "", status, page = 1 } = useSearch({ from: "/app/invoicing/expenses/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/expenses/_index" });
  const search = q;
  const statusFilter = status ?? "all";
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v, page: 1 }) });
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/expenses", statusFilter],
    queryFn: () =>
      invoicingApi.expenses.list({
        page: 1,
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => invoicingApi.expenses.update(id, { status: "approved" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoicing/expenses"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => invoicingApi.expenses.update(id, { status: "rejected" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoicing/expenses"] }),
  });

  const expenses: any[] = (data as any)?.data ?? [];

  const now = new Date();
  const totalThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.date ?? e.expenseDate ?? e.createdAt ?? "");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const pendingCount = expenses.filter((e) => e.status === "pending").length;

  const categories = ["all", ...Array.from(new Set(expenses.map((e) => (e.category ?? "other").toLowerCase())))];

  const filtered = expenses.filter((e) => {
    const matchSearch =
      !search ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || (e.category ?? "other").toLowerCase() === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load expenses.</p>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total This Month</p>
                <p className="mt-0.5 text-2xl font-black text-rose-400">{fmt(totalThisMonth)}</p>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5">
                <Receipt className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Approval</p>
                <p className="mt-0.5 text-2xl font-black text-amber-400">{pendingCount}</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Expenses</p>
                <p className="mt-0.5 text-2xl font-black">{expenses.length}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          {["all", "pending", "approved", "rejected"].map((s) => (
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
          <span className="text-muted-foreground/40">|</span>
          {/* Category filter */}
          {categories.slice(0, 5).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                categoryFilter === c
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 w-56 text-sm"
            />
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading expenses...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Receipt className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No expenses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e: any) => {
                    const cat = (e.category ?? "other").toLowerCase();
                    const colorClass = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other;
                    return (
                      <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{e.description ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${colorClass}`}>
                            {e.category ?? "other"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-rose-400">
                          {fmt(Number(e.amount) || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {fmtDate(e.date ?? e.expenseDate ?? e.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{e.vendor ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE[e.status ?? "pending"] as any}>
                            {e.status ?? "pending"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {e.status === "pending" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs text-emerald-400"
                                onClick={() => approveMutation.mutate(e.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs text-rose-400"
                                onClick={() => rejectMutation.mutate(e.id)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          )}
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
