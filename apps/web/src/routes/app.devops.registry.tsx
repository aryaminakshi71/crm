import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Container,
  Plus,
  Search,
  Download,
  Trash2,
  Clock,
  HardDrive,
  Eye,
  Copy,
  Tag,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/registry")({
  component: Registry,
});

const images = [
  { id: 1, name: "frontend", tag: "v2.1.45", size: "145 MB", digest: "sha256:abc123...", layers: 12, lastPushed: "2 hours ago", vulnerabilities: 0 },
  { id: 2, name: "frontend", tag: "v2.1.44", size: "143 MB", digest: "sha256:def456...", layers: 12, lastPushed: "1 day ago", vulnerabilities: 0 },
  { id: 3, name: "backend-api", tag: "v3.2.12", size: "234 MB", digest: "sha256:ghi789...", layers: 18, lastPushed: "2 hours ago", vulnerabilities: 2 },
  { id: 4, name: "backend-api", tag: "v3.2.11", size: "232 MB", digest: "sha256:jkl012...", layers: 18, lastPushed: "1 day ago", vulnerabilities: 2 },
  { id: 5, name: "worker", tag: "latest", size: "189 MB", digest: "sha256:mno345...", layers: 15, lastPushed: "5 hours ago", vulnerabilities: 0 },
  { id: 6, name: "ml-service", tag: "v1.5.8", size: "1.2 GB", digest: "sha256:pqr678...", layers: 42, lastPushed: "1 day ago", vulnerabilities: 1 },
  { id: 7, name: "nginx-proxy", tag: "latest", size: "23 MB", digest: "sha256:stu901...", layers: 5, lastPushed: "1 week ago", vulnerabilities: 0 },
];

function Registry() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Container Registry</h2>
          <p className="text-sm text-muted-foreground">
            Browse and manage container images
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="h-4 w-4" />
            Pull Image
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Image
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Container className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">7</p>
            <p className="text-xs text-muted-foreground">Total Images</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <HardDrive className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">2.1 GB</p>
            <p className="text-xs text-muted-foreground">Total Size</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Container className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">21</p>
            <p className="text-xs text-muted-foreground">Total Tags</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Tag className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Vulnerabilities</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search images..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Repositories</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend API</option>
          <option value="worker">Worker</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Tags</option>
          <option value="latest">Latest</option>
          <option value="v2">Version 2.x</option>
          <option value="v3">Version 3.x</option>
        </select>
      </div>

      {/* Images List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Layers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Digest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vulnerabilities</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Pushed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {images.map((image) => (
                <tr key={image.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Container className="h-4 w-4 text-primary" />
                      <span className="font-medium">{image.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono">
                      {image.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{image.size}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{image.layers}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{image.digest}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${
                      image.vulnerabilities === 0 ? "text-green-500" :
                      image.vulnerabilities <= 2 ? "text-amber-500" :
                      "text-red-500"
                    }`}>
                      {image.vulnerabilities}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{image.lastPushed}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-muted" title="View">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted" title="Copy Digest">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted" title="Delete">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
