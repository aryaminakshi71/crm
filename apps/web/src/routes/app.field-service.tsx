import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import {
  Truck,
  Users,
  Calendar,
  MapPin,
  Route as RouteIcon,
  Bell,
  Package,
  Wrench,
  Shield,
  FileText,
  AlertTriangle,
  CreditCard,
  Settings,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service")({
  component: FieldServiceLayout,
});

const navItems = [
  { to: "/app/field-service", label: "Dashboard", icon: Calendar },
  { to: "/app/field-service/dispatch", label: "Dispatch Board", icon: Truck },
  { to: "/app/field-service/dispatch/map", label: "Map View", icon: MapPin },
  { to: "/app/field-service/jobs", label: "Jobs", icon: FileText },
  { to: "/app/field-service/technicians", label: "Technicians", icon: Users },
  { to: "/app/field-service/routes", label: "Routes", icon: RouteIcon },
  { to: "/app/field-service/schedule", label: "Schedule", icon: Calendar },
  { to: "/app/field-service/notifications", label: "Notifications", icon: Bell },
  { to: "/app/field-service/proof", label: "Proof of Service", icon: FileText },
  { to: "/app/field-service/parts", label: "Parts", icon: Package },
  { to: "/app/field-service/equipment", label: "Equipment", icon: Wrench },
  { to: "/app/field-service/warranty", label: "Warranty", icon: Shield },
  { to: "/app/field-service/invoicing", label: "Invoicing", icon: CreditCard },
  { to: "/app/field-service/alerts", label: "SLA Alerts", icon: AlertTriangle },
];

function FieldServiceLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Truck className="h-7 w-7 text-primary" />
          Field Service (ServiceNova)
        </h1>
        <p className="text-muted-foreground">
          Manage dispatch, technicians, jobs, routes, and field operations
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-border/60">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            activeProps={{ className: "bg-muted text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
