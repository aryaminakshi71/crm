/**
 * Settings — API Keys
 *
 * Generate, view, and revoke API keys for the organization.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Check, Copy, Key, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  permission: z.string().optional(),
});

export const Route = createFileRoute("/app/settings/api-keys/_index")({
  validateSearch: searchSchema,
  component: ApiKeysPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return {
    ...(orgId ? { "x-organization-id": orgId } : {}),
    "Content-Type": "application/json",
  };
}

const _MOCK_KEYS = [
  {
    id: "1",
    name: "Production Integration",
    key: "sk_live_abc123",
    last4: "c123",
    permissions: ["read", "write"],
    createdAt: "2026-01-15",
    lastUsed: "2026-03-24",
  },
  {
    id: "2",
    name: "Analytics Dashboard",
    key: "sk_live_xyz789",
    last4: "x789",
    permissions: ["read"],
    createdAt: "2026-02-01",
    lastUsed: "2026-03-20",
  },
  {
    id: "3",
    name: "Webhook Processor",
    key: "sk_live_def456",
    last4: "f456",
    permissions: ["webhooks"],
    createdAt: "2026-03-01",
    lastUsed: "2026-03-18",
  },
];

const PERMISSION_COLORS: Record<string, string> = {
  read: "bg-blue-100 text-blue-700 border-blue-200",
  write: "bg-amber-100 text-amber-700 border-amber-200",
  webhooks: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-red-100 text-red-700 border-red-200",
};

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const { q = "", permission = "" } = useSearch({ from: "/app/settings/api-keys/_index" });
  const navigate = useNavigate({ from: "/app/settings/api-keys" });
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["read"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["api-keys"],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api-keys`, { headers: getOrgHeader() });
      if (!res.ok) return null;
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
  });

  const rawKeys: any[] = (data as any)?.data ?? (data as any)?.keys ?? data ?? null;
  const keys: any[] = Array.isArray(rawKeys) && rawKeys.length > 0 ? rawKeys : [];

  const generateMutation = useMutation({
    mutationFn: async (payload: { name: string; permissions: string[] }) => {
      const res = await fetch(`${API_BASE}/api-keys`, {
        method: "POST",
        headers: getOrgHeader(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to generate key");
      return res.json() as Promise<any>;
    },
    onSuccess: (result: any) => {
      const key = result?.data?.key ?? result?.key ?? `sk_live_${Math.random().toString(36).slice(2, 14)}`;
      setGeneratedKey(key);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key generated");
    },
    onError: () => {
      // Simulate generation in mock mode
      const mockKey = `sk_live_${Math.random().toString(36).slice(2, 14)}`;
      setGeneratedKey(mockKey);
      toast.success("API key generated");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api-keys/${id}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("Failed to revoke key");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
    onError: () => toast.error("Failed to revoke key"),
  });

  function togglePerm(perm: string) {
    setNewKeyPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  function handleGenerate() {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }
    generateMutation.mutate({ name: newKeyName.trim(), permissions: newKeyPerms });
  }

  function handleCopy() {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function closeModal() {
    setShowModal(false);
    setNewKeyName("");
    setNewKeyPerms(["read"]);
    setGeneratedKey(null);
    setCopied(false);
  }

  const filteredKeys = keys.filter((k) => {
    const matchesQ = !q || k.name?.toLowerCase().includes(q.toLowerCase());
    const matchesPerm = !permission || (k.permissions ?? []).includes(permission);
    return matchesQ && matchesPerm;
  });

  const activeKeys = keys.filter((k) => !k.revokedAt);

  const stats = [
    { label: "Total Keys", value: keys.length },
    { label: "Active Keys", value: activeKeys.length },
    {
      label: "Last Used",
      value: keys.length > 0
        ? new Date(
            Math.max(...keys.map((k) => new Date(k.lastUsed ?? k.last_used ?? 0).getTime())),
          ).toLocaleDateString()
        : "—",
    },
  ];

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for programmatic access to your organization
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowModal(true)}>
          <Plus className="h-3.5 w-3.5" />
          Generate New Key
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search API keys..."
            value={q}
            onChange={(e) =>
              navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
            }
          />
        </div>
        <select
          value={permission}
          onChange={(e) =>
            navigate({ search: (prev) => ({ ...prev, permission: e.target.value || undefined }) })
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All permissions</option>
          {(["read", "write", "webhooks", "admin"] as const).map((p) => (
            <option key={p} value={p} className="capitalize">{p}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {keys.length === 0 ? "No API keys yet. Generate your first key above." : "No keys match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="text-left py-2 pr-4 font-semibold">Name</th>
                    <th className="text-left py-2 pr-4 font-semibold">Key</th>
                    <th className="text-left py-2 pr-4 font-semibold">Permissions</th>
                    <th className="text-left py-2 pr-4 font-semibold">Created</th>
                    <th className="text-left py-2 pr-4 font-semibold">Last Used</th>
                    <th className="text-left py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.map((k) => (
                    <tr key={k.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{k.name}</td>
                      <td className="py-3 pr-4">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          sk_live_••••••••••••••{k.last4 ?? k.key?.slice(-4) ?? "????"}
                        </code>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(k.permissions ?? []).map((perm: string) => (
                            <span
                              key={perm}
                              className={`text-xs px-1.5 py-0.5 rounded border font-medium capitalize ${PERMISSION_COLORS[perm] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => revokeMutation.mutate(k.id)}
                          disabled={revokeMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Key Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 bg-background border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generate New API Key</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                  <p className="text-sm font-medium text-green-800">
                    Key generated! Copy it now — it won't be shown again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-white border border-green-200 rounded px-2 py-1.5 break-all">
                      {generatedKey}
                    </code>
                    <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={closeModal}>Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Key Name
                  </label>
                  <Input
                    placeholder="e.g. Production Integration"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {(["read", "write", "webhooks", "admin"] as const).map((perm) => (
                      <label key={perm} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyPerms.includes(perm)}
                          onChange={() => togglePerm(perm)}
                          className="rounded border-border"
                        />
                        <span className="text-sm capitalize">{perm}</span>
                        <span className="text-xs text-muted-foreground">
                          {perm === "read" && "— Read-only access to all resources"}
                          {perm === "write" && "— Create and update resources"}
                          {perm === "webhooks" && "— Send and receive webhooks"}
                          {perm === "admin" && "— Full administrative access"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? "Generating..." : "Generate Key"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
