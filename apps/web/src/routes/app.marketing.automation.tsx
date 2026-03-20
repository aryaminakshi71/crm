/**
 * Automation Workflow Builder
 *
 * Visual workflow builder for marketing automation.
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
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle,
  Cpu,
  Edit,
  Filter,
  GitBranch,
  Globe,
  GripVertical,
  Mail,
  Pause,
  Play,
  Plus,
  Square,
  Trash2,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/marketing/automation")({
  component: AutomationWorkflow,
});

const workflows = [
  {
    id: "1",
    name: "Welcome Series",
    status: "active",
    description: "Onboard new subscribers with a 5-email sequence",
    triggers: ["New subscriber"],
    enrolled: 1245,
    completed: 1089,
    metrics: { openRate: 42.5, clickRate: 8.2, conversions: 156 },
  },
  {
    id: "2",
    name: "Abandoned Cart Recovery",
    status: "active",
    description: "Recover lost carts with 3-email sequence",
    triggers: ["Cart abandoned"],
    enrolled: 456,
    completed: 312,
    metrics: { openRate: 45.3, clickRate: 12.8, conversions: 89 },
  },
  {
    id: "3",
    name: "Lead Nurture Sequence",
    status: "active",
    description: "Nurture leads over 30 days to conversion",
    triggers: ["Form submitted", "Demo requested"],
    enrolled: 892,
    completed: 567,
    metrics: { openRate: 38.2, clickRate: 6.4, conversions: 78 },
  },
  {
    id: "4",
    name: "Win-back Campaign",
    status: "paused",
    description: "Re-engage inactive customers",
    triggers: ["No purchase (90 days)"],
    enrolled: 234,
    completed: 198,
    metrics: { openRate: 28.1, clickRate: 4.2, conversions: 23 },
  },
  {
    id: "5",
    name: "Post-Purchase Follow-up",
    status: "draft",
    description: "Thank you and upsell sequence",
    triggers: ["Purchase completed"],
    enrolled: 0,
    completed: 0,
    metrics: { openRate: 0, clickRate: 0, conversions: 0 },
  },
];

const workflowSteps = [
  { id: "trigger", name: "Trigger", icon: Zap, description: "Starting event", color: "bg-violet-500/10 text-violet-400" },
  { id: "filter", name: "Filter", icon: Filter, description: "Conditional split", color: "bg-amber-500/10 text-amber-400" },
  { id: "email", name: "Send Email", icon: Mail, description: "Send email action", color: "bg-primary/10 text-primary" },
  { id: "wait", name: "Wait", icon: Clock, description: "Delay period", color: "bg-muted text-muted-foreground" },
  { id: "condition", name: "Condition", icon: GitBranch, description: "Branch path", color: "bg-emerald-500/10 text-emerald-400" },
  { id: "action", name: "Action", icon: Cpu, description: "External action", color: "bg-rose-500/10 text-rose-400" },
  { id: "notification", name: "Notify", icon: Bell, description: "Send notification", color: "bg-cyan-500/10 text-cyan-400" },
];

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AutomationWorkflow() {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>("1");
  const [viewMode, setViewMode] = useState<"list" | "builder">("list");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/marketing">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Automation Workflows</h2>
            <p className="text-sm text-muted-foreground">Build automated marketing sequences</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-muted" : ""}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("builder")}
              className={`rounded px-3 py-1.5 text-sm ${viewMode === "builder" ? "bg-muted" : ""}`}
            >
              Builder
            </button>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            New Workflow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Active Workflows" value="3" icon={<Play className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Total Enrolled" value="2,827" icon={<Users className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Completed" value="2,166" icon={<CheckCircle className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Avg Conversion" value="8.4%" icon={<TrendingUp className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {viewMode === "list" ? (
        /* Workflow List */
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className={`cursor-pointer transition-colors ${activeWorkflow === workflow.id ? "border-primary" : "hover:border-primary/50"}`}
              onClick={() => setActiveWorkflow(workflow.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge variant={workflow.status === "active" ? "success" : workflow.status === "paused" ? "warning" : "outline"}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{workflow.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {workflow.triggers.map((trigger) => (
                        <Badge key={trigger} variant="outline" className="text-xs">
                          <Zap className="mr-1 h-3 w-3" />
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{workflow.enrolled}</p>
                      <p className="text-xs text-muted-foreground">Enrolled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{workflow.completed}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">{workflow.metrics.conversions}</p>
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {workflow.status === "active" ? (
                        <Button variant="ghost" size="sm" leftIcon={<Pause className="h-4 w-4" />}>
                          Pause
                        </Button>
                      ) : workflow.status === "paused" ? (
                        <Button variant="ghost" size="sm" leftIcon={<Play className="h-4 w-4" />}>
                          Resume
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Workflow Builder */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Steps */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Workflow Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    draggable
                    className="flex cursor-grab items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${step.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{step.name}</p>
                      <p className="text-[10px] text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Center - Workflow Canvas */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Workflow Canvas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" leftIcon={<Play className="h-4 w-4" />}>
                  Test
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />}>
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[500px] rounded-lg border border-dashed border-border bg-muted/20 p-8">
                {/* Workflow Visualization */}
                <div className="flex flex-col items-center gap-8">
                  {/* Trigger */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-64 items-center justify-center rounded-xl bg-violet-500/10 border-2 border-violet-500 text-violet-400">
                      <Zap className="mr-2 h-5 w-5" />
                      <span className="font-semibold">New Subscriber</span>
                    </div>
                    <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
                  </div>

                  {/* Filter */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-64 cursor-pointer items-center justify-center rounded-xl bg-amber-500/10 border-2 border-amber-500 text-amber-400 hover:bg-amber-500/20">
                      <Filter className="mr-2 h-5 w-5" />
                      <span className="font-semibold">Check Email Verified?</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-emerald-400">Yes</span>
                        <ArrowRight className="h-6 w-6 rotate-90 text-emerald-400" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-rose-400">No</span>
                        <ArrowRight className="h-6 w-6 rotate-90 text-rose-400" />
                      </div>
                    </div>
                  </div>

                  {/* Email Steps */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-64 items-center justify-center rounded-xl bg-primary/10 border-2 border-primary text-primary">
                      <Mail className="mr-2 h-5 w-5" />
                      <span className="font-semibold">Send Welcome Email</span>
                    </div>
                    <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
                  </div>

                  {/* Wait */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-64 cursor-pointer items-center justify-center rounded-xl bg-muted border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary/50">
                      <Clock className="mr-2 h-5 w-5" />
                      <span className="font-semibold">Wait 3 Days</span>
                    </div>
                    <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
                  </div>

                  {/* Condition */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-64 cursor-pointer items-center justify-center rounded-xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/20">
                      <GitBranch className="mr-2 h-5 w-5" />
                      <span className="font-semibold">Opened Email?</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-emerald-400">Yes</span>
                        <ArrowRight className="h-6 w-6 rotate-90 text-emerald-400" />
                        <div className="flex h-12 w-48 items-center justify-center rounded-lg bg-primary/10 border border-primary text-primary text-sm">
                          Send Offer Email
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">No</span>
                        <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
                        <div className="flex h-12 w-48 items-center justify-center rounded-lg bg-muted border border-muted-foreground/30 text-muted-foreground text-sm">
                          Send Reminder
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* End */}
                  <div className="mt-4 flex h-12 w-32 items-center justify-center rounded-full bg-foreground/10 text-sm text-muted-foreground">
                    End
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
