/**
 * Vendor Management
 *
 * Manage vendors and supplier relationships.
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Edit,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/vendors")({
  component: VendorManagement,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  totalPaid: number;
  pendingPayments: number;
  status: "active" | "inactive";
};

const EMPTY_VENDORS: any[] = [];

function VendorManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const createVendorMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/invoicing/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/vendors"] }),
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/invoicing/vendors/${id}`, {
        method: "DELETE",
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing/vendors"] }),
  });

  const vendorsQuery = useQuery({
    queryKey: ["invoicing/vendors"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/vendors`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (vendorsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => vendorsQuery.refetch()}>Retry</Button>
    </div>
  );

  const vendors: any[] = (vendorsQuery as any)?.data?.data ?? [];

  const filteredVendors = vendors.filter((vendor) => {
    if (categoryFilter !== "all" && vendor.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    return (
      vendor.name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const categories = [...new Set(vendors.map(v => v.category))];
  const totalSpend = vendors.reduce((sum, v) => sum + v.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Vendors</h2>
          <p className="text-sm text-muted-foreground">Manage vendors and supplier relationships</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>
          Add Vendor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Vendors" value={vendors.filter(v => v.status === "active").length + ""} />
        <StatCard title="Total Spend (YTD)" value={`$${(totalSpend / 1000).toFixed(1)}K`} />
        <StatCard title="Pending Payments" value="$7.15K" />
        <StatCard title="Categories" value={categories.length + ""} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..." />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Vendor List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Total Paid</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Pending</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{vendor.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{vendor.category}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {vendor.email}
                      </p>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {vendor.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">${vendor.totalPaid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-amber-400">${vendor.pendingPayments.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={vendor.status === "active" ? "success" : "outline"}>
                      {vendor.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteVendorMutation.mutate(vendor.id)} disabled={deleteVendorMutation.isPending}>
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
        title="Add Vendor"
        submitText="Add Vendor"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const formData = new FormData(form);
          createVendorMutation.mutate(
            { name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone"), category: formData.get("category") },
            { onSuccess: () => setIsCreateModalOpen(false) }
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Vendor Name" required>
            <Input name="name" placeholder="Enter vendor name" required />
          </FormField>
          <FormField label="Email" required>
            <Input name="email" type="email" placeholder="vendor@example.com" required />
          </FormField>
          <FormField label="Phone">
            <Input name="phone" placeholder="+1 (555) 000-0000" />
          </FormField>
          <FormField label="Category">
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option>Cloud Services</option>
              <option>Software</option>
              <option>Office Supplies</option>
              <option>Travel</option>
              <option>Meals</option>
              <option>Other</option>
            </select>
          </FormField>
          <FormField label="Address">
            <Input placeholder="Business address" />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
