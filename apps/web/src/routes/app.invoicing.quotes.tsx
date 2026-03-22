/**
 * Quote Builder
 *
 * Create and manage quotes/proposals.
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
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  Copy,
  FileText,
  Plus,
  Receipt,
  Send,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/quotes")({
  component: QuoteBuilder,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

type Quote = {
  id: string;
  quoteNumber: string;
  client: string;
  clientEmail: string;
  amount: number;
  validUntil: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  createdAt: string;
};

const mockQuotes: Quote[] = [
  { id: "1", quoteNumber: "QT-2026-001", client: "Acme Corp", clientEmail: "sales@acmecorp.com", amount: 25000, validUntil: "2026-04-15", status: "accepted", createdAt: "2026-03-01" },
  { id: "2", quoteNumber: "QT-2026-002", client: "TechStart Inc", clientEmail: "hello@techstart.io", amount: 15000, validUntil: "2026-04-20", status: "sent", createdAt: "2026-03-10" },
  { id: "3", quoteNumber: "QT-2026-003", client: "Global Solutions", clientEmail: "info@globalsol.com", amount: 35000, validUntil: "2026-04-01", status: "expired", createdAt: "2026-02-20" },
  { id: "4", quoteNumber: "QT-2026-004", client: "Innovate Co", clientEmail: "contact@innovate.co", amount: 12000, validUntil: "2026-04-25", status: "draft", createdAt: "2026-03-18" },
  { id: "5", quoteNumber: "QT-2026-005", client: "Enterprise Ltd", clientEmail: "sales@enterprise.com", amount: 45000, validUntil: "2026-04-30", status: "sent", createdAt: "2026-03-15" },
];

function QuoteBuilder() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const quotesQuery = useQuery({
    queryKey: ["invoicing/quotes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/quotes`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
  });
  const quotes: Quote[] = quotesQuery.data?.data?.length ? quotesQuery.data.data : mockQuotes;

  const filteredQuotes = quotes.filter((quote) => {
    if (statusFilter !== "all" && quote.status !== statusFilter) return false;
    if (!search.trim()) return true;
    return (
      quote.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      quote.client.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusBadge = (status: Quote["status"]) => {
    const variants: Record<Quote["status"], "success" | "primary" | "danger" | "warning" | "outline"> = {
      accepted: "success",
      sent: "primary",
      declined: "danger",
      expired: "warning",
      draft: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const totalValue = quotes.filter(q => q.status === "sent" || q.status === "accepted").reduce((sum, q) => sum + q.amount, 0);
  const acceptedValue = quotes.filter(q => q.status === "accepted").reduce((sum, q) => sum + q.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Quotes</h2>
          <p className="text-sm text-muted-foreground">Create and manage quotes and proposals</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>
          New Quote
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Open Quotes" value={quotes.filter(q => q.status === "sent").length + ""} />
        <StatCard title="Total Value" value={`$${(totalValue / 1000).toFixed(1)}K`} />
        <StatCard title="Accepted" value={`$${(acceptedValue / 1000).toFixed(1)}K`} highlight />
        <StatCard title="Win Rate" value="68%" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Quote List */}
      {filteredQuotes.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title="No quotes found"
          description="Create your first quote or adjust your filters."
          action={{ label: "Create Quote", onClick: () => setIsCreateModalOpen(true) }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Quote</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Valid Until</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm">{quote.quoteNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{quote.client}</p>
                        <p className="text-xs text-muted-foreground">{quote.clientEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">${quote.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(quote.validUntil).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{getStatusBadge(quote.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {quote.status === "draft" && (
                          <Button variant="ghost" size="sm">Edit</Button>
                        )}
                        <Button variant="ghost" size="sm">Duplicate</Button>
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

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Quote"
        submitText="Create Quote"
        onSubmit={(e) => {
          e.preventDefault();
          setIsCreateModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <FormField label="Client Name" required>
            <Input placeholder="Enter client name" required />
          </FormField>
          <FormField label="Client Email" required>
            <Input type="email" placeholder="client@example.com" required />
          </FormField>
          <FormField label="Quote Amount" required>
            <Input type="number" placeholder="0.00" required />
          </FormField>
          <FormField label="Valid For (days)">
            <Input type="number" defaultValue="30" />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function MoreHorizontal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function StatCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className={`font-black text-2xl mt-0.5 ${highlight ? "text-emerald-400" : "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
