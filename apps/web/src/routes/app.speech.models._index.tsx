/**
 * Speech Models Index
 *
 * Browse, compare, and activate speech recognition models.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Brain,
  CheckCircle,
  Search,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { speechApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/app/speech/models/_index")({
  validateSearch: searchSchema,
  component: ModelsIndexPage,
});

interface SpeechModel {
  id: string;
  name?: string;
  modelName?: string;
  language?: string;
  locale?: string;
  accuracy?: number;
  accuracyRate?: number;
  size?: string;
  sizeBytes?: number;
  latency?: number;
  latencyMs?: number;
  type?: string;
  category?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

const _MOCK_MODELS: SpeechModel[] = [
  { id: "M1", name: "Nucleo General v2", language: "English", accuracy: 97.2, size: "2.1 GB", latency: 180, type: "general", isDefault: true },
  { id: "M2", name: "Nucleo Medical", language: "English", accuracy: 98.5, size: "3.4 GB", latency: 220, type: "medical", isDefault: false },
  { id: "M3", name: "Nucleo Legal", language: "English", accuracy: 97.8, size: "2.8 GB", latency: 200, type: "legal", isDefault: false },
  { id: "M4", name: "Nucleo Compact", language: "English", accuracy: 94.1, size: "512 MB", latency: 90, type: "general", isDefault: false },
  { id: "M5", name: "Spanish General", language: "Spanish", accuracy: 95.3, size: "1.8 GB", latency: 190, type: "general", isDefault: false },
  { id: "M6", name: "Custom Model (Org)", language: "English", accuracy: 99.1, size: "4.2 GB", latency: 250, type: "custom", isDefault: false },
];

function getName(m: SpeechModel) { return m.name ?? m.modelName ?? "Unnamed Model"; }
function getLanguage(m: SpeechModel) { return m.language ?? m.locale ?? "English"; }
function getAccuracy(m: SpeechModel) { return m.accuracy ?? m.accuracyRate ?? 0; }
function getLatency(m: SpeechModel) { return m.latency ?? m.latencyMs ?? 0; }
function getType(m: SpeechModel) { return m.type ?? m.category ?? "general"; }

const TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  medical: "bg-red-100 text-red-700",
  legal: "bg-purple-100 text-purple-700",
  custom: "bg-orange-100 text-orange-700",
};

function ModelTypeBadge({ type }: { type: string }) {
  const colorClass = TYPE_COLORS[type] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}>
      {type}
    </span>
  );
}

function ModelsIndexPage() {
  const queryClient = useQueryClient();
  const { q: searchQuery = "", type: typeFilter = "all" } = useSearch({ from: "/app/speech/models/_index" });
  const navigate = useNavigate({ from: "/app/speech/models" });
  const setSearchQuery = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setTypeFilter = (v: string) => navigate({ search: (p) => ({ ...p, type: v }) });
  const [defaultModel, setDefaultModel] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["speech-models-index"],
    queryFn: () => speechApi.models.list(),
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
    const def = list.find((m: any) => m.isDefault);
    if (def) setDefaultModel(def.id);
  }, [data]);

  const setDefaultMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const res = await fetch(`/api/v1/speech/models/${modelId}/default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to set default");
      return res.json() as Promise<any>;
    },
    onSuccess: (_, modelId) => {
      setDefaultModel(modelId);
      queryClient.invalidateQueries({ queryKey: ["speech-models-index"] });
    },
  });

  const allModels: SpeechModel[] =
    (data as any)?.data ?? [];

  const models = allModels.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || getName(m).toLowerCase().includes(q) || getLanguage(m).toLowerCase().includes(q);
    const matchType = typeFilter === "all" || getType(m) === typeFilter;
    return matchSearch && matchType;
  });

  const currentDefault = defaultModel ?? allModels.find((m) => m.isDefault)?.id ?? allModels[0]?.id;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load models. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Speech Models</h2>
        <p className="text-sm text-muted-foreground">
          Choose the recognition model that best fits your use case
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="general">General</option>
          <option value="medical">Medical</option>
          <option value="legal">Legal</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Models Grid */}
      {models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Brain className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No models available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => {
            const isDefault = model.id === currentDefault;
            return (
              <Card
                key={model.id}
                className={`border-border/60 transition-all ${
                  isDefault ? "ring-2 ring-primary border-primary/40" : ""
                }`}
              >
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isDefault ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{getName(model)}</p>
                        <p className="text-xs text-muted-foreground">{getLanguage(model)}</p>
                      </div>
                    </div>
                    {isDefault && (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ModelTypeBadge type={getType(model)} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Accuracy</p>
                      <p className="text-sm font-bold text-foreground">{getAccuracy(model)}%</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Latency</p>
                      <p className="text-sm font-bold text-foreground">{getLatency(model)}ms</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Size</p>
                      <p className="text-sm font-bold text-foreground truncate">{model.size ?? "—"}</p>
                    </div>
                  </div>

                  <Button
                    variant={isDefault ? "outline" : "primary"}
                    size="sm"
                    className="w-full"
                    disabled={isDefault || setDefaultMutation.isPending}
                    leftIcon={
                      isDefault ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )
                    }
                    onClick={() => !isDefault && setDefaultMutation.mutate(model.id)}
                  >
                    {isDefault ? "Current Default" : "Set as Default"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
