/**
 * Recurring Invoices
 *
 * Set up and manage recurring invoice schedules.
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
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/recurring")({
  component: RecurringInvoices,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

type RecurringInvoice = {
  id: string;
  client: string;
  description: string;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "annually";
  nextDate: string;
  status: "active" | "paused" | "completed";
  lastCreated: string;
  totalCreated: number;
};

const EMPTY_RECURRING: any[] = [];

function RecurringInvoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const createRecurringMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/invoicing/recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/recurring"] }),
  });

  const updateRecurringMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/invoicing/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/recurring"] }),
  });

  const recurringQuery = useQuery({
    queryKey: ["invoicing/recurring"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/recurring`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (recurringQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => recurringQuery.refetch()}>Retry</Button>
    </div>
  );
  const recurring: any[] = (recurringQuery as any)?.data?.data ?? [];

  const filteredRecurring = recurring.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (!search.trim()) return true;
    return (
      item.client.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalMonthlyValue = recurring.filter(r => r.status === "active").reduce((sum, r) => {
    switch (r.frequency) {
      case "weekly": return sum + (r.amount * 4);
      case "monthly": return sum + r.amount;
      case "quarterly": return sum + (r.amount / 3);
      case "annually": return sum + (r.amount / 12);
      default: return sum;
    }
  }, 0);

  const getFrequencyBadge = (frequency: RecurringInvoice["frequency"]) => {
    return <Badge variant="outline">{frequency}</Badge>;
  };

  const getStatusBadge = (status: RecurringInvoice["status"]) => {
    const variants: Record<RecurringInvoice["status"], "success" | "warning" | "outline"> = {
      active: "success",
      paused: "warning",
      completed: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Recurring Invoices</h2>
          <p className="text-sm text-muted-foreground">Automate your billing with recurring schedules</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => createRecurringMutation.mutate({ client: "New Client", description: "Monthly Service", amount: 0, frequency: "monthly" })} disabled={createRecurringMutation.isPending}>
          New Recurring
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Active Recurring" value={recurring.filter(r => r.status === "active").length + ""} color="text-emerald-400" />
        <StatCard title="Monthly Value" value={`$${(totalMonthlyValue / 1000).toFixed(1)}K`} color="text-primary" />
        <StatCard title="Paused" value={recurring.filter(r => r.status === "paused").length + ""} color="text-amber-400" />
        <StatCard title="Invoices Created" value={recurring.reduce((sum, r) => sum + r.totalCreated, 0) + ""} color="text-violet-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search recurring..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Recurring List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Frequency</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Next Date</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecurring.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{item.client}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.description}</td>
                  <td className="px-4 py-3 text-sm font-medium">${item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{getFrequencyBadge(item.frequency)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(item.nextDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {item.status === "active" ? (
                        <Button variant="ghost" size="sm" leftIcon={<Pause className="h-4 w-4" />} onClick={() => updateRecurringMutation.mutate({ id: item.id, status: "paused" })} disabled={updateRecurringMutation.isPending}>
                          Pause
                        </Button>
                      ) : item.status === "paused" ? (
                        <Button variant="ghost" size="sm" leftIcon={<Play className="h-4 w-4" />} onClick={() => updateRecurringMutation.mutate({ id: item.id, status: "active" })} disabled={updateRecurringMutation.isPending}>
                          Resume
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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
            <RefreshCw className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
