import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, Settings, Workflow, Trash2, Plus, GripVertical } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integration/workflows/$id")({
  component: WorkflowDetailPage,
});

function WorkflowDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState({
    name: "My Workflow",
    triggerType: "webhook",
    status: "draft",
  });
  const [steps, setSteps] = useState<Array<{ id: string; name: string; type: string }>>([]);

  const addStep = (type: string) => {
    setSteps([...steps, { id: crypto.randomUUID(), name: `New ${type} step`, type }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/integration/workflows" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl text-foreground">{workflow.name}</h2>
            <p className="text-muted-foreground text-sm font-mono">ID: {id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Play className="h-4 w-4" />}>
            Test Run
          </Button>
          <Button variant="primary" leftIcon={<Play className="h-4 w-4" />}>
            Activate
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Workflow Builder</CardTitle>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No steps yet. Add your first step to build the workflow.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium w-6">{index + 1}.</span>
                      <span className="flex-1">{step.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{step.type}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => addStep("trigger")}>
                  <Plus className="h-4 w-4 mr-1" /> Trigger
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep("action")}>
                  <Plus className="h-4 w-4 mr-1" /> Action
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep("condition")}>
                  <Plus className="h-4 w-4 mr-1" /> Condition
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep("transform")}>
                  <Plus className="h-4 w-4 mr-1" /> Transform
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={workflow.name} onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger Type</label>
                <Select value={workflow.triggerType} onValueChange={(v) => setWorkflow({ ...workflow, triggerType: v })}>
                  <option value="webhook">Webhook</option>
                  <option value="schedule">Schedule</option>
                  <option value="event">Event</option>
                  <option value="manual">Manual</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={workflow.status} onValueChange={(v) => setWorkflow({ ...workflow, status: v })}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Total Runs</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Successful</span>
                <span className="font-medium text-green-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Failed</span>
                <span className="font-medium text-red-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Last Run</span>
                <span className="font-medium">Never</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
