import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Send,
} from "lucide-react";

export const Route = createFileRoute("/app/field-service/warranty")({
  component: Warranty,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const MOCK_WARRANTIES = [
  { id: 1, equipment: "Carrier HVAC Unit", serial: "CR-2024-12345", customer: "Acme Corporation", startDate: "2024-01-15", endDate: "2027-01-14", type: "Extended", status: "active", remainingDays: 300, coverage: ["Parts", "Labor", "Refrigerant"] },
  { id: 2, equipment: "Trane Heat Pump", serial: "TR-2023-98765", customer: "TechStart Inc", startDate: "2023-03-20", endDate: "2026-03-19", type: "Manufacturer", status: "expiring", remainingDays: -1, coverage: ["Parts", "Labor"] },
  { id: 3, equipment: "Generac Generator", serial: "GN-2022-54321", customer: "Metro Hospital", startDate: "2022-11-01", endDate: "2025-11-01", type: "Extended", status: "expiring_soon", remainingDays: 45, coverage: ["Parts", "Labor"] },
  { id: 4, equipment: "Rheem Water Heater", serial: "RH-2021-11111", customer: "Green Valley Clinic", startDate: "2021-08-10", endDate: "2029-08-09", type: "Manufacturer", status: "active", remainingDays: 1265, coverage: ["Parts", "Labor", "Tank Replacement"] },
  { id: 5, equipment: "Lennox AC Unit", serial: "LN-2019-33333", customer: "Riverside Apartments", startDate: "2019-07-22", endDate: "2024-07-21", type: "Manufacturer", status: "expired", remainingDays: -607, coverage: ["Parts"] },
  { id: 6, equipment: "York Heat Pump", serial: "YK-2020-22222", customer: "Harbor View Hotel", startDate: "2020-05-15", endDate: "2027-05-14", type: "Extended", status: "active", remainingDays: 421, coverage: ["Parts", "Labor", "Refrigerant"] },
];

const MOCK_CLAIMS = [
  { id: 1, equipment: "Carrier HVAC Unit", serial: "CR-2024-12345", claimNumber: "CLM-2026-001", date: "Mar 15, 2026", status: "approved", amount: 850, description: "Compressor failure - compressor replaced under warranty" },
  { id: 2, equipment: "Generac Generator", serial: "GN-2022-54321", claimNumber: "CLM-2026-002", date: "Mar 10, 2026", status: "pending", amount: 420, description: "Control board replacement" },
  { id: 3, equipment: "Trane Heat Pump", serial: "TR-2023-98765", claimNumber: "CLM-2026-003", date: "Mar 5, 2026", status: "denied", amount: 1200, description: "Compressor replacement - denied due to improper maintenance" },
];

function Warranty() {
  const { data: jobsData } = useQuery({
    queryKey: ["field-service-jobs-warranty"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/field-service/jobs`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  const warranties = MOCK_WARRANTIES;
  const claims = MOCK_CLAIMS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Warranty Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Monitor equipment warranties and manage claims
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <FileText className="h-4 w-4" />
            Claims Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            File Claim
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.length}</p>
            <p className="text-xs text-muted-foreground">Total Warranties</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.filter(w => w.status === "active").length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.filter(w => w.status.includes("expiring")).length}</p>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{warranties.filter(w => w.status === "expired").length}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search warranties..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="manufacturer">Manufacturer</option>
          <option value="extended">Extended</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warranties List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Warranties</h3>
              <div className="space-y-3">
                {warranties.map((warranty) => (
                  <div
                    key={warranty.id}
                    className={`p-4 rounded-lg border ${
                      warranty.status === "expired" ? "border-red-500/20 bg-red-500/5" :
                      warranty.status.includes("expiring") ? "border-amber-500/20 bg-amber-500/5" :
                      "border-border/40"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{warranty.equipment}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            warranty.status === "active" ? "bg-green-500/10 text-green-500" :
                            warranty.status === "expired" ? "bg-red-500/10 text-red-500" :
                            "bg-amber-500/10 text-amber-500"
                          }`}>
                            {warranty.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{warranty.customer}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">S/N: {warranty.serial}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          warranty.remainingDays < 0 ? "text-red-500" :
                          warranty.remainingDays < 90 ? "text-amber-500" :
                          "text-green-600"
                        }`}>
                          {warranty.remainingDays < 0
                            ? "Expired"
                            : warranty.remainingDays === 0
                              ? "Today"
                              : `${warranty.remainingDays}d`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {warranty.remainingDays < 0 ? "ago" : "remaining"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3 rounded bg-muted/30 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="text-sm font-medium">{warranty.startDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="text-sm font-medium">{warranty.endDate}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {warranty.coverage.map((item) => (
                        <span key={item} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                        View Details
                      </button>
                      {warranty.status !== "expired" && (
                        <button className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                          File Claim
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claims Sidebar */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Recent Claims</h3>
              <button className="text-xs text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className={`p-3 rounded-lg border ${
                    claim.status === "approved" ? "border-green-500/20" :
                    claim.status === "denied" ? "border-red-500/20" :
                    "border-amber-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{claim.claimNumber}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      claim.status === "approved" ? "bg-green-500/10 text-green-500" :
                      claim.status === "denied" ? "bg-red-500/10 text-red-500" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{claim.equipment}</p>
                  <p className="text-xs text-muted-foreground mb-2">{claim.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{claim.status === "denied" ? "" : `$${claim.amount}`}</span>
                    <span className="text-xs text-muted-foreground">{claim.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
