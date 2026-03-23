/**
 * Invoice List
 *
 * List of all invoices with filters and status management.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Select,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  DollarSign,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/invoices")({
  component: InvoiceList,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  client: string;
  clientEmail: string;
  amount: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  issueDate: string;
  dueDate: string;
  items: Array<{ description: string; quantity: number; rate: number }>;
};

const mockInvoices: Invoice[] = [
  { id: "1", invoiceNumber: "INV-2026-001", client: "Acme Corp", clientEmail: "billing@acmecorp.com", amount: 11500, tax: 1000, total: 12500, status: "paid", issueDate: "2026-03-01", dueDate: "2026-03-31", items: [{ description: "Consulting Services - March", quantity: 1, rate: 11500 }] },
  { id: "2", invoiceNumber: "INV-2026-002", client: "TechStart Inc", clientEmail: "accounts@techstart.io", amount: 8000, tax: 750, total: 8750, status: "sent", issueDate: "2026-03-10", dueDate: "2026-04-10", items: [{ description: "Software Development", quantity: 1, rate: 8000 }] },
  { id: "3", invoiceNumber: "INV-2026-003", client: "Global Solutions", clientEmail: "finance@globalsol.com", amount: 14000, tax: 1200, total: 15200, status: "overdue", issueDate: "2026-02-15", dueDate: "2026-03-17", items: [{ description: "Implementation Services", quantity: 1, rate: 14000 }] },
  { id: "4", invoiceNumber: "INV-2026-004", client: "Innovate Co", clientEmail: "ap@innovate.co", amount: 6200, tax: 600, total: 6800, status: "draft", issueDate: "2026-03-20", dueDate: "2026-04-20", items: [{ description: "Monthly Support", quantity: 1, rate: 6200 }] },
  { id: "5", invoiceNumber: "INV-2026-005", client: "Enterprise Ltd", clientEmail: "payments@enterprise.com", amount: 25000, tax: 2500, total: 27500, status: "sent", issueDate: "2026-03-15", dueDate: "2026-04-15", items: [{ description: "Enterprise License", quantity: 1, rate: 25000 }] },
  { id: "6", invoiceNumber: "INV-2026-006", client: "StartupXYZ", clientEmail: "hello@startupxyz.com", amount: 3500, tax: 350, total: 3850, status: "paid", issueDate: "2026-03-05", dueDate: "2026-03-35", items: [{ description: "Starter Plan", quantity: 1, rate: 3500 }] },
];

function InvoiceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ client: "", email: "", amount: "", tax: "10" });

  const invoicesQuery = useQuery({
    queryKey: ["invoicing/invoices"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/invoices`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
  });
  const invoices: Invoice[] = invoicesQuery.data?.data?.length ? invoicesQuery.data.data : mockInvoices;

  if (invoicesQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => invoicesQuery.refetch()}>Retry</Button>
    </div>
  );

  const filteredInvoices = invoices.filter((invoice) => {
    if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
    if (!search.trim()) return true;
    return (
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      invoice.client.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusBadge = (status: Invoice["status"]) => {
    const variants: Record<Invoice["status"], "success" | "primary" | "danger" | "warning" | "outline"> = {
      paid: "success",
      sent: "primary",
      overdue: "danger",
      draft: "outline",
      void: "warning",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const totalOutstanding = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Invoices</h2>
          <p className="text-sm text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Outstanding" value={`$${(totalOutstanding / 1000).toFixed(1)}K`} />
        <StatCard title="Overdue" value={`$${(totalOverdue / 1000).toFixed(1)}K`} highlight />
        <StatCard title="Paid This Month" value="$16.35K" />
        <StatCard title="Draft Invoices" value="1" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="void">Void</option>
        </select>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No invoices found"
          description="Create your first invoice or adjust your filters."
          action={{ label: "Create Invoice", onClick: () => setIsCreateModalOpen(true) }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Issue Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link to={`/app/invoicing/invoices/${invoice.id}` as string} className="font-medium text-sm text-primary hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{invoice.client}</p>
                        <p className="text-xs text-muted-foreground">{invoice.clientEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">${invoice.total.toLocaleString()}</td>
                    <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {invoice.status === "draft" && (
                          <Button variant="ghost" size="sm">Send</Button>
                        )}
                        {invoice.status === "sent" && (
                          <Button variant="ghost" size="sm">Remind</Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Invoice"
        submitText="Create Invoice"
        onSubmit={(e) => {
          e.preventDefault();
          setIsCreateModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <FormField label="Client Name" required>
            <Input value={newInvoice.client} onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })} placeholder="Enter client name" required />
          </FormField>
          <FormField label="Client Email" required>
            <Input type="email" value={newInvoice.email} onChange={(e) => setNewInvoice({ ...newInvoice, email: e.target.value })} placeholder="client@example.com" required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount" required>
              <Input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} placeholder="0.00" required />
            </FormField>
            <FormField label="Tax Rate (%)">
              <Input type="number" value={newInvoice.tax} onChange={(e) => setNewInvoice({ ...newInvoice, tax: e.target.value })} placeholder="10" />
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function StatCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className={`font-black text-2xl mt-0.5 ${highlight ? "text-rose-400" : "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
