import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, DollarSign, XCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
}

export const Route = createFileRoute("/app/crm/commissions")({
  validateSearch: z.object({
    status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
    rep: z.string().optional(),
  }),
  component: CrmCommissionsPage,
});

interface Commission {
  id: string;
  repName: string;
  dealName: string;
  dealValue: number;
  commissionAmount: number;
  commissionRate: number;
  status: "pending" | "approved" | "rejected";
  periodEnd: string;
  createdAt: string;
}

function statusBadgeClass(status: string) {
  if (status === "approved") return "bg-green-100 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

function CrmCommissionsPage() {
  const queryClient = useQueryClient();

  // ── Query ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ["crm/commissions"],
    queryFn: () =>
      fetch(`${API_BASE}/crm/commissions`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch commissions");
        return r.json();
      }),
    retry: false,
  });

  const commissions: Commission[] = Array.isArray((query.data as any)?.data)
    ? (query.data as any).data
    : [];
  const hasData = commissions.length > 0;

  // ── Approve mutation ───────────────────────────────────────────────────────
  const approveCommission = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/crm/commissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to approve commission");
        return r.json();
      }),
    onSuccess: () => {
      toast.success("Commission approved");
      queryClient.invalidateQueries({ queryKey: ["crm/commissions"] });
    },
    onError: () => toast.error("Failed to approve commission"),
  });

  // ── Reject mutation ────────────────────────────────────────────────────────
  const rejectCommission = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/crm/commissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to reject commission");
        return r.json();
      }),
    onSuccess: () => {
      toast.success("Commission rejected");
      queryClient.invalidateQueries({ queryKey: ["crm/commissions"] });
    },
    onError: () => toast.error("Failed to reject commission"),
  });

  const isMutating = approveCommission.isPending || rejectCommission.isPending;

  if (query.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button>
    </div>
  );

  // Summary stats
  const totalPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.commissionAmount, 0);
  const totalApproved = commissions
    .filter((c) => c.status === "approved")
    .reduce((s, c) => s + c.commissionAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Commissions</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Commissions</h1>
        <p className="text-muted-foreground text-sm">
          Track and manage sales commissions for your team.
        </p>
      </div>

      {/* Summary cards (only when there's data) */}
      {hasData && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Pending</p>
                <p className="font-bold text-xl">${totalPending.toLocaleString()}</p>
              </div>
              <DollarSign className="h-7 w-7 text-yellow-500/20" />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Approved</p>
                <p className="font-bold text-xl text-green-600">${totalApproved.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="h-7 w-7 text-green-600/20" />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Pending Records</p>
                <p className="font-bold text-xl">
                  {commissions.filter((c) => c.status === "pending").length}
                </p>
              </div>
              <AlertCircle className="h-7 w-7 text-primary/20" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {query.isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4">
                <div className="h-14 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={<DollarSign className="h-8 w-8 text-primary/40" />}
          title="No commissions yet"
          description="Commissions will appear here once deals are marked as won and commission rules are configured."
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rep</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Deal</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Deal Value</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rate</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Commission</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Period End</th>
                    <th className="w-32 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-sm">{c.repName}</td>
                      <td className="p-4 text-sm text-muted-foreground">{c.dealName}</td>
                      <td className="p-4 text-sm">${c.dealValue.toLocaleString()}</td>
                      <td className="p-4 text-sm">{c.commissionRate}%</td>
                      <td className="p-4 text-sm font-semibold">
                        ${c.commissionAmount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={statusBadgeClass(c.status)}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {c.periodEnd ? String(c.periodEnd).slice(0, 10) : "—"}
                      </td>
                      <td className="p-4">
                        {c.status === "pending" && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => approveCommission.mutate(c.id)}
                              disabled={isMutating}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => rejectCommission.mutate(c.id)}
                              disabled={isMutating}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
