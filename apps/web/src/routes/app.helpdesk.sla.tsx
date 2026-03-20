/**
 * SLA Management
 *
 * Configure and monitor SLA policies and compliance.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Clock,
  Edit,
  Plus,
  Scale,
  Timer,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/sla")({
  component: SLAManagement,
});

const slaPolicies = [
  {
    id: "1",
    name: "Critical Issues",
    description: "Response and resolution for critical business impacting issues",
    firstResponseTime: 15,
    nextResponseTime: 60,
    resolutionTime: 240,
    priority: "urgent",
    compliance: 94.5,
    breached: 3,
    breachedThisMonth: 1,
  },
  {
    id: "2",
    name: "High Priority",
    description: "Response for high priority issues affecting multiple users",
    firstResponseTime: 30,
    nextResponseTime: 120,
    resolutionTime: 480,
    priority: "high",
    compliance: 91.2,
    breached: 12,
    breachedThisMonth: 3,
  },
  {
    id: "3",
    name: "Medium Priority",
    description: "Standard response for medium priority issues",
    firstResponseTime: 60,
    nextResponseTime: 240,
    resolutionTime: 1440,
    priority: "medium",
    compliance: 88.7,
    breached: 24,
    breachedThisMonth: 8,
  },
  {
    id: "4",
    name: "Low Priority",
    description: "Response for low priority general questions",
    firstResponseTime: 120,
    nextResponseTime: 480,
    resolutionTime: 2880,
    priority: "low",
    compliance: 82.3,
    breached: 45,
    breachedThisMonth: 12,
  },
];

const slaMetrics = [
  { id: "1", metric: "First Response Time", value: "28 min", target: "30 min", status: "good" },
  { id: "2", metric: "Avg Resolution Time", value: "4.2 hrs", target: "8 hrs", status: "good" },
  { id: "3", metric: "Next Response Time", value: "1.4 hrs", target: "2 hrs", status: "good" },
  { id: "4", metric: "SLA Compliance", value: "89.2%", target: "90%", status: "warning" },
];

function SLAManagement() {
  const [activeTab, setActiveTab] = useState<"policies" | "metrics" | "breaches">("policies");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/helpdesk">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">SLA Management</h2>
            <p className="text-sm text-muted-foreground">Configure service level agreements and monitor compliance</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          New SLA Policy
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Overall Compliance" value="89.2%" trend="-2.1%" icon={<Scale className="h-4 w-4" />} color="text-amber-400" />
        <StatCard title="Breached This Month" value="24" trend="+8" icon={<AlertCircle className="h-4 w-4" />} color="text-rose-400" />
        <StatCard title="At Risk Tickets" value="12" trend="+3" icon={<Timer className="h-4 w-4" />} color="text-amber-400" />
        <StatCard title="On Track" value="156" trend="+12" icon={<CheckCircle className="h-4 w-4" />} color="text-emerald-400" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "policies", label: "SLA Policies" },
            { id: "metrics", label: "Metrics" },
            { id: "breaches", label: "Breaches" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Policies Tab */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          {slaPolicies.map((policy) => (
            <Card key={policy.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{policy.name}</h3>
                      <Badge variant={policy.priority === "urgent" ? "danger" : policy.priority === "high" ? "warning" : "outline"}>
                        {policy.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{policy.description}</p>

                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">First Response</p>
                        <p className="text-sm font-medium">{policy.firstResponseTime} min</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Next Response</p>
                        <p className="text-sm font-medium">{policy.nextResponseTime} min</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Resolution</p>
                        <p className="text-sm font-medium">{policy.resolutionTime / 60} hrs</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Compliance</p>
                        <p className={`text-sm font-medium ${policy.compliance < 90 ? "text-rose-400" : "text-emerald-400"}`}>
                          {policy.compliance}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{policy.compliance}%</p>
                        <p className="text-xs text-muted-foreground">compliance</p>
                      </div>
                      <div className="w-16">
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${policy.compliance >= 90 ? "bg-emerald-400" : policy.compliance >= 80 ? "bg-amber-400" : "bg-rose-400"}`}
                            style={{ width: `${policy.compliance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{policy.breached} total breaches</span>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === "metrics" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              SLA Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {slaMetrics.map((metric) => (
                <div key={metric.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{metric.metric}</p>
                    {metric.status === "good" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">Target: {metric.target}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breaches Tab */}
      {activeTab === "breaches" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Recent SLA Breaches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Ticket</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Policy</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">SLA Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Breached By</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ticket: "TKT-004", policy: "Critical Issues", type: "First Response", breachedBy: "45 min", date: "2 hours ago" },
                  { ticket: "TKT-012", policy: "High Priority", type: "Resolution", breachedBy: "2 hrs", date: "5 hours ago" },
                  { ticket: "TKT-015", policy: "Medium Priority", type: "First Response", breachedBy: "15 min", date: "1 day ago" },
                  { ticket: "TKT-018", policy: "Low Priority", type: "Resolution", breachedBy: "6 hrs", date: "2 days ago" },
                ].map((breach) => (
                  <tr key={breach.ticket} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{breach.ticket}</td>
                    <td className="px-4 py-3 text-sm">{breach.policy}</td>
                    <td className="px-4 py-3 text-sm">{breach.type}</td>
                    <td className="px-4 py-3 text-sm text-rose-400">{breach.breachedBy}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{breach.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string; value: string; trend: string; icon: React.ReactNode; color: string }) {
  const trendPositive = !trend.startsWith("+");
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
            <div className="mt-1 flex items-center gap-1">
              {trendPositive ? (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              ) : (
                <TrendingUp className="h-3 w-3 text-rose-400" />
              )}
              <span className="text-[10px] font-bold text-rose-400">{trend}</span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
