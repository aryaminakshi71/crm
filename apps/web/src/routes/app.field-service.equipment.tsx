import { createFileRoute } from "@tanstack/react-router";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Settings,
  Truck,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { fieldServiceApi } from "@/lib/api";

export const Route = createFileRoute("/app/field-service/equipment")({
  validateSearch: z.object({
    search: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    customer: z.string().optional(),
  }),
  component: Equipment,
});

const MOCK_EQUIPMENT = [
  { id: 1, name: "Carrier 24ACC636A003", type: "HVAC Unit", serial: "CR-2024-12345", location: "123 Main St, Acme Corp", installed: "2019-06-15", warranty: "2026-06-14", status: "operational", lastService: "Mar 15, 2026", nextService: "Jun 15, 2026", customer: "Acme Corporation" },
  { id: 2, name: "Trane XR15 Heat Pump", type: "Heat Pump", serial: "TR-2023-98765", location: "456 Oak Ave, TechStart", installed: "2020-03-20", warranty: "2027-03-19", status: "operational", lastService: "Feb 10, 2026", nextService: "May 10, 2026", customer: "TechStart Inc" },
  { id: 3, name: "Generac 22kW Generator", type: "Generator", serial: "GN-2022-54321", location: "789 Pine Rd, Metro Hospital", installed: "2018-11-01", warranty: "2025-11-01", status: "warning", lastService: "Jan 5, 2026", nextService: "Apr 5, 2026", customer: "Metro Hospital" },
  { id: 4, name: "Rheem Commercial Water Heater", type: "Water Heater", serial: "RH-2021-11111", location: "321 Elm St, Green Valley Clinic", installed: "2021-08-10", warranty: "2029-08-09", status: "operational", lastService: "Feb 28, 2026", nextService: "May 28, 2026", customer: "Green Valley Clinic" },
  { id: 5, name: "York YC2D Heat Pump", type: "Heat Pump", serial: "YK-2020-22222", location: "654 Maple Dr, Harbor View", installed: "2020-05-15", warranty: "2027-05-14", status: "maintenance", lastService: "Mar 1, 2026", nextService: "Mar 25, 2026", customer: "Harbor View Hotel" },
  { id: 6, name: "Lennox XC21 AC Unit", type: "Air Conditioner", serial: "LN-2019-33333", location: "987 Cedar Ln, Riverside", installed: "2019-07-22", warranty: "2024-07-21", status: "warning", lastService: "Dec 15, 2025", nextService: "Overdue", customer: "Riverside Apartments" },
];

function Equipment() {
  const queryClient = useQueryClient();

  const equipmentQuery = useQuery({
    queryKey: ["field-service", "equipment"],
    queryFn: () => fieldServiceApi.equipment.list(),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const createEquipmentMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fieldServiceApi.equipment.create(data),
    onSuccess: () => {
      toast.success("Equipment added successfully");
      queryClient.invalidateQueries({ queryKey: ["field-service", "equipment"] });
    },
    onError: () => {
      toast.error("Failed to add equipment");
    },
  });

  const scheduleServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fieldServiceApi.jobs.create(data),
    onSuccess: () => {
      toast.success("Service scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["field-service", "equipment"] });
      queryClient.invalidateQueries({ queryKey: ["field-service", "jobs"] });
    },
    onError: () => {
      toast.error("Failed to schedule service");
    },
  });

  if (equipmentQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => equipmentQuery.refetch()}>Retry</Button>
    </div>
  );

  const equipment = (equipmentQuery as any).data?.data ?? [];

  const expiringWarranties = MOCK_EQUIPMENT.filter(e => {
    const warrantyDate = new Date(e.warranty);
    const daysUntilExpiry = (warrantyDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry < 90;
  });

  const getDaysUntil = (date: string) => {
    const d = new Date(date);
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  if (equipmentQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Equipment Management</h2>
          <p className="text-sm text-muted-foreground">
            Track customer equipment, warranties, and service schedules
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Manage Types
          </button>
          <button
            onClick={() => createEquipmentMutation.mutate({ name: "New Equipment", type: "HVAC Unit", status: "operational" })}
            disabled={createEquipmentMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Warranty Expiring Soon */}
      {expiringWarranties.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-500">Warranties Expiring Soon</h3>
              <span className="ml-auto text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">
                {expiringWarranties.length} items
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {expiringWarranties.map((eq) => (
                <div key={eq.id} className="p-3 rounded-lg bg-amber-500/10">
                  <p className="font-medium text-sm">{eq.name}</p>
                  <p className="text-xs text-muted-foreground">{eq.customer}</p>
                  <p className="text-xs text-amber-500 mt-1">
                    Expires: {eq.warranty} ({getDaysUntil(eq.warranty)} days)
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Wrench className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{equipment.length}</p>
            <p className="text-xs text-muted-foreground">Total Equipment</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{equipment.filter((e: any) => e.status === "operational").length}</p>
            <p className="text-xs text-muted-foreground">Operational</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{equipment.filter((e: any) => e.status === "warning").length}</p>
            <p className="text-xs text-muted-foreground">Needs Attention</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{equipment.filter((e: any) => e.status === "maintenance").length}</p>
            <p className="text-xs text-muted-foreground">In Maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search equipment..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="hvac">HVAC</option>
          <option value="heat_pump">Heat Pump</option>
          <option value="generator">Generator</option>
          <option value="water_heater">Water Heater</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="operational">Operational</option>
          <option value="warning">Warning</option>
          <option value="maintenance">In Maintenance</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Customers</option>
          <option value="acme">Acme Corporation</option>
          <option value="techstart">TechStart Inc</option>
        </select>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((eq: any) => (
          <Card key={eq.id} className={`border-border/60 hover:border-primary/30 transition-colors ${
            eq.status === "warning" ? "border-amber-500/30" :
            eq.status === "maintenance" ? "border-blue-500/30" : ""
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    eq.status === "operational" ? "bg-green-500/10" :
                    eq.status === "warning" ? "bg-amber-500/10" :
                    "bg-blue-500/10"
                  }`}>
                    <Wrench className={`h-5 w-5 ${
                      eq.status === "operational" ? "text-green-500" :
                      eq.status === "warning" ? "text-amber-500" :
                      "text-blue-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{eq.name}</p>
                    <p className="text-xs text-muted-foreground">{eq.type}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  eq.status === "operational" ? "bg-green-500/10 text-green-500" :
                  eq.status === "warning" ? "bg-amber-500/10 text-amber-500" :
                  "bg-blue-500/10 text-blue-500"
                }`}>
                  {eq.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{eq.customer}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{eq.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Serial:</span>
                  <span className="font-mono text-xs">{eq.serial}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/30 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Installed</p>
                  <p className="text-sm font-medium">{eq.installed}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Warranty Until</p>
                  <p className={`text-sm font-medium ${
                    getDaysUntil(eq.warranty) < 90 ? "text-amber-500" : ""
                  }`}>{eq.warranty}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Service</p>
                  <p className="text-sm font-medium">{eq.lastService}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Service</p>
                  <p className={`text-sm font-medium ${
                    eq.nextService === "Overdue" ? "text-red-500" :
                    getDaysUntil(eq.nextService) < 30 ? "text-amber-500" : ""
                  }`}>{eq.nextService}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  View History
                </button>
                <button
                  onClick={() => scheduleServiceMutation.mutate({ equipmentId: eq.id, type: "maintenance", title: `Service for ${eq.name}` })}
                  disabled={scheduleServiceMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Schedule Service
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
