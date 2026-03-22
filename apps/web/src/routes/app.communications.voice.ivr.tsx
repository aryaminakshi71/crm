import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from "@crm/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  GripVertical,
  Phone,
  Mail,
  Clock,
  Hash,
  User,
  ArrowRight,
  ArrowDown,
  Copy,
  Download,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/communications/voice/ivr")({
  component: IVRBuilderPage,
});

interface IVRNode {
  id: string;
  type: "greeting" | "menu" | "action" | "transfer" | "voicemail";
  label: string;
  config: Record<string, any>;
  children?: string[];
}

interface IVRFlow {
  id: string;
  name: string;
  status: string;
  nodes: IVRNode[];
  createdAt: string;
}

const MOCK_NODES: IVRNode[] = [
  { id: "node-1", type: "greeting", label: "Welcome Message", config: { audio: "welcome.wav", text: "Thank you for calling. Press 1 for sales, 2 for support." } },
  { id: "node-2", type: "menu", label: "Main Menu", config: { prompt: "main_menu" }, children: ["node-3", "node-4"] },
  { id: "node-3", type: "transfer", label: "Sales Transfer", config: { destination: "+1-555-123-4567" } },
  { id: "node-4", type: "action", label: "Support Options", config: { action: "queue" } },
  { id: "node-5", type: "voicemail", label: "Voicemail", config: { mailbox: "support@company.com" } },
];

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

function IVRBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [ivrName, setIvrName] = useState("Main IVR");
  const [isPlaying, setIsPlaying] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["communications", "ivr"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/communications/ivr`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to load IVR flows");
      return res.json() as Promise<{ data: IVRFlow[] }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; nodes: IVRNode[] }) => {
      const res = await fetch(`${API_BASE}/communications/ivr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ name: input.name, nodes: input.nodes, status: "draft" }),
      });
      if (!res.ok) throw new Error("Failed to create IVR flow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "ivr"] });
      toast.success("IVR flow saved");
    },
    onError: () => toast.error("Failed to save IVR flow"),
  });

  // Use first IVR flow's nodes if available, otherwise fall back to mock
  const firstFlow = data?.data?.[0];
  const nodes: IVRNode[] = firstFlow?.nodes?.length ? firstFlow.nodes : MOCK_NODES;
  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  const handleSave = () => {
    createMutation.mutate({ name: ivrName, nodes });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/voice" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">IVR Builder</h2>
            <p className="text-muted-foreground text-sm">Create interactive voice response flows</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button variant="outline" leftIcon={<Copy className="h-4 w-4" />}>
            Duplicate
          </Button>
          <Button variant="primary" leftIcon={<Play className="h-4 w-4" />} onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "Stop" : "Test"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Input
                    value={ivrName}
                    onChange={(e) => setIvrName(e.target.value)}
                    className="font-semibold w-64"
                  />
                  <Badge variant="outline">{firstFlow?.status ?? "Draft"}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleSave} disabled={createMutation.isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-8 min-h-[400px] relative">
                {/* Start Node */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Phone className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium mt-2">Start</p>
                </div>

                <div className="flex justify-center my-4">
                  <ArrowDown className="h-8 w-8 text-muted-foreground" />
                </div>

                {/* Node 1 */}
                {nodes.slice(0, 1).map((node) => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedNode === node.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{node.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center my-4">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Node 2 */}
                {nodes.slice(1, 2).map((node) => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedNode === node.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                        <Hash className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{node.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Branch Lines */}
                <div className="flex justify-center gap-24 mt-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>Press 1</span>
                    </div>
                    <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50">
                      <User className="h-5 w-5 text-green-600" />
                      <p className="text-xs font-medium mt-1">Sales</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>Press 2</span>
                    </div>
                    <div className="p-3 rounded-lg border-2 border-amber-500 bg-amber-50">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <p className="text-xs font-medium mt-1">Support</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Node Properties */}
        <div>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Node Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNodeData ? (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <Badge>{selectedNodeData.type}</Badge>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Label</label>
                    <Input value={selectedNodeData.label} readOnly />
                  </div>

                  {selectedNodeData.type === "greeting" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Audio File</label>
                        <Input value={selectedNodeData.config.audio ?? ""} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Text to Speech</label>
                        <textarea
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          rows={3}
                          readOnly
                          value={selectedNodeData.config.text ?? ""}
                        />
                      </div>
                    </>
                  )}

                  {selectedNodeData.type === "transfer" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Transfer To</label>
                      <Input value={selectedNodeData.config.destination ?? ""} readOnly />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Copy className="h-4 w-4 mr-1" /> Duplicate
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Select a node to edit its properties
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 mt-6">
            <CardHeader>
              <CardTitle className="text-base">Add Node</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Phone, label: "Greeting", color: "text-blue-600" },
                  { icon: Hash, label: "Menu", color: "text-purple-600" },
                  { icon: User, label: "Transfer", color: "text-green-600" },
                  { icon: Mail, label: "Voicemail", color: "text-amber-600" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="p-3 border rounded-lg text-center hover:bg-muted/50 transition-colors"
                  >
                    <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
