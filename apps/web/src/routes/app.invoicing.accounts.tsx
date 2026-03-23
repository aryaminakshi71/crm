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
import { useQuery } from "@tanstack/react-query";
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
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
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

const mockAccounts: Account[] = [
  // Assets
  { id: "1", code: "1000", name: "Cash", type: "asset", subtype: "Current Asset", balance: 125000, status: "active" },
  { id: "2", code: "1100", name: "Accounts Receivable", type: "asset", subtype: "Current Asset", balance: 89400, status: "active" },
  { id: "3", code: "1200", name: "Inventory", type: "asset", subtype: "Current Asset", balance: 45000, status: "active" },
  { id: "4", code: "1500", name: "Property & Equipment", type: "asset", subtype: "Fixed Asset", balance: 180000, status: "active" },
  { id: "5", code: "1600", name: "Accumulated Depreciation", type: "asset", subtype: "Fixed Asset", balance: -45000, status: "active" },
  // Liabilities
  { id: "6", code: "2000", name: "Accounts Payable", type: "liability", subtype: "Current Liability", balance: 35000, status: "active" },
  { id: "7", code: "2100", name: "Accrued Expenses", type: "liability", subtype: "Current Liability", balance: 18000, status: "active" },
  { id: "8", code: "2200", name: "Deferred Revenue", type: "liability", subtype: "Current Liability", balance: 42000, status: "active" },
  { id: "9", code: "2500", name: "Long-term Debt", type: "liability", subtype: "Long-term Liability", balance: 120000, status: "active" },
  // Equity
  { id: "10", code: "3000", name: "Common Stock", type: "equity", subtype: "Equity", balance: 100000, status: "active" },
  { id: "11", code: "3100", name: "Retained Earnings", type: "equity", subtype: "Equity", balance: 76400, status: "active" },
  // Revenue
  { id: "12", code: "4000", name: "Product Sales", type: "revenue", subtype: "Revenue", balance: 180000, status: "active" },
  { id: "13", code: "4100", name: "Service Revenue", type: "revenue", subtype: "Revenue", balance: 95000, status: "active" },
  { id: "14", code: "4200", name: "Subscription Revenue", type: "revenue", subtype: "Revenue", balance: 45000, status: "active" },
  // Expenses
  { id: "15", code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "Expense", balance: 72000, status: "active" },
  { id: "16", code: "5100", name: "Salaries & Wages", type: "expense", subtype: "Expense", balance: 120000, status: "active" },
  { id: "17", code: "5200", name: "Marketing & Advertising", type: "expense", subtype: "Expense", balance: 36000, status: "active" },
  { id: "18", code: "5300", name: "Rent & Utilities", type: "expense", subtype: "Expense", balance: 24000, status: "active" },
];

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

  const accountsQuery = useQuery({
    queryKey: ["invoicing/accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/accounts`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
  });
  if (accountsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => accountsQuery.refetch()}>Retry</Button>
    </div>
  );
  const accounts: Account[] = accountsQuery.data?.data?.length ? accountsQuery.data.data : mockAccounts;

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
                      <Button variant="ghost" size="sm">
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
          setIsCreateModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <FormField label="Account Code" required>
            <Input placeholder="e.g., 5000" required />
          </FormField>
          <FormField label="Account Name" required>
            <Input placeholder="e.g., Marketing Expenses" required />
          </FormField>
          <FormField label="Account Type" required>
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </FormField>
          <FormField label="Subtype">
            <Input placeholder="e.g., Operating Expense" />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
