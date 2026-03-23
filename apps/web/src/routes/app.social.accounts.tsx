import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/app/social/accounts")({
  component: AccountsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

interface Account {
  id: string;
  platform: string;
  name: string;
  username: string;
  followers: number;
  status: "connected" | "disconnected" | "error";
  lastSync: string;
}

const MOCK_ACCOUNTS: Account[] = [
  { id: "a1", platform: "Instagram", name: "Nucleo One", username: "@nucleoone", followers: 18500, status: "connected", lastSync: "5 min ago" },
  { id: "a2", platform: "Twitter", name: "Nucleo One Tech", username: "@nucleoone", followers: 12300, status: "connected", lastSync: "2 min ago" },
  { id: "a3", platform: "LinkedIn", name: "Nucleo One Inc", username: "company/nucleoone", followers: 8900, status: "connected", lastSync: "10 min ago" },
  { id: "a4", platform: "Facebook", name: "Nucleo One", username: "nucleoone", followers: 5500, status: "error", lastSync: "2 hours ago" },
];

function AccountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["social", "accounts"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/accounts`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`${API_BASE}/social/accounts/${accountId}`, {
        method: "DELETE",
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to disconnect account");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "accounts"] });
    },
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const accounts: Account[] = data?.data ?? MOCK_ACCOUNTS;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Instagram": return <Instagram className="h-5 w-5 text-pink-500" />;
      case "Twitter": return <Twitter className="h-5 w-5 text-sky-500" />;
      case "LinkedIn": return <Linkedin className="h-5 w-5 text-blue-600" />;
      case "Facebook": return <Facebook className="h-5 w-5 text-blue-500" />;
      case "YouTube": return <Youtube className="h-5 w-5 text-red-500" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: Account["status"]) => {
    switch (status) {
      case "connected": return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "disconnected": return <Badge variant="outline">Disconnected</Badge>;
      case "error": return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Connected Accounts</h2>
            <p className="text-muted-foreground text-sm">Manage your social media accounts</p>
          </div>
        </div>
        <Link to="/app/social/accounts/connect">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Connect Account
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{account.name ?? account.displayName ?? account.platform}</h3>
                    <p className="text-sm text-muted-foreground">{account.username}</p>
                  </div>
                </div>
                {getStatusBadge(account.status ?? "connected")}
              </div>

              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">{(account.followers ?? account.profileData?.followers ?? 0).toLocaleString()} followers</span>
                <span className="text-muted-foreground">Synced {account.lastSync ?? "recently"}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<RefreshCw className="h-4 w-4" />}>
                  Sync
                </Button>
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<Settings className="h-4 w-4" />}>
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => disconnectMutation.mutate(account.id)}
                  disabled={disconnectMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
