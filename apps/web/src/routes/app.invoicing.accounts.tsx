/**
 * Chart of Accounts
 *
 * Complete chart of accounts for the business.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calculator,
  Edit,
  Folder,
  Plus,
  Search,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/accounts")({
  component: ChartOfAccounts,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

type Account = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  subtype: string;
  balance: number;
  status: "active" | "inactive";
};

const EMPTY_ACCOUNTS: any[] = [];

const accountTypes = [
  { type: "asset", label: "Assets", color: "text-primary" },
  { type: "liability", label: "Liabilities", color: "text-rose-400" },
  { type: "equity", label: "Equity", color: "text-emerald-400" },
  { type: "revenue", label: "Revenue", color: "text-violet-400" },
  { type: "expense", label: "Expenses", color: "text-amber-400" },
];

function ChartOfAccounts() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const createAccountMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/invoicing/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/accounts"] }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/invoicing/accounts/${id}`, {
        method: "DELETE",
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/accounts"] }),
  });

  const accountsQuery = useQuery({
    queryKey: ["invoicing/accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/accounts`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (accountsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => accountsQuery.refetch()}>Retry</Button>
    </div>
  );
  const accounts: any[] = (accountsQuery as any)?.data?.data ?? [];

  const filteredAccounts = accounts.filter((account) => {
    if (typeFilter !== "all" && account.type !== typeFilter) return false;
    if (!search.trim()) return true;
    return (
      account.code.includes(search) ||
      account.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getTypeColor = (type: Account["type"]) => {
    return accountTypes.find(t => t.type === type)?.color || "text-muted-foreground";
  };

  const totals = {
    asset: accounts.filter(a => a.type === "asset").reduce((sum, a) => sum + a.balance, 0),
    liability: accounts.filter(a => a.type === "liability").reduce((sum, a) => sum + a.balance, 0),
    equity: accounts.filter(a => a.type === "equity").reduce((sum, a) => sum + a.balance, 0),
    revenue: accounts.filter(a => a.type === "revenue").reduce((sum, a) => sum + a.balance, 0),
    expense: accounts.filter(a => a.type === "expense").reduce((sum, a) => sum + a.balance, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Chart of Accounts</h2>
          <p className="text-sm text-muted-foreground">Complete list of all accounts</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {accountTypes.map((t) => (
          <Card key={t.type} className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className={`text-[10px] font-black uppercase tracking-widest ${t.color}`}>{t.label}</p>
              <p className={`font-black text-xl mt-0.5 ${t.color}`}>
                ${(totals[t.type as keyof typeof totals] / 1000).toFixed(1)}K
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or name..." />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Types</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expenses</option>
        </select>
      </div>

      {/* Account List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Account Code</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Account Name</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Subtype</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Balance</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{account.code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{account.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`capitalize ${getTypeColor(account.type)}`}>
                      {account.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{account.subtype}</td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${account.balance < 0 ? "text-rose-400" : ""}`}>
                    ${Math.abs(account.balance).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={account.status === "active" ? "success" : "outline"}>
                      {account.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAccountMutation.mutate(account.id)} disabled={deleteAccountMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Account"
        submitText="Add Account"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const formData = new FormData(form);
          createAccountMutation.mutate(
            { code: formData.get("code"), name: formData.get("name"), type: formData.get("type"), subtype: formData.get("subtype") },
            { onSuccess: () => setIsCreateModalOpen(false) }
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Account Code" required>
            <Input name="code" placeholder="e.g., 5000" required />
          </FormField>
          <FormField label="Account Name" required>
            <Input name="name" placeholder="e.g., Marketing Expenses" required />
          </FormField>
          <FormField label="Account Type" required>
            <select name="type" className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </FormField>
          <FormField label="Subtype">
            <Input name="subtype" placeholder="e.g., Operating Expense" />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
