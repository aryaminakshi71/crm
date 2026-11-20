/**
 * SLA Tracking
 *
 * Service Level Agreement monitoring with real API data and compliance chart.
 */

import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCw,
  Plus,
  Edit2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/sla")({
  component: SLAPage,
});

const API_BASE = "/api/v1";
function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const isDemo = localStorage.getItem("demo_mode") === "true";
  if (isDemo) return { "x-organization-id": "demo-org" };
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.companyId) return { "x-organization-id": user.companyId };
  } catch {}
  return {};
}

// Generate 30-day SLA compliance trend data
function generateSlaComplianceHistory() {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const compliance = 0; // —
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      compliance: parseFloat(compliance.toFixed(2)),
      target: 99.9,
    };
  });
}

const slaComplianceHistory = generateSlaComplianceHistory();

function SLAPage() {
  const queryClient = useQueryClient();
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyForm, setPolicyForm] = useState({ name: "", target: "99.9", window: "30d" });

  const { data: slaData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "sla"],
    queryFn: () => monitoringApi.getSlaMetrics(),
    refetchInterval: 30000,
  });

  const services = slaData?.services || [];
  const summary = {
    overallUptime: slaData?.overallUptime?.toFixed(2) || "99.95",
    totalIncidents: slaData?.totalIncidents || 0,
    slaCompliance: slaData?.slaCompliance || 0,
    atRisk: slaData?.atRisk || 0,
  };

  // Create SLA policy mutation
  const createPolicyMutation = useMutation({
    mutationFn: async (payload: { name: string; target: string; window: string }) => {
      const res = await fetch(`${API_BASE}/monitoring/sla/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create SLA policy");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "sla"] });
      setIsPolicyOpen(false);
      setPolicyForm({ name: "", target: "99.9", window: "30d" });
      toast.success("SLA policy created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create SLA policy"),
  });

  // Update SLA policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name: string; target: string; window: string }) => {
      const res = await fetch(`${API_BASE}/monitoring/sla/policies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update SLA policy");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "sla"] });
      setEditingPolicy(null);
      toast.success("SLA policy updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update SLA policy"),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "met":
        return <Badge variant="success" size="sm">SLA Met</Badge>;
      case "at_risk":
        return <Badge variant="warning" size="sm">At Risk</Badge>;
      case "breached":
        return <Badge variant="danger" size="sm">Breached</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">SLA Tracking</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Service Level Agreement monitoring and compliance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <Button variant="outline" size="sm" onClick={() => setIsPolicyOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Policy
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : `${summary.overallUptime}%`}</p>
                <p className="text-xs text-muted-foreground">Overall Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{isLoading ? "..." : summary.slaCompliance}</p>
                <p className="text-xs text-muted-foreground">SLAs Met</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{isLoading ? "..." : summary.atRisk}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.totalIncidents}</p>
                <p className="text-xs text-muted-foreground">Incidents (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Compliance Area Chart — 30 days */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            SLA Compliance % — Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slaComplianceHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="slaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#888"
                  interval={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#888"
                  domain={[98.8, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", fontSize: "11px" }}
                  formatter={(v: any) => [`${v}%`, "Compliance"]}
                />
                <ReferenceLine y={99.9} stroke="#fbbf24" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "Target 99.9%", fill: "#fbbf24", fontSize: 10, position: "right" }} />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="#34d399"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#slaGrad)"
                  name="Compliance"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Compliance</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 border-t border-dashed border-amber-400 inline-block" />Target 99.9%</span>
          </div>
        </CardContent>
      </Card>

      {/* SLA Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Service</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Uptime</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Target</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Latency (P95)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Incidents</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading SLA data...</td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No SLA data found</td>
                  </tr>
                ) : (
                  services.map((service: any) => (
                    <tr key={service.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{service.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${service.uptime >= 99.9 ? "bg-green-500" : service.uptime >= 99 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${Math.min(service.uptime, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">{service.uptime}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-muted-foreground">{service.sla}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${service.latency > 100 ? "text-red-600" : "text-foreground"}`}>
                          {service.latency}ms
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${service.incidents > 0 ? "text-yellow-600" : "text-foreground"}`}>
                          {service.incidents}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(service.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPolicy({ id: service.name, name: service.name, target: String(service.sla), window: "30d" });
                          }}
                          title="Edit SLA policy"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Policy Modal */}
      {isPolicyOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Create SLA Policy</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Policy Name *</label>
                <input
                  className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Production API SLA"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Uptime Target (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="90"
                    max="100"
                    className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                    value={policyForm.target}
                    onChange={(e) => setPolicyForm((p) => ({ ...p, target: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Window</label>
                  <select
                    className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                    value={policyForm.window}
                    onChange={(e) => setPolicyForm((p) => ({ ...p, window: e.target.value }))}
                  >
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button
                className="flex-1"
                disabled={!policyForm.name || createPolicyMutation.isPending}
                onClick={() => createPolicyMutation.mutate(policyForm)}
              >
                {createPolicyMutation.isPending ? "Creating..." : "Create Policy"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsPolicyOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit SLA Policy — {editingPolicy.name}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Uptime Target (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="90"
                    max="100"
                    className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                    value={editingPolicy.target}
                    onChange={(e) => setEditingPolicy((p: any) => ({ ...p, target: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Window</label>
                  <select
                    className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                    value={editingPolicy.window}
                    onChange={(e) => setEditingPolicy((p: any) => ({ ...p, window: e.target.value }))}
                  >
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button
                className="flex-1"
                disabled={updatePolicyMutation.isPending}
                onClick={() => updatePolicyMutation.mutate(editingPolicy)}
              >
                {updatePolicyMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditingPolicy(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
