/**
 * Inventory & Stock Layout
 *
 * Main layout for inventory management module.
 */

import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Package,
  Boxes,
  Warehouse,
  MapPin,
  ScanBarcode,
  QrCode,
  Bell,
  ShoppingCart,
  Truck,
  Hash,
  Layers,
  ArrowLeftRight,
  DollarSign,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/app/inventory")({
  component: InventoryLayout,
});

function InventoryLayout() {
  const navItems = [
    { name: "Overview", href: "/app/inventory", icon: Boxes, isIndex: true },
    { name: "Products", href: "/app/inventory/products", icon: Package },
    { name: "Stock Levels", href: "/app/inventory/stock", icon: Layers },
    { name: "Warehouses", href: "/app/inventory/warehouses", icon: Warehouse },
    { name: "Locations", href: "/app/inventory/locations", icon: MapPin },
    { name: "Barcode Scanner", href: "/app/inventory/barcode", icon: ScanBarcode },
    { name: "QR Generator", href: "/app/inventory/qr", icon: QrCode },
    { name: "Alerts", href: "/app/inventory/alerts", icon: Bell },
    { name: "Purchase Orders", href: "/app/inventory/purchase-orders", icon: ShoppingCart },
    { name: "Suppliers", href: "/app/inventory/suppliers", icon: Truck },
    { name: "Serial Numbers", href: "/app/inventory/serial", icon: Hash },
    { name: "Batch Tracking", href: "/app/inventory/batch", icon: Layers },
    { name: "Adjustments", href: "/app/inventory/adjustments", icon: ArrowLeftRight },
    { name: "Transfers", href: "/app/inventory/transfers", icon: ArrowLeftRight },
    { name: "Valuation", href: "/app/inventory/valuation", icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory & Stock</h1>
        <p className="text-muted-foreground">
          Manage products, stock levels, warehouses, and supply chain operations.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors group flex items-start gap-3"
          >
            <item.icon className="h-8 w-8 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.name === "Overview" && "Dashboard & stats"}
                {item.name === "Products" && "Product catalog"}
                {item.name === "Stock Levels" && "Current inventory"}
                {item.name === "Warehouses" && "Warehouse management"}
                {item.name === "Locations" && "Bin & shelf tracking"}
                {item.name === "Barcode Scanner" && "Scan items"}
                {item.name === "QR Generator" && "Generate QR codes"}
                {item.name === "Alerts" && "Reorder alerts"}
                {item.name === "Purchase Orders" && "PO management"}
                {item.name === "Suppliers" && "Vendor management"}
                {item.name === "Serial Numbers" && "Track individual items"}
                {item.name === "Batch Tracking" && "Lot tracking"}
                {item.name === "Adjustments" && "Stock corrections"}
                {item.name === "Transfers" && "Move between warehouses"}
                {item.name === "Valuation" && "FIFO/LIFO/Avg cost"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
