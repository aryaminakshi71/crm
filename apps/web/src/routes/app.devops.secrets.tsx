import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { Eye, EyeOff, Key, Plus, Trash2, RefreshCw, Shield, AlertCircle, Copy } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { devopsApi } from "@/lib/api";

export const Route = createFileRoute("/app/devops/secrets")({
  component: Secrets,
});

const SECRET_TYPES = ["env", "credential", "certificate", "token"] as const;
type SecretType = (typeof SECRET_TYPES)[number];

const SCOPES = ["global", "production", "staging", "development"] as const;
type SecretScope = (typeof SCOPES)[number];


const TYPE_COLORS: Record<SecretType, string> = {
  env: "bg-blue-500/10 text-blue-600",
  credential: "bg-purple-500/10 text-purple-600",
  certificate: "bg-green-500/10 text-green-600",
  token: "bg-amber-500/10 text-amber-600",
};

const SCOPE_COLORS: Record<SecretScope, string> = {
  global: "bg-primary/10 text-primary",
  production: "bg-red-500/10 text-red-600",
  staging: "bg-amber-500/10 text-amber-600",
  development: "bg-green-500/10 text-green-600",
};

function AddSecretModal({
  open,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; value: string; type: SecretType; scope: SecretScope }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<SecretType>("env");
  const [scope, setScope] = useState<SecretScope>("production");
  const [showValue, setShowValue] = useState(false);

  const reset = () => {
    setName(""); setValue(""); setType("env"); setScope("production"); setShowValue(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Add Secret</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Values are encrypted at rest using AES-256-GCM.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Secret Name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="DATABASE_URL"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase().replace(/\s/g, "_"))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Secret Value
            </label>
            <div className="relative mt-1">
              <input
                type={showValue ? "text" : "password"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Enter secret value..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowValue((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Type
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={type}
                onChange={(e) => setType(e.target.value as SecretType)}
              >
                {SECRET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Scope
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={scope}
                onChange={(e) => setScope(e.target.value as SecretScope)}
              >
                {SCOPES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onSave({ name, value, type, scope })}
            disabled={!name || !value || isPending}
            className="flex-1"
          >
            {isPending ? "Saving..." : "Save Secret"}
          </Button>
          <Button
            variant="outline"
            onClick={() => { reset(); onClose(); }}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function Secrets() {
  const queryClient = useQueryClient();
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<SecretType | "all">("all");
  const [filterScope, setFilterScope] = useState<SecretScope | "all">("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["devops", "secrets"],
    queryFn: () => devopsApi.secrets.list(),
    placeholderData: (prev) => prev,
    retry: 1,
  });

  const rawSecrets: any[] =
    (data as any)?.data ?? (data as any)?.secrets ?? [];
  const secrets = rawSecrets;

  const createSecret = useMutation({
    mutationFn: (payload: { name: string; value: string; type: string; scope: string }) =>
      devopsApi.secrets.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "secrets"] });
      toast.success("Secret created successfully");
      setShowForm(false);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create secret"),
  });

  const deleteSecret = useMutation({
    mutationFn: (id: string) =>
      fetch(
        `${import.meta.env.VITE_API_URL ?? "/api"}/devops/secrets/${id}`,
        {
          method: "DELETE",
          headers: (() => {
            const orgId = localStorage.getItem("activeOrganizationId");
            return orgId ? { "x-organization-id": orgId } : {};
          })(),
        }
      ).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "secrets"] });
      toast.success("Secret deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete secret"),
  });

  const rotateSecret = useMutation({
    mutationFn: (id: string) =>
      fetch(
        `${import.meta.env.VITE_API_URL ?? "/api"}/devops/secrets/${id}/rotate`,
        {
          method: "POST",
          headers: (() => {
            const orgId = localStorage.getItem("activeOrganizationId");
            return orgId
              ? { "x-organization-id": orgId, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" };
          })(),
        }
      ).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "secrets"] });
      toast.success("Rotation initiated");
    },
    onError: () => toast.error("Rotation failed"),
  });

  const toggleShow = (id: string) =>
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name).then(() => toast.success("Copied to clipboard"));
  };

  const filtered = secrets.filter((s: any) => {
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterScope !== "all" && s.scope !== filterScope) return false;
    return true;
  });

  const rotationDueCount = secrets.filter((s: any) => s.rotationDue).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Secrets Vault</h2>
          <p className="text-sm text-muted-foreground">
            Securely manage API keys, passwords, and sensitive credentials
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Secret
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{secrets.length}</p>
                <p className="text-xs text-muted-foreground">Total Secrets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Shield className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">AES-256</p>
                <p className="text-xs text-muted-foreground">Encryption</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${rotationDueCount > 0 ? "bg-amber-500/10" : "bg-green-500/10"}`}>
                <RefreshCw className={`h-4 w-4 ${rotationDueCount > 0 ? "text-amber-500" : "text-green-500"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{rotationDueCount}</p>
                <p className="text-xs text-muted-foreground">Rotation Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Key className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {secrets.filter((s: any) => s.scope === "production").length}
                </p>
                <p className="text-xs text-muted-foreground">Production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {rotationDueCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {rotationDueCount} secret{rotationDueCount > 1 ? "s" : ""} are overdue for rotation.
            Review and rotate them to maintain security compliance.
          </span>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not reach the API — showing sample data.
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Filter by type:</span>
        {(["all", ...SECRET_TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t as any)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterType === t
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="text-xs font-medium text-muted-foreground ml-2">Scope:</span>
        {(["all", ...SCOPES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterScope(s as any)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterScope === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Secrets Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Key className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No secrets match your filters.</p>
              <Button variant="outline" size="sm" onClick={() => { setFilterType("all"); setFilterScope("all"); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/30">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Scope</div>
                <div className="col-span-2">Last Rotated</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filtered.map((secret: any) => (
                <div
                  key={secret.id}
                  className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/20 transition-colors ${
                    secret.rotationDue ? "border-l-2 border-l-amber-500" : ""
                  }`}
                >
                  {/* Name + Value */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                      <Key className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-foreground truncate">
                        {secret.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 select-all">
                        {showValues[secret.id]
                          ? (secret.value ?? "plaintext-value-here")
                          : "•••••••••••••••••••"}
                      </p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[secret.type as SecretType] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {secret.type}
                    </span>
                  </div>

                  {/* Scope */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        SCOPE_COLORS[secret.scope as SecretScope] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {secret.scope}
                    </span>
                  </div>

                  {/* Last Rotated */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      {secret.rotationDue && (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                      <span className={`text-xs ${secret.rotationDue ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                        {secret.lastRotated ?? "Never"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-1 justify-end">
                    <button
                      onClick={() => copyName(secret.name)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Copy name"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => toggleShow(secret.id)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={showValues[secret.id] ? "Hide value" : "Reveal value"}
                    >
                      {showValues[secret.id] ? (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => rotateSecret.mutate(secret.id)}
                      disabled={rotateSecret.isPending}
                      className="p-1.5 rounded hover:bg-blue-50 transition-colors"
                      title="Rotate secret"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                    </button>
                    <button
                      onClick={() => deleteSecret.mutate(secret.id)}
                      disabled={deleteSecret.isPending}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Delete secret"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddSecretModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={(d) => createSecret.mutate(d)}
        isPending={createSecret.isPending}
      />
    </div>
  );
}
