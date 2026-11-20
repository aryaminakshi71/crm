import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  DollarSign,
  Hash,
  Phone,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { communicationsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  provider: z.string().optional(),
});

export const Route = createFileRoute("/app/communications/numbers/_index")({
  validateSearch: searchSchema,
  component: NumbersPage,
});

function NumbersPage() {
  const queryClient = useQueryClient();
  const { q = "", type = "all", provider: providerFilter = "all" } = useSearch({ from: "/app/communications/numbers/_index" });
  const navigate = useNavigate({ from: "/app/communications/numbers" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setType = (v: string) => navigate({ search: (p) => ({ ...p, type: v }) });
  const setProviderFilter = (v: string) => navigate({ search: (p) => ({ ...p, provider: v }) });

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [provider, setProvider] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "phone-numbers"],
    queryFn: () => communicationsApi.phoneNumbers.list({ page: 1, limit: 50 }),
  });

  const buyMutation = useMutation({
    mutationFn: () =>
      communicationsApi.phoneNumbers.create({
        number: newNumber,
        friendlyName: friendlyName || undefined,
        provider: provider || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "phone-numbers"] });
      setShowBuyModal(false);
      setNewNumber("");
      setFriendlyName("");
      setProvider("");
    },
  });

  const allNumbers: any[] = (data as any)?.data ?? [];

  const numbers = allNumbers.filter((n) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesQ = [n.number, n.phoneNumber, n.friendlyName, n.provider].some(
        (v) => String(v ?? "").toLowerCase().includes(s),
      );
      if (!matchesQ) return false;
    }
    if (type !== "all" && (n.numberType ?? n.type) !== type) return false;
    if (providerFilter !== "all" && n.provider !== providerFilter) return false;
    return true;
  });

  const allProviders = [...new Set(allNumbers.map((n) => n.provider).filter(Boolean))];
  const allTypes = [...new Set(allNumbers.map((n) => n.numberType ?? n.type).filter(Boolean))];

  const monthlyCost = numbers.reduce(
    (sum, n) => sum + (n.monthlyPrice ?? n.price ?? 0),
    0,
  );

  const stats = [
    { label: "Numbers Owned", value: numbers.length, icon: Phone, color: "text-blue-400" },
    {
      label: "Monthly Cost",
      value: `$${monthlyCost.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-400",
    },
  ];

  const getCapabilityBadge = (cap: string) => {
    const colors: Record<string, string> = {
      voice: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      sms: "bg-green-500/10 text-green-400 border-green-500/20",
      mms: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return colors[cap.toLowerCase()] ?? "bg-muted text-muted-foreground";
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load phone numbers.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phone Numbers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your provisioned phone numbers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowBuyModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Buy Number
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search numbers..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {allTypes.length > 0 && (
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        {allProviders.length > 0 && (
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All providers</option>
            {allProviders.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {/* Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Numbers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded bg-muted" />
              ))}
            </div>
          ) : numbers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Hash className="h-8 w-8" />
              <p className="text-sm">No phone numbers provisioned.</p>
              <Button size="sm" onClick={() => setShowBuyModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Buy Your First Number
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Number</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Friendly Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Capabilities</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Monthly Cost</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {numbers.map((num) => {
                    const caps: string[] = Array.isArray(num.capabilities)
                      ? num.capabilities
                      : [num.type ?? "voice"].filter(Boolean);
                    return (
                      <tr
                        key={num.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-sm font-medium">
                          {num.number ?? num.phoneNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {num.friendlyName ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {num.numberType ?? num.type ?? "local"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {caps.map((cap) => (
                              <Badge
                                key={cap}
                                variant="outline"
                                className={`text-xs ${getCapabilityBadge(cap)}`}
                              >
                                {cap.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {num.provider ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {num.monthlyPrice != null
                            ? `$${Number(num.monthlyPrice).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {num.assignedTo ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buy Number Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Buy Phone Number</h2>
              <button
                onClick={() => setShowBuyModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number</label>
                <Input
                  placeholder="+1 555 000 0000"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Friendly Name (optional)</label>
                <Input
                  placeholder="e.g. Support Line"
                  value={friendlyName}
                  onChange={(e) => setFriendlyName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Provider (optional)</label>
                <Input
                  placeholder="e.g. twilio"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBuyModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => buyMutation.mutate()}
                disabled={buyMutation.isPending || !newNumber.trim()}
              >
                {buyMutation.isPending ? "Purchasing…" : "Buy Number"}
              </Button>
            </div>
            {buyMutation.isError && (
              <p className="text-xs text-destructive">Failed to purchase. Try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
