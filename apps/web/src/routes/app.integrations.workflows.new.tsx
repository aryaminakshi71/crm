/**
 * Workflow Builder
 *
 * Drag-and-drop workflow creation interface.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Pause,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Zap,
  Clock,
  Webhook,
  Database,
  Mail,
  Bell,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/workflows/new")({
  component: WorkflowBuilder,
});

function WorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState("");
  const [steps, setSteps] = useState([
    { id: "trigger", type: "trigger", name: "New Lead Created", description: "Triggered when a new lead is created" },
  ]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trigger" | "action" | "logic">("trigger");

  const triggerNodes = [
    { id: "new_lead", name: "New Lead", description: "When a new lead is created", icon: Zap, category: "CRM" },
    { id: "new_contact", name: "New Contact", description: "When a contact is added", icon: Zap, category: "CRM" },
    { id: "deal_won", name: "Deal Won", description: "When a deal is closed won", icon: Zap, category: "CRM" },
    { id: "payment_failed", name: "Payment Failed", description: "When a payment fails", icon: Zap, category: "Payments" },
    { id: "order_created", name: "Order Created", description: "When an order is placed", icon: Zap, category: "E-commerce" },
    { id: "webhook", name: "Webhook", description: "Receive an HTTP webhook", icon: Webhook, category: "HTTP" },
    { id: "schedule", name: "Schedule", description: "Run on a schedule", icon: Clock, category: "Time" },
  ];

  const actionNodes = [
    { id: "create_contact", name: "Create Contact", description: "Create a new contact", icon: Plus, category: "CRM" },
    { id: "send_email", name: "Send Email", description: "Send an email notification", icon: Mail, category: "Communication" },
    { id: "send_slack", name: "Send Slack", description: "Send a Slack message", icon: Bell, category: "Communication" },
    { id: "update_record", name: "Update Record", description: "Update a CRM record", icon: Database, category: "CRM" },
    { id: "http_request", name: "HTTP Request", description: "Make an HTTP request", icon: Webhook, category: "HTTP" },
    { id: "webhook", name: "Send Webhook", description: "Send data to a webhook", icon: Webhook, category: "HTTP" },
  ];

  const logicNodes = [
    { id: "filter", name: "Filter", description: "Filter based on conditions", icon: ChevronRight, category: "Logic" },
    { id: "switch", name: "Switch", description: "Branch based on conditions", icon: ChevronDown, category: "Logic" },
    { id: "delay", name: "Delay", description: "Wait for a duration", icon: Clock, category: "Time" },
    { id: "loop", name: "Loop", description: "Loop over items", icon: Plus, category: "Logic" },
  ];

  const addStep = (nodeId: string, type: "trigger" | "action" | "logic") => {
    const nodeLists = { trigger: triggerNodes, action: actionNodes, logic: logicNodes };
    const node = nodeLists[type].find((n) => n.id === nodeId);
    if (node) {
      setSteps([...steps, { id: `${nodeId}_${Date.now()}`, type: type === "trigger" ? "action" : type, name: node.name, description: node.description }]);
    }
  };

  const removeStep = (stepId: string) => {
    if (stepId !== "trigger") {
      setSteps(steps.filter((s) => s.id !== stepId));
    }
  };

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
          <Input
            placeholder="Untitled Workflow"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-md font-bold text-lg border-0 shadow-none p-0 h-auto focus:ring-0"
          />
          <p className="text-sm text-muted-foreground">Draft workflow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button size="sm">Save Workflow</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Node Palette */}
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 h-9" />
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {(["trigger", "action", "logic"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {tab}s
                </button>
              ))}
            </div>

            {/* Nodes */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {(activeTab === "trigger" ? triggerNodes : activeTab === "action" ? actionNodes : logicNodes).map((node) => (
                <button
                  key={node.id}
                  onClick={() => addStep(node.id, activeTab)}
                  className="w-full p-3 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <node.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{node.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{node.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Canvas */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 min-h-[500px] bg-muted/30 rounded-lg p-4">
              {steps.map((step, idx) => (
                <div key={step.id}>
                  {/* Step Card */}
                  <div
                    className={`relative bg-card border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedStep === step.id ? "border-primary shadow-md" : "border-border"
                    }`}
                    onClick={() => setSelectedStep(step.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={step.type === "trigger" ? "info" : step.type === "action" ? "success" : "warning"} size="sm">
                            {step.type}
                          </Badge>
                          <h4 className="font-medium text-sm">{step.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                      {step.id !== "trigger" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(step.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Connector Arrow */}
                  {idx < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="w-0.5 h-8 bg-border" />
                    </div>
                  )}
                </div>
              ))}

              {steps.length === 1 && (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">Add your first action</p>
                  <p className="text-xs text-muted-foreground">
                    Click on components in the left panel to add steps
                  </p>
                </div>
              )}

              {/* Add Step Button */}
              {steps.length > 1 && (
                <Button variant="outline" className="w-full" leftIcon={<Plus className="h-4 w-4" />}>
                  Add Step
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Properties Panel */}
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStep ? (
              <StepProperties step={steps.find((s) => s.id === selectedStep)} />
            ) : (
              <div className="text-center py-8">
                <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a step to configure its properties
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepProperties({ step }: { step?: { id: string; type: string; name: string; description: string } }) {
  if (!step) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Step Name</label>
        <Input defaultValue={step.name} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
        <Input defaultValue={step.description} />
      </div>

      {step.type === "trigger" && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Configuration</h4>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Connector</label>
            <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option>Salesforce</option>
              <option>HubSpot</option>
              <option>Stripe</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
            <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option>New Record</option>
              <option>Updated Record</option>
              <option>Deleted Record</option>
            </select>
          </div>
        </div>
      )}

      {step.type === "action" && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Configuration</h4>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Action</label>
            <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option>Create Record</option>
              <option>Update Record</option>
              <option>Delete Record</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Target Object</label>
            <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option>Contact</option>
              <option>Lead</option>
              <option>Opportunity</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Field Mappings</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs w-20">email</span>
                <Input placeholder="source.email" className="h-8 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-20">name</span>
                <Input placeholder="source.name" className="h-8 text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <Button variant="outline" size="sm" className="w-full" leftIcon={<Play className="h-4 w-4" />}>
          Test Step
        </Button>
      </div>
    </div>
  );
}
