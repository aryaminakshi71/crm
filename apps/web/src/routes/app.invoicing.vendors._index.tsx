/**
 * Vendors List
 *
 * Manage vendors / accounts payable with spend tracking.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Building2,
  DollarSign,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  status: z.enum(["all", "active", "inactive"]).optional().default("all"),
});

export const Route = createFileRoute("/app/invoicing/vendors/_index")({
  validateSearch: searchSchema,
  component: VendorsPage,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function VendorsPage() {
  const { q: search, status: statusFilter } = useSearch({ from: "/app/invoicing/vendors/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/vendors/_index" });

  const setSearch = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, q: value || undefined }) });
  const setStatusFilter = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, status: value as any }) });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newContact, setNewContact] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createVendorMutation = useMutation({
    mutationFn: (vendorData: { name: string; email?: string; contactName?: string }) =>
      invoicingApi.vendors.create(vendorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing/vendors"] });
      toast.success("Vendor created successfully");
      setIsAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewContact("");
    },
    onError: () => toast.error("Failed to create vendor"),
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id: string) => invoicingApi.vendors.update(id, { deleted: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing/vendors"] });
      toast.success("Vendor removed");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to remove vendor"),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/vendors"],
    queryFn: () => invoicingApi.vendors.list({ page: 1, limit: 50 }),
    retry: false,
  });

  const vendors: any[] = (data as any)?.data ?? [];

  const filtered = vendors.filter((v) => {
    const matchSearch =
      !search.trim() ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.contactName?.toLowerCase().includes(search.toLowerCase());
    const isActive = v.deleted !== true && v.isActive !== false;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive);
    return matchSearch && matchStatus;
  });

  const totalAP = vendors.reduce((s, v) => s + (Number(v.outstandingBalance ?? v.balance) || 0), 0);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load vendors.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Vendors</p>
                <p className="mt-0.5 text-2xl font-black">{vendors.length}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Accounts Payable</p>
                <p className="mt-0.5 text-2xl font-black text-amber-400">{fmt(totalAP)}</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <DollarSign className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 w-56 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-3 py-1 text-sm"
          >
            <option value="all">All Vendors</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Vendor
        </Button>
      </div>

      {isAddOpen && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">New Vendor</h3>
            <Input
              placeholder="Vendor name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Contact name"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
            />
            <Input
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newName.trim() || createVendorMutation.isPending}
                onClick={() =>
                  createVendorMutation.mutate({
                    name: newName.trim(),
                    email: newEmail.trim() || undefined,
                    contactName: newContact.trim() || undefined,
                  })
                }
              >
                {createVendorMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading vendors...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No vendors found</p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add your first vendor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Vendor Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Total Spent</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Outstanding</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v: any) => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-xs font-bold uppercase">
                            {(v.name ?? "?").charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{v.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{v.contactName ?? "—"}</td>
                      <td className="px-4 py-3">
                        {v.email ? (
                          <a href={`mailto:${v.email}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                            <Mail className="h-3 w-3" />
                            {v.email}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.phone ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {v.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {fmt(Number(v.totalSpent ?? v.totalPaid) || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-amber-400">
                        {fmt(Number(v.outstandingBalance ?? v.balance) || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            View
                          </Button>
                          {deleteConfirmId === v.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                disabled={deleteVendorMutation.isPending}
                                onClick={() => deleteVendorMutation.mutate(v.id)}
                              >
                                {deleteVendorMutation.isPending ? "..." : "Confirm"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(v.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
