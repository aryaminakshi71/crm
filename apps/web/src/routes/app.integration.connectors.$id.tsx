import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Puzzle, TestTube, Trash2, Save } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integration/connectors/$id")({
  component: ConnectorDetailPage,
});

function ConnectorDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("inactive");
  const [config, setConfig] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/integration/connectors" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-bold text-xl text-foreground">Connector Details</h2>
          <p className="text-muted-foreground text-sm font-mono">ID: {id.slice(0, 8)}...</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Puzzle className="h-5 w-5" /> Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input type="password" placeholder="Enter API key..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook URL</label>
              <Input placeholder="https://..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" leftIcon={<TestTube className="h-4 w-4" />}>
                Test Connection
              </Button>
              <Button variant="primary" leftIcon={<Save className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground text-sm">Total Requests</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground text-sm">Successful</span>
              <span className="font-medium text-green-600">0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground text-sm">Failed</span>
              <span className="font-medium text-red-600">0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground text-sm">Last Sync</span>
              <span className="font-medium">Never</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete Connector</p>
              <p className="text-muted-foreground text-xs">This action cannot be undone.</p>
            </div>
            <Button variant="destructive" leftIcon={<Trash2 className="h-4 w-4" />}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
