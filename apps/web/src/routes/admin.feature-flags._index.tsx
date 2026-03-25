import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Flag,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/feature-flags/_index")({
  component: FeatureFlagsPage,
});

const ADMIN_HEADER = {
  "Content-Type": "application/json",
};

type Category = "experimental" | "beta" | "ga" | "deprecated" | "all";

const CATEGORY_COLORS: Record<string, string> = {
  experimental: "bg-orange-100 text-orange-800",
  beta: "bg-blue-100 text-blue-800",
  ga: "bg-green-100 text-green-800",
  deprecated: "bg-gray-100 text-gray-500 line-through",
};

const TYPE_COLORS: Record<string, string> = {
  boolean: "bg-purple-100 text-purple-800",
  percentage: "bg-amber-100 text-amber-800",
  variant: "bg-teal-100 text-teal-800",
};

function FeatureFlagsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [overridesFlag, setOverridesFlag] = useState<any | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => {
      const res = await fetch("/api/admin/feature-flags", { headers: ADMIN_HEADER });
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      return res.json();
    },
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: "PATCH",
        headers: ADMIN_HEADER,
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle flag");
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast.success(`Flag ${vars.enabled ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["admin-feature-flags"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update flag"),
  });

  const updateRollout = useMutation({
    mutationFn: async ({ id, percentage }: { id: string; percentage: number }) => {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: "PATCH",
        headers: ADMIN_HEADER,
        body: JSON.stringify({ rolloutPercentage: percentage }),
      });
      if (!res.ok) throw new Error("Failed to update rollout");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feature-flags"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update rollout"),
  });

  const flags: any[] = (data as any)?.data ?? (data as any)?.flags ?? (Array.isArray(data) ? data : []);

  const filtered = activeCategory === "all"
    ? flags
    : flags.filter((f: any) => (f.category ?? "experimental") === activeCategory);

  const CATEGORIES: { value: Category; label: string }[] = [
    { value: "all", label: "All" },
    { value: "experimental", label: "Experimental" },
    { value: "beta", label: "Beta" },
    { value: "ga", label: "GA" },
    { value: "deprecated", label: "Deprecated" },
  ];

  if (isLoading) return <Loading text="Loading feature flags..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Flag className="h-6 w-6" /> Feature Flags
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage feature rollouts and per-org overrides across the platform.
          </p>
        </div>
        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
          Super Admin
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 max-w-2xl">
        {(["experimental", "beta", "ga", "deprecated"] as const).map((cat) => {
          const count = flags.filter((f: any) => (f.category ?? "experimental") === cat).length;
          return (
            <Card key={cat} className="border-border/60">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest capitalize">
                  {cat}
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 w-fit flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Flags list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Flag className="h-12 w-12" />}
              title="No feature flags found"
              description="No flags match the selected category."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((flag: any) => {
            const isEnabled = flag.enabled ?? false;
            const rollout = flag.rolloutPercentage ?? 100;
            const category = flag.category ?? "experimental";
            const type = flag.type ?? "boolean";

            return (
              <Card key={flag.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono font-semibold text-foreground text-sm">
                          {flag.name ?? flag.key}
                        </p>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[category] ?? "bg-muted text-muted-foreground"}`}>
                          {category}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[type] ?? "bg-muted text-muted-foreground"}`}>
                          {type}
                        </span>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                        <span>
                          Enabled for{" "}
                          <span className="font-medium text-foreground">
                            {flag.orgCount ?? flag.enabledForOrgs ?? 0}
                          </span>{" "}
                          orgs
                        </span>
                        {flag.lastModified && (
                          <span>
                            Last modified:{" "}
                            <span className="font-medium text-foreground">
                              {new Date(flag.lastModified).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                        {flag.currentValue !== undefined && type !== "boolean" && (
                          <span>
                            Value:{" "}
                            <span className="font-mono font-medium text-foreground">
                              {String(flag.currentValue)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Rollout slider */}
                      {type === "percentage" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {rollout}%
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={rollout}
                            onChange={(e) =>
                              updateRollout.mutate({
                                id: flag.id,
                                percentage: Number(e.target.value),
                              })
                            }
                            className="w-28 accent-primary"
                          />
                        </div>
                      )}

                      {/* Org overrides button */}
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Building2 className="h-3.5 w-3.5" />}
                        onClick={() => setOverridesFlag(flag)}
                      >
                        Org Overrides
                      </Button>

                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleFlag.mutate({ id: flag.id, enabled: !isEnabled })
                        }
                        className={`transition-colors ${
                          isEnabled ? "text-primary" : "text-muted-foreground"
                        }`}
                        title={isEnabled ? "Disable globally" : "Enable globally"}
                      >
                        {isEnabled ? (
                          <ToggleRight className="h-8 w-8" />
                        ) : (
                          <ToggleLeft className="h-8 w-8" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Org Overrides Modal */}
      {overridesFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <div>
                <h2 className="font-semibold text-foreground">Org Overrides</h2>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {overridesFlag.name ?? overridesFlag.key}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverridesFlag(null)}
                className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {(overridesFlag.orgOverrides ?? overridesFlag.overrides ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No per-org overrides configured for this flag.
                </p>
              ) : (
                (overridesFlag.orgOverrides ?? overridesFlag.overrides ?? []).map(
                  (override: any, idx: number) => (
                    <div
                      key={override.orgId ?? idx}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {override.orgName ?? override.orgId}
                        </p>
                        {override.orgSlug && (
                          <p className="text-xs text-muted-foreground">{override.orgSlug}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {override.value !== undefined && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {String(override.value)}
                          </span>
                        )}
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            override.enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {override.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end">
              <Button variant="outline" onClick={() => setOverridesFlag(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
