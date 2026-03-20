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
import {
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

const mockVendors: Vendor[] = [
  { id: "1", name: "AWS", email: "billing@aws.amazon.com", phone: "+1-800-555-0101", category: "Cloud Services", totalPaid: 45000, pendingPayments: 2500, status: "active" },
  { id: "2", name: "Staples", email: "orders@staples.com", phone: "+1-800-555-0102", category: "Office Supplies", totalPaid: 8500, pendingPayments: 450, status: "active" },
  { id: "3", name: "Google Cloud", email: "invoices@google.com", phone: "+1-800-555-0103", category: "Cloud Services", totalPaid: 32000, pendingPayments: 3200, status: "active" },
  { id: "4", name: "Slack Technologies", email: "billing@slack.com", phone: "+1-800-555-0104", category: "Software", totalPaid: 12000, pendingPayments: 1000, status: "active" },
  { id: "5", name: "United Airlines", email: "travel@ua.com", phone: "+1-800-555-0105", category: "Travel", totalPaid: 15600, pendingPayments: 0, status: "active" },
  { id: "6", name: "Local Restaurant", email: "orders@localresto.com", phone: "+1-555-0106", category: "Meals", totalPaid: 2340, pendingPayments: 0, status: "inactive" },
];

function VendorManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredVendors = mockVendors.filter((vendor) => {
    if (categoryFilter !== "all" && vendor.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    return (
      vendor.name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const categories = [...new Set(mockVendors.map(v => v.category))];
  const totalSpend = mockVendors.reduce((sum, v) => sum + v.totalPaid, 0);

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
        <StatCard title="Total Vendors" value={mockVendors.filter(v => v.status === "active").length + ""} />
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

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Vendor"
        submitText="Add Vendor"
        onSubmit={(e) => {
          e.preventDefault();
          setIsCreateModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <FormField label="Vendor Name" required>
            <Input placeholder="Enter vendor name" required />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" placeholder="vendor@example.com" required />
          </FormField>
          <FormField label="Phone">
            <Input placeholder="+1 (555) 000-0000" />
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
