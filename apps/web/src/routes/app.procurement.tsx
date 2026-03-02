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
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Building2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/procurement")({
  component: ProcurementPage,
});

function ProcurementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "Software",
    slaTier: "Standard",
  });

  const [newRequest, setNewRequest] = useState({
    title: "",
    department: "Operations",
    amount: "",
    vendorId: "",
  });

  const vendorsQuery = useQuery({
    queryKey: ["ops-vendors"],
    queryFn: () => nucleoApi.operations.vendors.list({ page: 1, limit: 200 }),
  });

  const requestsQuery = useQuery({
    queryKey: ["ops-purchase-requests"],
    queryFn: () =>
      nucleoApi.operations.purchaseRequests.list({ page: 1, limit: 200 }),
  });

  const createVendor = useMutation({
    mutationFn: (payload: { name: string; category: string; slaTier: string }) =>
      nucleoApi.operations.vendors.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ops-vendors"] });
      toast.success("Vendor added");
      setIsVendorModalOpen(false);
      setNewVendor({ name: "", category: "Software", slaTier: "Standard" });
    },
    onError: () => toast.error("Failed to add vendor"),
  });

  const updateVendor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.vendors.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-vendors"] });
    },
  });

  const deleteVendor = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.vendors.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ops-vendors"] }),
        queryClient.invalidateQueries({ queryKey: ["ops-purchase-requests"] }),
      ]);
      toast.success("Vendor deleted");
    },
    onError: () => toast.error("Failed to delete vendor"),
  });

  const createRequest = useMutation({
    mutationFn: (payload: {
      title: string;
      department: string;
      amount: number;
      vendorId?: string;
      status?: string;
    }) => nucleoApi.operations.purchaseRequests.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ops-purchase-requests"] });
      toast.success("Request submitted for approval");
      setIsRequestModalOpen(false);
      setNewRequest({ title: "", department: "Operations", amount: "", vendorId: "" });
    },
    onError: () => toast.error("Failed to create request"),
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.purchaseRequests.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-purchase-requests"] });
      toast.success("Request updated");
    },
    onError: () => toast.error("Failed to update request"),
  });

  const deleteRequest = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.purchaseRequests.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-purchase-requests"] });
      toast.success("Request deleted");
    },
    onError: () => toast.error("Failed to delete request"),
  });

  const vendors = useMemo(() => vendorsQuery.data?.data || [], [vendorsQuery.data]);
  const requests = useMemo(() => requestsQuery.data?.data || [], [requestsQuery.data]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request: any) => {
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(request.title || "").toLowerCase().includes(q) ||
        String(request.department || "").toLowerCase().includes(q) ||
        String(request.vendorName || "").toLowerCase().includes(q)
      );
    });
  }, [requests, search, statusFilter]);

  const totalSpend = requests.reduce((sum: number, request: any) => sum + Number(request.amount || 0), 0);
  const pendingApprovals = requests.filter((request: any) => request.status === "pending").length;
  const highRiskVendors = vendors.filter((vendor: any) => vendor.risk === "high").length;

  if (vendorsQuery.isLoading || requestsQuery.isLoading) {
    return <Loading text="Loading procurement workspace..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Procurement</h1>
          <p className="text-muted-foreground">
            Vendor governance, purchasing workflow, and spend visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Building2 className="h-4 w-4" />} onClick={() => setIsVendorModalOpen(true)}>
            Add Vendor
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsRequestModalOpen(true)}>
            New Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Managed Vendors" value={vendors.length} />
        <Metric title="Pending Approvals" value={pendingApprovals} />
        <Metric title="Procurement Spend" value={`$${totalSpend.toLocaleString()}`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="w-full max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search requests or vendor"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-10 w-10" />}
                title="No requests found"
                description="Create a new procurement request to begin approval flow."
              />
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request: any) => (
                  <div key={request.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{request.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {request.department} | {request.vendorName || "Unassigned"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === "approved"
                            ? "success"
                            : request.status === "pending"
                              ? "warning"
                              : request.status === "rejected"
                                ? "danger"
                                : "outline"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="mt-2 font-semibold text-foreground">
                      ${Number(request.amount || 0).toLocaleString()}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                        value={request.status}
                        onChange={(e) =>
                          updateRequest.mutate({
                            id: request.id,
                            data: { status: e.target.value },
                          })
                        }
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="ordered">ordered</option>
                        <option value="received">received</option>
                        <option value="rejected">rejected</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteRequest.mutate(request.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendors.map((vendor: any) => (
                <div key={vendor.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{vendor.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {vendor.category} | SLA {vendor.slaTier}
                      </p>
                    </div>
                    <Badge
                      variant={
                        vendor.risk === "low"
                          ? "success"
                          : vendor.risk === "medium"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {vendor.risk} risk
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">
                    On-time delivery: {vendor.onTimeRate}%
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                      value={vendor.risk}
                      onChange={(e) =>
                        updateVendor.mutate({
                          id: vendor.id,
                          data: { risk: e.target.value },
                        })
                      }
                    >
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => deleteVendor.mutate(vendor.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-muted-foreground text-xs">
                High-risk vendors requiring review: {highRiskVendors}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <FormModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title="Add Vendor"
        submitText="Create Vendor"
        loading={createVendor.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newVendor.name.trim()) {
            toast.error("Vendor name is required");
            return;
          }
          createVendor.mutate({
            name: newVendor.name.trim(),
            category: newVendor.category,
            slaTier: newVendor.slaTier,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Vendor Name" required>
            <Input value={newVendor.name} onChange={(e) => setNewVendor((prev) => ({ ...prev, name: e.target.value }))} />
          </FormField>
          <FormField label="Category">
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newVendor.category} onChange={(e) => setNewVendor((prev) => ({ ...prev, category: e.target.value }))}>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Services">Services</option>
            </select>
          </FormField>
          <FormField label="SLA Tier">
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newVendor.slaTier} onChange={(e) => setNewVendor((prev) => ({ ...prev, slaTier: e.target.value }))}>
              <option value="Standard">Standard</option>
              <option value="Gold">Gold</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="New Purchase Request"
        submitText="Submit Request"
        loading={createRequest.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newRequest.title.trim()) {
            toast.error("Request title is required");
            return;
          }
          const amount = Number(newRequest.amount);
          if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Request amount must be positive");
            return;
          }

          createRequest.mutate({
            title: newRequest.title.trim(),
            department: newRequest.department,
            amount,
            vendorId: newRequest.vendorId || undefined,
            status: "pending",
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Request Title" required>
            <Input value={newRequest.title} onChange={(e) => setNewRequest((prev) => ({ ...prev, title: e.target.value }))} />
          </FormField>
          <FormField label="Department">
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newRequest.department} onChange={(e) => setNewRequest((prev) => ({ ...prev, department: e.target.value }))}>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
              <option value="Engineering">Engineering</option>
              <option value="Security">Security</option>
              <option value="HR">HR</option>
            </select>
          </FormField>
          <FormField label="Amount" required>
            <Input type="number" min="0" step="0.01" value={newRequest.amount} onChange={(e) => setNewRequest((prev) => ({ ...prev, amount: e.target.value }))} />
          </FormField>
          <FormField label="Preferred Vendor">
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newRequest.vendorId} onChange={(e) => setNewRequest((prev) => ({ ...prev, vendorId: e.target.value }))}>
              <option value="">Unassigned</option>
              {vendors.map((vendor: any) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            {title.includes("Spend") ? (
              <Briefcase className="h-4 w-4 text-primary" />
            ) : (
              <ShoppingCart className="h-4 w-4 text-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
