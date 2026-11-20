import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Shield,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";
import { fieldServiceApi } from "@/lib/api";

export const Route = createFileRoute("/app/field-service/warranty")({
  validateSearch: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
  }),
  component: Warranty,
});


function Warranty() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  const jobsQuery = useQuery({
    queryKey: ["field-service", "jobs", "warranty"],
    queryFn: () => fieldServiceApi.jobs.list(),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const equipmentQuery = useQuery({
    queryKey: ["field-service", "equipment"],
    queryFn: () => fieldServiceApi.equipment.list(),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const createClaimMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fieldServiceApi.jobs.create({ ...data, type: "warranty_claim" }),
    onSuccess: () => {
      toast.success("Warranty claim filed successfully");
      queryClient.invalidateQueries({ queryKey: ["field-service", "jobs"] });
    },
    onError: () => {
      toast.error("Failed to file warranty claim");
    },
  });

  const updateClaimStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fieldServiceApi.jobs.update(id, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Claim status updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: ["field-service", "jobs"] });
    },
    onError: () => {
      toast.error("Failed to update claim status");
    },
  });

  const createWarrantyMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fieldServiceApi.equipment.create({ ...data, warrantyRecord: true }),
    onSuccess: () => {
      toast.success("Warranty record created");
      queryClient.invalidateQueries({ queryKey: ["field-service", "equipment"] });
    },
    onError: () => {
      toast.error("Failed to create warranty record");
    },
  });

  if (jobsQuery.isError || equipmentQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load warranty data. Please try again.</p>
        <button
          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          onClick={() => {
            jobsQuery.refetch();
            equipmentQuery.refetch();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (jobsQuery.isLoading || equipmentQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  const rawEquipment = (equipmentQuery as any).data?.data ?? [];
  const warranties = Array.isArray(rawEquipment) && rawEquipment.length > 0
    ? rawEquipment.map((eq: any) => ({
        id: eq.id,
        equipment: eq.name ?? "Unknown Equipment",
        serial: eq.serial ?? "—",
        customer: eq.customer ?? "—",
        startDate: eq.installed ?? "—",
        endDate: eq.warranty ?? "—",
        type: eq.warrantyType ?? "Manufacturer",
        status: eq.warrantyStatus ?? "active",
        remainingDays: eq.warranty
          ? Math.ceil((new Date(eq.warranty).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0,
        coverage: eq.coverage ?? ["Parts", "Labor"],
      }))
    : [];

  const rawJobs = (jobsQuery as any).data?.data ?? [];
  const claims = Array.isArray(rawJobs) && rawJobs.length > 0
    ? rawJobs
        .filter((j: any) => j.type === "warranty_claim")
        .map((j: any) => ({
          id: j.id,
          equipment: j.equipmentName ?? j.title ?? "Unknown",
          serial: j.serial ?? "—",
          claimNumber: j.jobNumber ?? `CLM-${j.id}`,
          date: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "—",
          status: j.status ?? "pending",
          amount: j.totalCost ?? 0,
          description: j.description ?? "—",
        }))
    : [];

  let filteredWarranties = warranties;
  if (search.search) {
    const q = search.search.toLowerCase();
    filteredWarranties = filteredWarranties.filter(
      (w: any) =>
        w.equipment.toLowerCase().includes(q) ||
        w.customer.toLowerCase().includes(q) ||
        w.serial.toLowerCase().includes(q)
    );
  }
  if (search.status) {
    filteredWarranties = filteredWarranties.filter((w: any) => w.status === search.status);
  }
  if (search.type) {
    filteredWarranties = filteredWarranties.filter(
      (w: any) => w.type.toLowerCase() === search.type!.toLowerCase()
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Warranty Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Monitor equipment warranties and manage claims
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => createWarrantyMutation.mutate({ name: "New Equipment", warrantyRecord: true })}
            disabled={createWarrantyMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Claims Report
          </button>
          <button
            onClick={() =>
              createClaimMutation.mutate({
                title: "New Warranty Claim",
                type: "warranty_claim",
                status: "pending",
              })
            }
            disabled={createClaimMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {createClaimMutation.isPending ? "Filing..." : "File Claim"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.length}</p>
            <p className="text-xs text-muted-foreground">Total Warranties</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.filter((w: any) => w.status === "active").length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.filter((w: any) => String(w.status).includes("expiring")).length}</p>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.filter((w: any) => w.status === "expired").length}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search warranties..."
            defaultValue={search.search ?? ""}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select
          defaultValue={search.status ?? ""}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>
        <select
          defaultValue={search.type ?? ""}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="manufacturer">Manufacturer</option>
          <option value="extended">Extended</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warranties List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">
                Warranties
                {filteredWarranties.length !== warranties.length && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({filteredWarranties.length} of {warranties.length})
                  </span>
                )}
              </h3>
              {filteredWarranties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No warranties match your filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredWarranties.map((warranty: any) => (
                    <div
                      key={warranty.id}
                      className={`p-4 rounded-lg border ${
                        warranty.status === "expired" ? "border-red-500/20 bg-red-500/5" :
                        String(warranty.status).includes("expiring") ? "border-amber-500/20 bg-amber-500/5" :
                        "border-border/40"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{warranty.equipment}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              warranty.status === "active" ? "bg-green-500/10 text-green-500" :
                              warranty.status === "expired" ? "bg-red-500/10 text-red-500" :
                              "bg-amber-500/10 text-amber-500"
                            }`}>
                              {String(warranty.status).replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{warranty.customer}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">S/N: {warranty.serial}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            warranty.remainingDays < 0 ? "text-red-500" :
                            warranty.remainingDays < 90 ? "text-amber-500" :
                            "text-green-600"
                          }`}>
                            {warranty.remainingDays < 0
                              ? "Expired"
                              : warranty.remainingDays === 0
                                ? "Today"
                                : `${warranty.remainingDays}d`
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {warranty.remainingDays < 0 ? "ago" : "remaining"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-3 rounded bg-muted/30 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Start Date</p>
                          <p className="text-sm font-medium">{warranty.startDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End Date</p>
                          <p className="text-sm font-medium">{warranty.endDate}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {warranty.coverage.map((item: string) => (
                          <span key={item} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                          View Details
                        </button>
                        {warranty.status !== "expired" && (
                          <button
                            onClick={() =>
                              createClaimMutation.mutate({
                                title: `Warranty Claim - ${warranty.equipment}`,
                                equipmentId: warranty.id,
                                serial: warranty.serial,
                                customer: warranty.customer,
                                type: "warranty_claim",
                                status: "pending",
                              })
                            }
                            disabled={createClaimMutation.isPending}
                            className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {createClaimMutation.isPending ? "Filing..." : "File Claim"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Claims Sidebar */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Recent Claims</h3>
              <button className="text-xs text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {claims.map((claim: any) => (
                <div
                  key={claim.id}
                  className={`p-3 rounded-lg border ${
                    claim.status === "approved" ? "border-green-500/20" :
                    claim.status === "denied" ? "border-red-500/20" :
                    "border-amber-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{claim.claimNumber}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      claim.status === "approved" ? "bg-green-500/10 text-green-500" :
                      claim.status === "denied" ? "bg-red-500/10 text-red-500" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{claim.equipment}</p>
                  <p className="text-xs text-muted-foreground mb-2">{claim.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{claim.status === "denied" ? "" : `$${claim.amount}`}</span>
                    <span className="text-xs text-muted-foreground">{claim.date}</span>
                  </div>
                  {claim.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          updateClaimStatusMutation.mutate({ id: String(claim.id), status: "approved" })
                        }
                        disabled={updateClaimStatusMutation.isPending}
                        className="flex-1 px-2 py-1 rounded text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          updateClaimStatusMutation.mutate({ id: String(claim.id), status: "denied" })
                        }
                        disabled={updateClaimStatusMutation.isPending}
                        className="flex-1 px-2 py-1 rounded text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
