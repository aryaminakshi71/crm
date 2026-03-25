import { createFileRoute, Link } from "@tanstack/react-router";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Send,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  FileText,
  User,
  MapPin,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/field-service/invoicing")({
  component: Invoicing,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

function Invoicing() {
  const invoicesQuery = useQuery({
    queryKey: ["field-service", "invoices"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/field-service/invoices?limit=50`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (invoicesQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => invoicesQuery.refetch()}>Retry</Button>
    </div>
  );

  const invoices = (invoicesQuery as any).data?.data ?? [];

  if (invoicesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/40 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
        <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Field Invoicing</h2>
          <p className="text-sm text-muted-foreground">
            Generate and manage invoices from completed jobs
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{invoices.length}</p>
            <p className="text-xs text-muted-foreground">Total Invoices</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">$4,785</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Send className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">$2,570</p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">$2,100</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">$1,250</p>
            <p className="text-xs text-muted-foreground">Collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Invoices Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link to="/app/invoicing" className="font-medium text-primary hover:underline">
                      {invoice.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.jobId}</td>
                  <td className="px-4 py-3 text-sm">{invoice.customer}</td>
                  <td className="px-4 py-3 text-sm font-medium">${invoice.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      invoice.status === "paid" ? "bg-green-500/10 text-green-500" :
                      invoice.status === "sent" ? "bg-blue-500/10 text-blue-500" :
                      invoice.status === "overdue" ? "bg-red-500/10 text-red-500" :
                      "bg-muted/10 text-muted-foreground"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.date}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.dueDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-muted transition-colors" title="View">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted transition-colors" title="Download">
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {invoice.status === "draft" && (
                        <button className="p-1 rounded hover:bg-muted transition-colors" title="Send">
                          <Send className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      {invoice.status !== "paid" && (
                        <button className="p-1 rounded hover:bg-muted transition-colors" title="Record Payment">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Payment Collection at Job Site */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-6 w-6 text-green-600" />
            <h3 className="font-bold text-foreground">Payment Collection at Job Site</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10">
              <p className="text-xs text-muted-foreground">Collected Today</p>
              <p className="text-2xl font-bold text-green-600">$245</p>
              <p className="text-xs text-muted-foreground">1 transaction</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10">
              <p className="text-xs text-muted-foreground">Pending Collection</p>
              <p className="text-2xl font-bold text-amber-600">$1,115</p>
              <p className="text-xs text-muted-foreground">3 invoices pending</p>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Quick Actions</p>
              <div className="flex gap-2 mt-2">
                <button className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                  Record Payment
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  Send Receipt
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
