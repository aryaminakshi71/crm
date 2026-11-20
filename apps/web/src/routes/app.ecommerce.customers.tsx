/**
 * Customer Accounts
 *
 * Manage customer accounts and profiles.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
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

import { ecommerceApi } from "@/lib/api";

export const Route = createFileRoute("/app/ecommerce/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/v1/ecommerce/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create customer");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce", "customers"] }),
  });

  const { data: apiData, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-customers"],
    queryFn: () => ecommerceApi.customers.list(),
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const customers = (apiData as any)?.data ?? [];

  const filteredCustomers = customers.filter(
    (c: any) =>
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
            {customers.length} customers / {customers.filter((c: any) => c.status === "active").length} active
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          loading={createCustomerMutation.isPending}
          onClick={() => {
            const name = window.prompt("Customer name:");
            if (!name) return;
            const email = window.prompt("Customer email:");
            if (!email) return;
            createCustomerMutation.mutate({ name, email });
          }}
        >
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
        {filteredCustomers.map((customer: any) => (
          <Card key={customer.id} className="border-border/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {customer.name.split(" ").map((n: any) => n[0]).join("")}
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
                {customer.tags.map((tag: any) => (
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
