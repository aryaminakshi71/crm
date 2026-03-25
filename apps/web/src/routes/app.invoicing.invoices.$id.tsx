/**
 * Invoice Detail
 *
 * Detailed view of a single invoice with line items and actions.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Edit,
  MoreHorizontal,
  Printer,
  Send,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/invoices/$id")({
  component: InvoiceDetail,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

function InvoiceDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("sent");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/v1/invoicing/invoices/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to send invoice");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/invoices", id] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`${API_BASE}/v1/invoicing/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/invoices", id] }),
  });

  const invoiceQuery = useQuery({
    queryKey: ["invoicing/invoices", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/invoices/${id}`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    placeholderData: (prev) => prev,
    retry: false,
  });
  if (invoiceQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => invoiceQuery.refetch()}>Retry</Button>
    </div>
  );

  const invoice = invoiceQuery.data ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => history.back()}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xl text-foreground">{(invoice as any).invoiceNumber}</h2>
              <Badge variant="primary">{(invoice as any).status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Issued {new Date((invoice as any).issueDate).toLocaleDateString()} - Due {new Date((invoice as any).dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />}>
            Print
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Download
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? "Sending..." : "Send"}
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Invoice Content */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="h-10 w-32 bg-gradient-to-r from-primary to-violet-500 rounded" />
                <p className="mt-2 text-sm text-muted-foreground">Your Company Name</p>
                <p className="text-xs text-muted-foreground">123 Business St</p>
                <p className="text-xs text-muted-foreground">City, State 12345</p>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold">INVOICE</h1>
                <p className="text-sm text-muted-foreground">{(invoice as any).invoiceNumber}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">BILL TO</p>
                <p className="font-semibold">{(invoice as any).client}</p>
                <p className="text-sm text-muted-foreground">{(invoice as any).clientEmail}</p>
                <p className="text-sm text-muted-foreground">{(invoice as any).clientAddress}</p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p className="text-sm font-medium">{new Date((invoice as any).issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium">{new Date((invoice as any).dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Rate</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice as any).items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="px-2 py-3 text-sm">{item.description}</td>
                    <td className="px-2 py-3 text-sm text-right">{item.quantity}</td>
                    <td className="px-2 py-3 text-sm text-right">${item.rate.toLocaleString()}</td>
                    <td className="px-2 py-3 text-sm text-right font-medium">${(item.quantity * item.rate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${(invoice as any).amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${(invoice as any).tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                  <span>Total</span>
                  <span>${(invoice as any).total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(invoice as any).notes && (
              <div className="mt-8 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">NOTES</p>
                <p className="text-sm text-muted-foreground">{(invoice as any).notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="void">Void</option>
              </select>
              <Button variant="outline" className="w-full" leftIcon={<Send className="h-4 w-4" />}>
                Send Reminder
              </Button>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Bank</p>
                <p className="font-medium">First National Bank</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account</p>
                <p className="font-medium">****1234</p>
              </div>
              <div>
                <p className="text-muted-foreground">Routing</p>
                <p className="font-medium">****5678</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2" />
                <div>
                  <p className="text-sm">Invoice created</p>
                  <p className="text-xs text-muted-foreground">Mar 10, 2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm">Invoice sent</p>
                  <p className="text-xs text-muted-foreground">Mar 10, 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
