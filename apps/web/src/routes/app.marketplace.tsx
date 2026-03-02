import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { modulesApi } from "../lib/api";

export const Route = createFileRoute("/app/marketplace")({
  component: ModulesPage,
});

type ModuleStatus = {
  key: string;
  name: string;
  description: string;
  phase: "core" | "ops" | "growth" | "ai";
  enabled: boolean;
  limits: Record<string, unknown> | null;
  updatedAt: string | null;
};

function phaseBadgeClass(phase: ModuleStatus["phase"]) {
  if (phase === "core") return "bg-primary/10 text-primary";
  if (phase === "ops") return "bg-blue-500/10 text-blue-600";
  if (phase === "growth") return "bg-emerald-500/10 text-emerald-600";
  return "bg-violet-500/10 text-violet-600";
}

function ModulesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["nucleo-modules"],
    queryFn: () => modulesApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      modulesApi.setEnabled(key, enabled),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-modules"] });
      toast.success(
        `${variables.enabled ? "Enabled" : "Disabled"} ${variables.key}`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Module update failed.");
    },
  });

  const modules = (data?.modules || []) as ModuleStatus[];
  const enabledCount = modules.filter((m) => m.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Nucleo Modules</h1>
          <p className="text-muted-foreground">
            Toggle each domain as you migrate full workflows into Nucleo One.
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2">
          <p className="font-medium text-foreground text-sm">
            Enabled: {enabledCount}/{modules.length}
          </p>
          <p className="text-muted-foreground text-xs">Workspace: unified</p>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {(error as Error).message || "Failed to load module status."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-24 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : modules.map((moduleStatus) => {
              const busy =
                toggleMutation.isPending &&
                toggleMutation.variables?.key === moduleStatus.key;

              return (
                <Card key={moduleStatus.key}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-2">
                          {moduleStatus.phase === "ai" ? (
                            <Sparkles className="h-4 w-4 text-primary" />
                          ) : (
                            <Layers className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {moduleStatus.name}
                          </CardTitle>
                          <p className="text-muted-foreground text-xs">
                            key: {moduleStatus.key === "crm" ? "core" : moduleStatus.key}
                          </p>
                        </div>
                      </div>
                      <Badge className={phaseBadgeClass(moduleStatus.phase)}>
                        {moduleStatus.phase}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="min-h-[36px] text-muted-foreground text-sm">
                      {moduleStatus.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={moduleStatus.enabled ? "success" : "outline"}>
                        {moduleStatus.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant={moduleStatus.enabled ? "outline" : "primary"}
                        disabled={busy || moduleStatus.key === "crm"}
                        onClick={() =>
                          toggleMutation.mutate({
                            key: moduleStatus.key,
                            enabled: !moduleStatus.enabled,
                          })
                        }
                      >
                        {busy
                          ? "Saving..."
                          : moduleStatus.key === "crm"
                            ? "Core"
                            : moduleStatus.enabled
                              ? "Disable"
                              : "Enable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
