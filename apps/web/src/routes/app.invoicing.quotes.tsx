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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
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
import { invoicingApi } from "@/lib/api";

export const Route = createFileRoute("/app/invoicing/quotes")({
  component: QuoteBuilder,
});

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

const EMPTY_QUOTES: any[] = [];

function QuoteBuilder() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const createQuoteMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => invoicingApi.quotes.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/quotes"] }),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoicing/quotes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quote");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/quotes"] }),
  });

  const quotesQuery = useQuery({
    queryKey: ["invoicing/quotes"],
    queryFn: () => invoicingApi.quotes.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (quotesQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => quotesQuery.refetch()}>Retry</Button>
    </div>
  );

  const quotes: any[] = (quotesQuery as any)?.data?.data ?? [];

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
          action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>Create Quote</Button>}
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
          const form = e.currentTarget as HTMLFormElement;
          const formData = new FormData(form);
          createQuoteMutation.mutate(
            { client: formData.get("client"), clientEmail: formData.get("clientEmail"), amount: Number(formData.get("amount")), validDays: Number(formData.get("validDays") ?? 30) },
            { onSuccess: () => setIsCreateModalOpen(false) }
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Client Name" required>
            <Input name="client" placeholder="Enter client name" required />
          </FormField>
          <FormField label="Client Email" required>
            <Input name="clientEmail" type="email" placeholder="client@example.com" required />
          </FormField>
          <FormField label="Quote Amount" required>
            <Input name="amount" type="number" placeholder="0.00" required />
          </FormField>
          <FormField label="Valid For (days)">
            <Input name="validDays" type="number" defaultValue="30" />
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
