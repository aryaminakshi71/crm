/**
 * Social Accounts
 *
 * Connected social media accounts with followers, following, status,
 * and connect/disconnect actions.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle2,
  Link,
  Link2Off,
  Plus,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { socialApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  platform: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/social/accounts/_index")({
  validateSearch: searchSchema,
  component: SocialAccountsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialAccount {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  following: number;
  status: "connected" | "disconnected" | "error";
  avatarUrl?: string;
  lastSync?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_ACCOUNTS: SocialAccount[] = [
  { id: "1", name: "Nucleo One", handle: "@nucleoone", platform: "twitter", followers: 14800, following: 420, status: "connected", lastSync: "2026-03-24T09:00:00Z" },
  { id: "2", name: "nucleoone", handle: "@nucleoone", platform: "instagram", followers: 32400, following: 850, status: "connected", lastSync: "2026-03-24T09:00:00Z" },
  { id: "3", name: "Nucleo One", handle: "nucleoone", platform: "facebook", followers: 8900, following: 0, status: "connected", lastSync: "2026-03-24T08:00:00Z" },
  { id: "4", name: "Nucleo One", handle: "nucleo-one", platform: "linkedin", followers: 6200, following: 340, status: "connected", lastSync: "2026-03-23T22:00:00Z" },
  { id: "5", name: "NucleoOne TikTok", handle: "@nucleoone", platform: "tiktok", followers: 0, following: 0, status: "disconnected" },
];

// ─── Platform helpers ─────────────────────────────────────────────────────────

function platformStyles(p: string) {
  switch (p) {
    case "twitter": return { bg: "bg-sky-500/10", text: "text-sky-400", label: "X / Twitter" };
    case "instagram": return { bg: "bg-pink-500/10", text: "text-pink-400", label: "Instagram" };
    case "facebook": return { bg: "bg-blue-500/10", text: "text-blue-400", label: "Facebook" };
    case "linkedin": return { bg: "bg-blue-600/10", text: "text-blue-500", label: "LinkedIn" };
    case "tiktok": return { bg: "bg-neutral-500/10", text: "text-neutral-300", label: "TikTok" };
    default: return { bg: "bg-muted/50", text: "text-muted-foreground", label: p };
  }
}

function PlatformInitial({ platform }: { platform: string }) {
  const s = platformStyles(platform);
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm shrink-0 ${s.bg} ${s.text}`}>
      {platform[0].toUpperCase()}
    </div>
  );
}

// ─── Connect Modal ────────────────────────────────────────────────────────────

function ConnectModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", handle: "", platform: "twitter" });

  const mutation = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 500));
      return { id: String(Date.now()), ...form, followers: 0, following: 0, status: "connected" };
    },
    onSuccess: () => {
      toast.success("Account connected");
      onCreated();
      onClose();
      setForm({ name: "", handle: "", platform: "twitter" });
    },
    onError: () => toast.error("Failed to connect account"),
  });

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-lg">Connect Account</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.handle) { toast.error("Name and handle are required"); return; } mutation.mutate(); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Platform</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            >
              {["twitter", "instagram", "facebook", "linkedin", "tiktok"].map((p) => (
                <option key={p} value={p}>{platformStyles(p).label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Account Name <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Nucleo One"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Handle / Username <span className="text-destructive">*</span></label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="@nucleoone"
              value={form.handle}
              onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Connecting…" : "Connect Account"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SocialAccountsPage() {
  const qc = useQueryClient();
  const { q = "", platform, page = 1 } = useSearch({ from: "/app/social/accounts/_index" });
  const navigate = useNavigate({ from: "/app/social/accounts/_index" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPlatform = (v: string) => navigate({ search: (p) => ({ ...p, platform: v === "all" ? undefined : v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [showConnect, setShowConnect] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["social", "accounts"],
    queryFn: () => socialApi.accounts.list(),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 400));
      return id;
    },
    onSuccess: () => {
      toast.success("Account disconnected");
      qc.invalidateQueries({ queryKey: ["social", "accounts"] });
    },
    onError: () => toast.error("Failed to disconnect account"),
  });

  const accounts: SocialAccount[] = (data as any)?.data ?? [];

  const filtered = accounts.filter((a) => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.handle.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = !platform || a.platform === platform;
    return matchesSearch && matchesPlatform;
  });

  const connectedCount = accounts.filter((a) => a.status === "connected").length;
  const totalFollowers = accounts.filter((a) => a.status === "connected").reduce((s, a) => s + a.followers, 0);

  return (
    <div className="space-y-6">
      <ConnectModal open={showConnect} onClose={() => setShowConnect(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["social", "accounts"] })} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connected Accounts</p>
              <p className="text-2xl font-black">{connectedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Followers</p>
              <p className="text-2xl font-black">{totalFollowers.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <Link className="h-4 w-4" />
              Social Accounts
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="h-8 w-44 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search accounts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" onClick={() => setShowConnect(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Connect
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading accounts…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-sm">No accounts found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((a) => {
                const ps = platformStyles(a.platform);
                return (
                  <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <PlatformInitial platform={a.platform} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{a.name}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ps.bg} ${ps.text}`}>{ps.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{a.handle}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{a.followers.toLocaleString()}</span> followers
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{a.following.toLocaleString()}</span> following
                      </span>
                      {a.lastSync && (
                        <span>Synced {new Date(a.lastSync).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={a.status === "connected" ? "success" : a.status === "error" ? "danger" : "outline"}
                        className={a.status === "connected" ? "text-emerald-400" : a.status === "error" ? "text-red-400" : ""}
                      >
                        {a.status === "connected" ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Connected</span>
                        ) : a.status === "error" ? (
                          <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Error</span>
                        ) : "Disconnected"}
                      </Badge>
                      {a.status === "connected" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                          disabled={disconnectMutation.isPending}
                          onClick={() => disconnectMutation.mutate(a.id)}
                        >
                          <Link2Off className="h-3 w-3" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm" variant="primary" className="h-7 text-xs" onClick={() => setShowConnect(true)}>
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
