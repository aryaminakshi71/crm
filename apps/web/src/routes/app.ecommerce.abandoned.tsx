/**
 * Abandoned Carts
 *
 * Recover abandoned shopping carts.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};
import {
  ShoppingCart,
  Search,
  Mail,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/ecommerce/abandoned")({
  component: AbandonedCartsPage,
});

function AbandonedCartsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: apiData, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-abandoned"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ecommerce/abandoned?limit=100`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch abandoned carts");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const abandonedCarts = (apiData as any)?.data ?? [];

  const filteredCarts = abandonedCarts.filter((cart: any) => {
    const matchesSearch =
      cart.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cart.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "recovered" && cart.recovered) ||
      (filterStatus === "abandoned" && !cart.recovered);
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: abandonedCarts.length,
    recovered: abandonedCarts.filter((c: any) => c.recovered).length,
    abandoned: abandonedCarts.filter((c: any) => !c.recovered).length,
    totalRevenue: abandonedCarts.reduce((sum: number, c: any) => sum + c.total, 0),
    recoveredRevenue: abandonedCarts.filter((c: any) => c.recovered).reduce((sum: any, c: any) => sum + c.total, 0),
    recoveryRate: ((abandonedCarts.filter((c: any) => c.recovered).length / abandonedCarts.length) * 100).toFixed(1),
  };

  const getStepBadge = (step: string) => {
    switch (step) {
      case "cart":
        return <Badge variant="default" size="sm">Cart</Badge>;
      case "billing":
        return <Badge variant="warning" size="sm">Billing</Badge>;
      case "shipping":
        return <Badge variant="info" size="sm">Shipping</Badge>;
      case "payment":
        return <Badge variant="danger" size="sm">Payment</Badge>;
      default:
        return <Badge variant="default" size="sm">{step}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Abandoned Carts</h2>
          <p className="text-sm text-muted-foreground">
            Recover lost sales from abandoned shopping carts
          </p>
        </div>
        <Button leftIcon={<Mail className="h-4 w-4" />}>
          Send Recovery Emails
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{summary.abandoned}</p>
                <p className="text-xs text-muted-foreground">Abandoned Carts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{summary.recovered}</p>
                <p className="text-xs text-muted-foreground">Recovered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">${summary.totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Lost Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{summary.recoveryRate}%</p>
                <p className="text-xs text-muted-foreground">Recovery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search abandoned carts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Carts</option>
            <option value="recovered">Recovered</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>
      </div>

      {/* Abandoned Carts List */}
      <div className="space-y-4">
        {filteredCarts.map((cart: any) => (
          <Card key={cart.id} className={`border-border/60 ${cart.recovered ? "border-green-200" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{cart.customer}</span>
                    {cart.recovered ? (
                      <Badge variant="success" size="sm">Recovered</Badge>
                    ) : (
                      <Badge variant="warning" size="sm">Abandoned</Badge>
                    )}
                    {getStepBadge(cart.checkoutStep)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{cart.email}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {cart.products.map((product: any) => (
                      <Badge key={product} variant="outline" size="sm">
                        {product}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {cart.items} items
                    </span>
                    <span>Last active: {cart.lastActivity}</span>
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-lg font-bold text-foreground">${cart.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Cart Value</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!cart.recovered && (
                    <>
                      <Button size="sm" leftIcon={<Mail className="h-3 w-3" />}>
                        Send Email
                      </Button>
                      <Button size="sm" variant="outline" leftIcon={<ArrowRight className="h-3 w-3" />}>
                        View Cart
                      </Button>
                    </>
                  )}
                  {cart.recovered && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Recovered</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recovery Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recovery Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto Recovery Emails</p>
              <p className="text-sm text-muted-foreground">Send automated recovery emails</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email Delay</p>
              <p className="text-sm text-muted-foreground">Time before sending first email</p>
            </div>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
              <option>1 hour</option>
              <option>2 hours</option>
              <option selected>4 hours</option>
              <option>24 hours</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Discount Incentives</p>
              <p className="text-sm text-muted-foreground">Include discount codes in emails</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
