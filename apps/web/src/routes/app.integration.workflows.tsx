import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Workflow, Pencil, Trash2, Play, Pause } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integration/workflows")({
  component: WorkflowsPage,
});

const TRIGGER_TYPES = [
  { value: "webhook", label: "Webhook" },
  { value: "schedule", label: "Schedule" },
  { value: "event", label: "Event" },
  { value: "manual", label: "Manual" },
];

function WorkflowsPage() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [workflows, setWorkflows] = useState<Array<{
    id: string;
    name: string;
    description: string;
    triggerType: string;
    status: string;
    runCount: number;
  }>>([]);
  const [newWorkflow, setNewWorkflow] = useState({ name: "", description: "", triggerType: "webhook" });

  const handleCreate = () => {
    if (!newWorkflow.name.trim()) return;
    const workflow = {
      id: crypto.randomUUID(),
      name: newWorkflow.name,
      description: newWorkflow.description,
      triggerType: newWorkflow.triggerType,
      status: "draft",
      runCount: 0,
    };
    setWorkflows([...workflows, workflow]);
    setNewWorkflow({ name: "", description: "", triggerType: "webhook" });
    setShowCreateDialog(false);
  };

  const handleDelete = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
  };

  const toggleStatus = (id: string) => {
    setWorkflows(workflows.map((w) =>
      w.id === id ? { ...w, status: w.status === "active" ? "paused" : "active" } : w
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/integration" })}>
              ←
            </Button>
            <div>
              <h2 className="font-bold text-xl text-foreground">Workflows</h2>
              <p className="text-muted-foreground text-sm">
                Build and automate multi-step workflows.
              </p>
            </div>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateDialog(true)}>
          Create Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <EmptyState
              icon={<Workflow className="h-8 w-8" />}
              title="No workflows yet"
              description="Create automated workflows with triggers, conditions, and actions to streamline your processes."
              action={
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateDialog(true)}>
                  Create Workflow
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">
                    <Link to={`/app/integration/workflows/${workflow.id}`} className="hover:text-primary">
                      {workflow.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{workflow.triggerType}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      workflow.status === "active" ? "bg-green-100 text-green-800" :
                      workflow.status === "draft" ? "bg-gray-100 text-gray-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {workflow.status}
                    </span>
                  </TableCell>
                  <TableCell>{workflow.runCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Toggle" onClick={() => toggleStatus(workflow.id)}>
                        {workflow.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => handleDelete(workflow.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workflow Name</label>
              <Input
                placeholder="My Workflow"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="What does this workflow do?"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trigger Type</label>
              <Select value={newWorkflow.triggerType} onValueChange={(value) => setNewWorkflow({ ...newWorkflow, triggerType: value })}>
                {TRIGGER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
