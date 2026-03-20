import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Container,
  Plus,
  Search,
  Settings,
  Activity,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  Terminal,
  Box,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/kubernetes")({
  component: Kubernetes,
});

const clusters = [
  { id: 1, name: "prod-cluster-us", status: "healthy", version: "1.28", nodes: 12, pods: 48, region: "us-east-1", cpuUsage: "34%", memoryUsage: "58%" },
  { id: 2, name: "prod-cluster-eu", status: "healthy", version: "1.28", nodes: 8, pods: 32, region: "eu-west-1", cpuUsage: "28%", memoryUsage: "52%" },
  { id: 3, name: "staging-cluster", status: "warning", version: "1.29", nodes: 4, pods: 18, region: "us-east-1", cpuUsage: "67%", memoryUsage: "74%" },
];

const deployments = [
  { id: 1, name: "frontend-deployment", namespace: "production", status: "healthy", ready: "3/3", replicas: 3, cpu: "245m", memory: "512Mi", lastDeploy: "2 hours ago" },
  { id: 2, name: "backend-api-deployment", namespace: "production", status: "healthy", ready: "3/3", replicas: 3, cpu: "890m", memory: "1.2Gi", lastDeploy: "2 hours ago" },
  { id: 3, name: "worker-deployment", namespace: "production", status: "healthy", ready: "5/5", replicas: 5, cpu: "1.2", memory: "2.1Gi", lastDeploy: "5 hours ago" },
  { id: 4, name: "ml-service-deployment", namespace: "ml", status: "warning", ready: "2/3", replicas: 3, cpu: "2.1", memory: "4.5Gi", lastDeploy: "1 day ago" },
];

const pods = [
  { id: 1, name: "frontend-7d8f9b-abc12", status: "Running", node: "prod-node-01", cpu: "45m", memory: "128Mi", restarts: 0 },
  { id: 2, name: "frontend-7d8f9b-def34", status: "Running", node: "prod-node-02", cpu: "52m", memory: "134Mi", restarts: 0 },
  { id: 3, name: "backend-5c6d7e-ghi78", status: "Running", node: "prod-node-01", cpu: "120m", memory: "256Mi", restarts: 0 },
  { id: 4, name: "backend-5c6d7e-jkl90", status: "Running", node: "prod-node-03", cpu: "98m", memory: "248Mi", restarts: 0 },
  { id: 5, name: "worker-9a0b1c-mno23", status: "Running", node: "prod-node-02", cpu: "180m", memory: "384Mi", restarts: 0 },
];

function Kubernetes() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kubernetes Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage clusters, deployments, pods, and services
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Terminal className="h-4 w-4" />
            kubectl Console
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Deployment
          </button>
        </div>
      </div>

      {/* Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {clusters.map((cluster) => (
          <Card key={cluster.id} className={`border-border/60 hover:border-primary/30 transition-colors ${
            cluster.status === "warning" ? "border-amber-500/30" : ""
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    cluster.status === "healthy" ? "bg-green-500/10" : "bg-amber-500/10"
                  }`}>
                    <Container className={`h-5 w-5 ${
                      cluster.status === "healthy" ? "text-green-500" : "text-amber-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{cluster.name}</p>
                    <p className="text-xs text-muted-foreground">v{cluster.version} - {cluster.region}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  cluster.status === "healthy" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                }`}>
                  {cluster.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-lg font-bold">{cluster.nodes}</p>
                  <p className="text-xs text-muted-foreground">Nodes</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-lg font-bold">{cluster.pods}</p>
                  <p className="text-xs text-muted-foreground">Pods</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">CPU</span>
                    <span className="font-medium">{cluster.cpuUsage}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: cluster.cpuUsage }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Memory</span>
                    <span className="font-medium">{cluster.memoryUsage}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: cluster.memoryUsage }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deployments */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Deployments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Namespace</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Ready</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CPU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Memory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Deploy</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((deployment) => (
                  <tr key={deployment.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3 text-sm font-medium">{deployment.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{deployment.namespace}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        deployment.status === "healthy" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {deployment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{deployment.ready}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{deployment.cpu}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{deployment.memory}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{deployment.lastDeploy}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1 rounded hover:bg-muted"><Pause className="h-4 w-4 text-muted-foreground" /></button>
                        <button className="p-1 rounded hover:bg-muted"><Play className="h-4 w-4 text-muted-foreground" /></button>
                        <button className="p-1 rounded hover:bg-muted"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pods */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Recent Pods</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pods.map((pod) => (
              <div key={pod.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/40">
                <div className={`p-2 rounded-lg ${
                  pod.status === "Running" ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <Box className={`h-5 w-5 ${
                    pod.status === "Running" ? "text-green-500" : "text-red-500"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{pod.name}</p>
                  <p className="text-xs text-muted-foreground">Node: {pod.node}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{pod.cpu} / {pod.memory}</p>
                  <p className="text-xs text-muted-foreground">{pod.restarts} restarts</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
