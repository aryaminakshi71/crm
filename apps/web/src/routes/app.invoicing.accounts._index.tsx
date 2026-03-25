/**
 * Chart of Accounts
 *
 * View and manage the chart of accounts grouped by account type.
 */

import {
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
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  type: z.enum(["all", "asset", "liability", "equity", "revenue", "expense"]).optional().default("all"),
});

export const Route = createFileRoute("/app/invoicing/accounts/_index")({
  validateSearch: searchSchema,
  component: AccountsPage,
});

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  asset: { label: "Assets", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  liability: { label: "Liabilities", color: "text-rose-400", bgColor: "bg-rose-500/10" },
  equity: { label: "Equity", color: "text-violet-400", bgColor: "bg-violet-500/10" },
  revenue: { label: "Revenue", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  expense: { label: "Expenses", color: "text-amber-400", bgColor: "bg-amber-500/10" },
};

const TYPE_ORDER = ["asset", "liability", "equity", "revenue", "expense"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function AccountsPage() {
  const { q: search, type: typeFilter } = useSearch({ from: "/app/invoicing/accounts/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/accounts/_index" });

  const setSearch = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, q: value || undefined }) });
  const setTypeFilter = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, type: value as any }) });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("asset");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createAccountMutation = useMutation({
    mutationFn: (accountData: { name: string; code?: string; type: string }) =>
      invoicingApi.accounts.create(accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing/accounts"] });
      toast.success("Account created successfully");
      setIsAddOpen(false);
      setNewName("");
      setNewCode("");
      setNewType("asset");
    },
    onError: () => toast.error("Failed to create account"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/invoicing/accounts/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Delete failed");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing/accounts"] });
      toast.success("Account deleted");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to delete account"),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/accounts"],
    queryFn: () => invoicingApi.accounts.list(),
    retry: false,
  });

  const accounts: any[] = (data as any)?.data ?? [];

  const filtered = accounts.filter((a) => {
    const matchSearch =
      !search.trim() ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.code?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || (a.type ?? "asset").toLowerCase() === typeFilter;
    return matchSearch && matchType;
  });

  // Group by type
  const grouped = TYPE_ORDER.reduce(
    (acc, type) => {
      acc[type] = filtered.filter((a) => (a.type ?? "asset").toLowerCase() === type);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  const toggleSection = (type: string) => {
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load chart of accounts.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {TYPE_ORDER.map((type) => {
          const cfg = TYPE_CONFIG[type];
          const total = (grouped[type] ?? []).reduce((s, a) => s + (Number(a.balance) || 0), 0);
          return (
            <Card key={type} className="border-border/60">
              <CardContent className="p-4">
                <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                  {cfg.label}
                </p>
                <p className="mt-0.5 text-xl font-black">{fmt(total)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{(grouped[type] ?? []).length} accounts</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 w-56 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-3 py-1 text-sm"
          >
            <option value="all">All Types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Account
        </Button>
      </div>

      {isAddOpen && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">New Account</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Code (e.g. 1000)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-28"
              />
              <Input
                placeholder="Account name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
            </div>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newName.trim() || createAccountMutation.isPending}
                onClick={() =>
                  createAccountMutation.mutate({
                    name: newName.trim(),
                    code: newCode.trim() || undefined,
                    type: newType,
                  })
                }
              >
                {createAccountMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Groups */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Loading accounts...
        </div>
      ) : (
        <div className="space-y-4">
          {TYPE_ORDER.map((type) => {
            const cfg = TYPE_CONFIG[type];
            const group = grouped[type] ?? [];
            if (group.length === 0 && search) return null;
            const isCollapsed = collapsed[type];
            const groupTotal = group.reduce((s, a) => s + (Number(a.balance) || 0), 0);

            return (
              <Card key={type} className="border-border/60 overflow-hidden">
                <button
                  onClick={() => toggleSection(type)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-sm font-bold uppercase tracking-wide ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">({group.length})</span>
                  </div>
                  <span className={`text-sm font-bold ${cfg.color}`}>{fmt(groupTotal)}</span>
                </button>

                {!isCollapsed && group.length > 0 && (
                  <div className="border-t border-border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/10 text-left">
                          <th className="px-4 py-2 text-xs font-medium text-muted-foreground">Code</th>
                          <th className="px-4 py-2 text-xs font-medium text-muted-foreground">Account Name</th>
                          <th className="px-4 py-2 text-xs font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-2 text-xs font-medium text-muted-foreground text-right">Balance</th>
                          <th className="px-4 py-2 text-xs font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((a: any) => (
                          <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-2.5 text-sm font-mono text-muted-foreground">{a.code ?? "—"}</td>
                            <td className="px-4 py-2.5 text-sm font-medium">{a.name ?? "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${cfg.bgColor} ${cfg.color}`}>
                                {a.type ?? type}
                              </span>
                            </td>
                            <td className={`px-4 py-2.5 text-sm font-bold text-right ${cfg.color}`}>
                              {fmt(Number(a.balance) || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {deleteConfirmId === a.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-6 text-xs"
                                      disabled={deleteAccountMutation.isPending}
                                      onClick={() => deleteAccountMutation.mutate(a.id)}
                                    >
                                      {deleteAccountMutation.isPending ? "..." : "Confirm"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs"
                                      onClick={() => setDeleteConfirmId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteConfirmId(a.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className={`border-t border-border ${cfg.bgColor}/30`}>
                          <td colSpan={3} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wide ${cfg.color}`}>
                            Total {cfg.label}
                          </td>
                          <td className={`px-4 py-2.5 text-sm font-black text-right ${cfg.color}`}>
                            {fmt(groupTotal)}
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {!isCollapsed && group.length === 0 && (
                  <div className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    No {cfg.label.toLowerCase()} accounts configured
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
