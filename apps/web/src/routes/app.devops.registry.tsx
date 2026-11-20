import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, Card, CardContent, EmptyState, Input } from "@crm/ui";
import { Container, Download, Plus, Tag, Trash2, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const registryApi = {
  list: () =>
    fetch(`${API_BASE}/devops/registry`, { headers: getOrgHeader() }).then((r) =>
      r.json()
    ),
  push: (data: Record<string, unknown>) =>
    fetch(`${API_BASE}/devops/registry`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  pull: (id: string) =>
    fetch(`${API_BASE}/devops/registry/${id}/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
    }).then((r) => r.json()),
  delete: (id: string) =>
    fetch(`${API_BASE}/devops/registry/${id}`, {
      method: "DELETE",
      headers: getOrgHeader(),
    }).then((r) => r.json()),
};

export const Route = createFileRoute("/app/devops/registry")({
  component: Registry,
});

function Registry() {
  const queryClient = useQueryClient();
  const [showPushForm, setShowPushForm] = useState(false);
  const [imageName, setImageName] = useState("");
  const [imageTag, setImageTag] = useState("latest");

  const { data, isLoading } = useQuery({
    queryKey: ["devops", "registry"],
    queryFn: () => registryApi.list(),
  });

  const images: Array<{ id: string; name: string; tag: string; size?: string; pushedAt?: string; digest?: string }> =
    (data as any)?.data ?? (data as any)?.images ?? (Array.isArray(data) ? data : []);

  const pushImage = useMutation({
    mutationFn: (payload: { name: string; tag: string }) =>
      registryApi.push(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "registry"] });
      toast.success("Image pushed to registry");
      setImageName("");
      setImageTag("latest");
      setShowPushForm(false);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to push image"),
  });

  const pullImage = useMutation({
    mutationFn: (id: string) => registryApi.pull(id),
    onSuccess: () => toast.success("Image pull initiated"),
    onError: (e: Error) => toast.error(e.message || "Failed to pull image"),
  });

  const deleteImage = useMutation({
    mutationFn: (id: string) => registryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "registry"] });
      toast.success("Image deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete image"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Container Registry</h2>
          <p className="text-sm text-muted-foreground">Browse and manage container images</p>
        </div>
        <Button onClick={() => setShowPushForm((v) => !v)}>
          <Upload className="h-4 w-4 mr-1" />
          Push Image
        </Button>
      </div>

      {showPushForm && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Push Image</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Image name (e.g. my-app)"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
              />
              <Input
                placeholder="Tag (default: latest)"
                value={imageTag}
                onChange={(e) => setImageTag(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => pushImage.mutate({ name: imageName, tag: imageTag })}
                disabled={!imageName || pushImage.isPending}
              >
                {pushImage.isPending ? "Pushing..." : "Push"}
              </Button>
              <Button variant="outline" onClick={() => setShowPushForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <EmptyState
          icon={<Container className="h-12 w-12 text-muted-foreground/50" />}
          title="Container Registry coming soon"
          description="Connect your container registry to browse images, tags, and vulnerability reports. Supports Docker Hub, AWS ECR, Google Artifact Registry, and more."
          action={
            <Button onClick={() => setShowPushForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Push First Image
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Container className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-medium text-foreground">
                        {image.name}
                      </p>
                      <Badge variant="outline" size="sm">
                        <Tag className="h-3 w-3 mr-1" />
                        {image.tag}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {image.size && <span>{image.size}</span>}
                      {image.pushedAt && <span>Pushed {image.pushedAt}</span>}
                      {image.digest && (
                        <span className="font-mono">{image.digest.slice(0, 12)}…</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => pullImage.mutate(image.id)}
                      disabled={pullImage.isPending}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-muted transition-colors text-muted-foreground"
                      title="Pull image"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Pull
                    </button>
                    <button
                      onClick={() => deleteImage.mutate(image.id)}
                      disabled={deleteImage.isPending}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Delete image"
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
