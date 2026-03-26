/**
 * Expense Management
 *
 * Track and categorize business expenses.
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  Filter,
  Plus,
  Receipt,
  Search,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { invoicingApi } from "@/lib/api";

export const Route = createFileRoute("/app/invoicing/expenses")({
  component: ExpenseManagement,
});

type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  status: "approved" | "pending" | "rejected";
  receipt: boolean;
};

const EMPTY_EXPENSES: any[] = [];

const EMPTY_CATEGORY_DATA = [
  { name: "Software", value: 0, color: "#22d3ee" },
  { name: "Marketing", value: 0, color: "#a78bfa" },
  { name: "Equipment", value: 0, color: "#f472b6" },
  { name: "Travel", value: 0, color: "#34d399" },
  { name: "Operations", value: 0, color: "#fbbf24" },
];

function ExpenseManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const createExpenseMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => invoicingApi.expenses.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/expenses"] }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => invoicingApi.expenses.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/expenses"] }),
  });

  const expensesQuery = useQuery({
    queryKey: ["invoicing/expenses"],
    queryFn: () => invoicingApi.expenses.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (expensesQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => expensesQuery.refetch()}>Retry</Button>
    </div>
  );

  const expenses: any[] = (expensesQuery as any)?.data?.data ?? [];

  const filteredExpenses = expenses.filter((expense) => {
    if (categoryFilter !== "all" && expense.category !== categoryFilter) return false;
    if (statusFilter !== "all" && expense.status !== statusFilter) return false;
    if (!search.trim()) return true;
    return (
      expense.description.toLowerCase().includes(search.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalExpenses = expenses.filter(e => e.status === "approved").reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Expenses</h2>
          <p className="text-sm text-muted-foreground">Track and categorize business expenses</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => createExpenseMutation.mutate({ description: "New Expense", category: "Operations", amount: 0, vendor: "", date: new Date().toISOString().split("T")[0] })} disabled={createExpenseMutation.isPending}>
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Expenses" value={`$${(totalExpenses / 1000).toFixed(1)}K`} color="text-rose-400" />
        <StatCard title="Pending Approval" value={`$${(pendingExpenses / 1000).toFixed(1)}K`} color="text-amber-400" />
        <StatCard title="This Month" value="$8.9K" color="text-primary" />
        <StatCard title="Categories" value="8" color="text-violet-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EMPTY_CATEGORY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {EMPTY_CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {EMPTY_CATEGORY_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Categories</option>
          <option value="Software">Software</option>
          <option value="Marketing">Marketing</option>
          <option value="Travel">Travel</option>
          <option value="Operations">Operations</option>
          <option value="Equipment">Equipment</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Expense List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{expense.description}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{expense.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{expense.vendor}</td>
                  <td className="px-4 py-3 text-sm font-medium text-rose-400">-${expense.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={expense.status === "approved" ? "success" : expense.status === "pending" ? "warning" : "danger"}>
                      {expense.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {expense.receipt ? (
                      <Receipt className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
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
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
