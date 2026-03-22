/**
 * Customer Accounts
 *
 * Manage customer accounts and profiles.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Mail,
  ShoppingBag,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/ecommerce/customers")({
  component: CustomersPage,
});

const MOCK_CUSTOMERS = [
  { id: 1, name: "Michael Torres", email: "michael@example.com", orders: 5, totalSpent: 1250.99, lastOrder: "Mar 20, 2024", status: "active", tags: ["VIP", "Repeat"] },
  { id: 2, name: "Sarah Chen", email: "sarah@example.com", orders: 12, totalSpent: 4520.50, lastOrder: "Mar 18, 2024", status: "active", tags: ["VIP"] },
  { id: 3, name: "Emily Zhang", email: "emily@example.com", orders: 2, totalSpent: 189.99, lastOrder: "Mar 15, 2024", status: "active", tags: ["New"] },
  { id: 4, name: "David Park", email: "david@example.com", orders: 8, totalSpent: 2150.00, lastOrder: "Mar 10, 2024", status: "active", tags: ["Repeat"] },
  { id: 5, name: "Lisa Wang", email: "lisa@example.com", orders: 1, totalSpent: 49.99, lastOrder: "Feb 28, 2024", status: "inactive", tags: ["New"] },
  { id: 6, name: "Robert Kim", email: "robert@example.com", orders: 15, totalSpent: 8999.99, lastOrder: "Mar 5, 2024", status: "active", tags: ["VIP", "Wholesale"] },
];

function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["ecommerce-customers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/customers?limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  const customers = apiData?.data?.length > 0 ? apiData.data : MOCK_CUSTOMERS;

  const filteredCustomers = customers.filter(
    (c: typeof MOCK_CUSTOMERS[0]) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Customer Accounts</h2>
          <p className="text-sm text-muted-foreground">
            {customers.length} customers / {customers.filter((c) => c.status === "active").length} active
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="border-border/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {customer.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <Badge variant={customer.status === "active" ? "success" : "default"} size="sm">
                  {customer.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {customer.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-foreground">{customer.orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-foreground">${(customer.totalSpent / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-muted-foreground">Spent</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Last Order</p>
                  <p className="text-xs font-medium">{customer.lastOrder}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<Mail className="h-3 w-3" />}>
                  Email
                </Button>
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<ShoppingBag className="h-3 w-3" />}>
                  Orders
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
