import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Puzzle, MoreHorizontal, Pencil, Trash2, TestTube } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integration/connectors")({
  component: ConnectorsPage,
});

const CONNECTOR_TYPES = [
  { value: "crm", label: "CRM" },
  { value: "invoicing", label: "Invoicing" },
  { value: "helpdesk", label: "Helpdesk" },
  { value: "airtable", label: "Airtable" },
  { value: "linear", label: "Linear" },
  { value: "notion", label: "Notion" },
  { value: "oauth2", label: "OAuth2" },
];

function ConnectorsPage() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [connectors, setConnectors] = useState<Array<{ id: string; name: string; type: string; status: string }>>([]);
  const [newConnector, setNewConnector] = useState({ name: "", type: "crm" });

  const handleCreate = () => {
    if (!newConnector.name.trim()) return;
    const connector = {
      id: crypto.randomUUID(),
      name: newConnector.name,
      type: newConnector.type,
      status: "inactive",
    };
    setConnectors([...connectors, connector]);
    setNewConnector({ name: "", type: "crm" });
    setShowCreateDialog(false);
  };

  const handleDelete = (id: string) => {
    setConnectors(connectors.filter((c) => c.id !== id));
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
              <h2 className="font-bold text-xl text-foreground">Connectors</h2>
              <p className="text-muted-foreground text-sm">
                Manage integrations with external services.
              </p>
            </div>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateDialog(true)}>
          Add Connector
        </Button>
      </div>

      {connectors.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <EmptyState
              icon={<Puzzle className="h-8 w-8" />}
              title="No connectors yet"
              description="Connect your CRM, invoicing, helpdesk, and other services to get started."
              action={
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateDialog(true)}>
                  Add Connector
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectors.map((connector) => (
                <TableRow key={connector.id}>
                  <TableCell className="font-medium">
                    <Link to={`/app/integration/connectors/${connector.id}`} className="hover:text-primary">
                      {connector.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{connector.type}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      connector.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {connector.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Test">
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => handleDelete(connector.id)}>
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Connector</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Connector Name</label>
              <Input
                placeholder="My Connector"
                value={newConnector.name}
                onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={newConnector.type} onValueChange={(value) => setNewConnector({ ...newConnector, type: value })}>
                {CONNECTOR_TYPES.map((type) => (
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
