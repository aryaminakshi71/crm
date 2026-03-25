import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  Settings,
  Zap,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/speech/models")({
  component: ModelsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

interface Model {
  id: string;
  name: string;
  language: string;
  accuracy: number;
  speed: "fast" | "balanced" | "accurate";
  enabled: boolean;
}

function ModelsPage() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<string>("m2");

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["speech", "models"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/speech/models`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const models: Model[] = (data as any)?.data ?? [];

  const getSpeedColor = (speed: Model["speed"]) => {
    switch (speed) {
      case "fast": return "bg-green-100 text-green-800";
      case "balanced": return "bg-amber-100 text-amber-800";
      case "accurate": return "bg-blue-100 text-blue-800";
    }
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Language Models</h2>
            <p className="text-muted-foreground text-sm">Select and manage speech recognition models</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <Card
            key={model.id}
            className={`border-border/60 cursor-pointer transition-colors ${
              selectedModel === model.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
            }`}
            onClick={() => setSelectedModel(model.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${
                    selectedModel === model.id ? "bg-primary" : "bg-muted"
                  }`}>
                    <Brain className={`h-5 w-5 ${selectedModel === model.id ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">{model.language}</p>
                  </div>
                </div>
                {selectedModel === model.id && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${model.accuracy}%` }} />
                  </div>
                  <p className="text-xs text-right mt-1">{model.accuracy}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={getSpeedColor(model.speed)}>{model.speed}</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Auto-select Model</p>
                <p className="text-sm text-muted-foreground">Automatically choose the best model based on audio quality</p>
              </div>
            </div>
            <button className="w-12 h-6 rounded-full bg-primary">
              <div className="w-5 h-5 rounded-full bg-white shadow translate-x-6" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
