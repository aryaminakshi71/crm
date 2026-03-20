/**
 * Invoicing & Accounting Layout
 *
 * Main invoicing workspace layout with navigation.
 */

import { Badge } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Banknote,
  BarChart3,
  Calculator,
  FileText,
  Home,
  Receipt,
  RefreshCw,
  Scale,
  Settings,
  Truck,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing")({
  component: InvoicingLayout,
});

function InvoicingLayout() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", href: "/app/invoicing", icon: Home },
    { id: "invoices", label: "Invoices", href: "/app/invoicing/invoices", icon: FileText },
    { id: "quotes", label: "Quotes", href: "/app/invoicing/quotes", icon: Receipt },
    { id: "payments", label: "Payments", href: "/app/invoicing/payments", icon: Wallet },
    { id: "recurring", label: "Recurring", href: "/app/invoicing/recurring", icon: RefreshCw },
    { id: "taxes", label: "Taxes", href: "/app/invoicing/taxes", icon: Scale },
    { id: "expenses", label: "Expenses", href: "/app/invoicing/expenses", icon: Receipt },
    { id: "vendors", label: "Vendors", href: "/app/invoicing/vendors", icon: Truck },
    { id: "purchase-orders", label: "Purchase Orders", href: "/app/invoicing/purchase-orders", icon: FileText },
    { id: "accounts", label: "Chart of Accounts", href: "/app/invoicing/accounts", icon: Calculator },
    { id: "reports", label: "Reports", href: "/app/invoicing/reports/pl", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Invoicing & Accounting</h1>
          <p className="text-muted-foreground text-sm">
            Invoices, payments, expenses, and financial reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Wallet className="h-3 w-3 mr-1" />
            $128,450 Receivable
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
