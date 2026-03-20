/**
 * Workflow Detail
 *
 * View workflow configuration, runs, and analytics.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Play,
  Pause,
  Copy,
  Trash2,
  Settings,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  Activity,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/integrations/workflows/$id")({
  component: WorkflowDetail,
});

function WorkflowDetail() {
  const [isActive, setIsActive] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "runs" | "settings">("overview");

  const workflow = {
    id: "wf1",
    name: "Lead Sync to Salesforce",
    description: "Automatically sync new leads from landing pages to Salesforce.",
    trigger: "New lead created",
    connector: "Salesforce",
    status: "active",
    lastRun: "2 min ago",
    nextRun: "in 3 min",
    runs: 1243,
    successRate: 99.2,
    avgDuration: "1.2s",
    createdAt: "Jan 15, 2024",
    updatedAt: "2 hours ago",
  };

  const runHistory = [
    { id: "r1", status: "success", duration: "1.1s", startedAt: "2 min ago", completedAt: "Just now" },
    { id: "r2", status: "success", duration: "1.3s", startedAt: "7 min ago", completedAt: "5 min ago" },
    { id: "r3", status: "success", duration: "1.0s", startedAt: "12 min ago", completedAt: "10 min ago" },
    { id: "r4", status: "error", duration: "0.5s", startedAt: "1 hour ago", completedAt: "1 hour ago", error: "Connection timeout" },
    { id: "r5", status: "success", duration: "1.4s", startedAt: "2 hours ago", completedAt: "2 hours ago" },
  ];

  const performanceData = [
    { time: "00:00", success: 45, failed: 1 },
    { time: "04:00", success: 32, failed: 0 },
    { time: "08:00", success: 89, failed: 2 },
    { time: "12:00", success: 112, failed: 3 },
    { time: "16:00", success: 95, failed: 1 },
    { time: "20:00", success: 67, failed: 2 },
    { time: "Now", success: 23, failed: 0 },
  ];

  const steps = [
    { id: 1, name: "Trigger", description: "New lead created in landing page", type: "trigger" },
    { id: 2, name: "Filter", description: "Lead source = 'Webinar'", type: "logic" },
    { id: 3, name: "Transform", description: "Map fields to Salesforce format", type: "action" },
    { id: 4, name: "Create Record", description: "Create Lead in Salesforce", type: "action" },
    { id: 5, name: "Notify", description: "Send Slack notification", type: "action" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/integrations/workflows">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{workflow.name}</h1>
            <Badge variant={workflow.status === "active" ? "success" : "warning"}>
              {workflow.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{workflow.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Copy className="h-4 w-4" />}>
            Duplicate
          </Button>
          <Button
            variant={isActive ? "outline" : "ghost"}
            size="sm"
            leftIcon={isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? "Pause" : "Activate"}
          </Button>
          <Button variant="destructive" size="sm" leftIcon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflow.successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflow.runs.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflow.avgDuration}</p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workflow.lastRun}</p>
                <p className="text-xs text-muted-foreground">Last Run</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {(["overview", "runs", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workflow Steps */}
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Workflow Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {step.id}
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              step.type === "trigger"
                                ? "info"
                                : step.type === "logic"
                                ? "warning"
                                : "success"
                            }
                            size="sm"
                          >
                            {step.type}
                          </Badge>
                          <span className="font-medium text-sm">{step.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Performance (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="success"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#colorSuccess)"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#colorFailed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Success
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Failed
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "runs" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Run History</CardTitle>
              <Button variant="outline" size="sm" leftIcon={<History className="h-4 w-4" />}>
                View All Runs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runHistory.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {run.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Run #{run.id}</span>
                      {run.error && (
                        <Badge variant="danger" size="sm">{run.error}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Started: {run.startedAt} / Completed: {run.completedAt}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{run.duration}</span>
                    <p className="text-xs text-muted-foreground">duration</p>
                  </div>
                  <Button variant="ghost" size="sm">View Details</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Workflow Name</label>
                <Input defaultValue={workflow.name} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <Input defaultValue={workflow.description} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Trigger Type</label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option>New lead created</option>
                  <option>New contact</option>
                  <option>Manual trigger</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Error Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Retry Policy</label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option>3 retries with exponential backoff</option>
                  <option>5 retries with exponential backoff</option>
                  <option>No retries</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">On Failure</label>
                <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option>Send notification</option>
                  <option>Skip and continue</option>
                  <option>Stop workflow</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Send email on repeated failures</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
