import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, Card, CardContent, EmptyState, Input } from "@crm/ui";
import { Play, Plus, Trash2, Zap } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const serverlessApi = {
  list: () =>
    fetch(`${API_BASE}/devops/serverless`, { headers: getOrgHeader() }).then((r) =>
      r.json()
    ),
  deploy: (data: Record<string, unknown>) =>
    fetch(`${API_BASE}/devops/serverless`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  invoke: (id: string, payload?: Record<string, unknown>) =>
    fetch(`${API_BASE}/devops/serverless/${id}/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
      body: JSON.stringify(payload ?? {}),
    }).then((r) => r.json()),
  delete: (id: string) =>
    fetch(`${API_BASE}/devops/serverless/${id}`, {
      method: "DELETE",
      headers: getOrgHeader(),
    }).then((r) => r.json()),
};

export const Route = createFileRoute("/app/devops/serverless")({
  component: Serverless,
});

function Serverless() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [fnName, setFnName] = useState("");
  const [runtime, setRuntime] = useState("nodejs20.x");

  const { data, isLoading } = useQuery({
    queryKey: ["devops", "serverless"],
    queryFn: () => serverlessApi.list(),
  });

  const functions: Array<{
    id: string;
    name: string;
    runtime?: string;
    status?: string;
    lastInvoked?: string;
    invocations?: number;
  }> =
    (data as any)?.data ??
    (data as any)?.functions ??
    (Array.isArray(data) ? data : []);

  const deployFn = useMutation({
    mutationFn: (payload: { name: string; runtime: string }) =>
      serverlessApi.deploy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "serverless"] });
      toast.success("Function deployed");
      setFnName("");
      setShowForm(false);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to deploy function"),
  });

  const invokeFn = useMutation({
    mutationFn: (id: string) => serverlessApi.invoke(id),
    onSuccess: () => toast.success("Function invoked"),
    onError: (e: Error) => toast.error(e.message || "Failed to invoke function"),
  });

  const deleteFn = useMutation({
    mutationFn: (id: string) => serverlessApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "serverless"] });
      toast.success("Function deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete function"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Serverless Functions</h2>
          <p className="text-sm text-muted-foreground">Deploy and manage serverless functions</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" />
          Deploy Function
        </Button>
      </div>

      {showForm && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Deploy Function</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Function name"
                value={fnName}
                onChange={(e) => setFnName(e.target.value)}
              />
              <select
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
              >
                <option value="nodejs20.x">Node.js 20.x</option>
                <option value="nodejs18.x">Node.js 18.x</option>
                <option value="python3.12">Python 3.12</option>
                <option value="python3.11">Python 3.11</option>
                <option value="go1.x">Go 1.x</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => deployFn.mutate({ name: fnName, runtime })}
                disabled={!fnName || deployFn.isPending}
              >
                {deployFn.isPending ? "Deploying..." : "Deploy"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : functions.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-12 w-12 text-muted-foreground/50" />}
          title="Serverless Functions coming soon"
          description="Deploy and monitor serverless functions across AWS Lambda, Google Cloud Functions, Vercel, and Cloudflare Workers — all from one place."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Deploy First Function
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {functions.map((fn) => (
                <div
                  key={fn.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{fn.name}</p>
                      {fn.status && (
                        <Badge
                          variant={fn.status === "active" ? "success" : "outline"}
                          size="sm"
                        >
                          {fn.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {fn.runtime && <span>{fn.runtime}</span>}
                      {fn.invocations != null && (
                        <span>{fn.invocations.toLocaleString()} invocations</span>
                      )}
                      {fn.lastInvoked && <span>Last: {fn.lastInvoked}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => invokeFn.mutate(fn.id)}
                      disabled={invokeFn.isPending}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-muted transition-colors text-muted-foreground"
                      title="Invoke function"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Invoke
                    </button>
                    <button
                      onClick={() => deleteFn.mutate(fn.id)}
                      disabled={deleteFn.isPending}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Delete function"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
