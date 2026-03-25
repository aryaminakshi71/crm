import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/helpdesk/sla/_index")({
  validateSearch: searchSchema,
  component: SLAPage,
});

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "destructive",
  high: "destructive",
  medium: "warning",
  low: "outline",
};

function SLAPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/helpdesk/sla/_index" });
  const navigate = useNavigate({ from: "/app/helpdesk/sla/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    priority: "medium",
    firstResponseHours: "4",
    resolutionHours: "24",
    businessHoursOnly: false,
    isDefault: false,
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["helpdesk-sla"],
    queryFn: () => helpdeskApi.sla.list({ page: 1, limit: 50 }),
  });

  const createPolicy = useMutation({
    mutationFn: (payload: {
      name: string;
      priority: string;
      firstResponseHours?: number;
      resolutionHours?: number;
      businessHoursOnly?: boolean;
      isDefault?: boolean;
    }) => helpdeskApi.sla.create(payload),
    onSuccess: () => {
      toast.success("SLA policy created");
      qc.invalidateQueries({ queryKey: ["helpdesk-sla"] });
      setIsCreateOpen(false);
      setNewPolicy({ name: "", priority: "medium", firstResponseHours: "4", resolutionHours: "24", businessHoursOnly: false, isDefault: false });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create SLA policy"),
  });

  const policies: any[] = (data as any)?.data ?? [];

  const avgResponseTime = policies.length > 0
    ? policies.reduce((s: number, p: any) => s + (Number(p.firstResponseHours) || 0), 0) / policies.length
    : 0;
  const breachingCount = policies.filter((p: any) => (Number(p.breachPercent) || 0) > 10).length;
  const defaultPolicy = policies.find((p: any) => p.isDefault);

  // Compute mock compliance from policies (real breach % if present, else 100)
  const complianceRate = policies.length > 0
    ? Math.round(
        policies.reduce((s: number, p: any) => s + (100 - (Number(p.breachPercent) || 0)), 0) / policies.length
      )
    : 100;

  const filtered = useMemo(() => {
    if (!q.trim()) return policies;
    const s = q.toLowerCase();
    return policies.filter((p: any) =>
      [p.name, p.priority].some((v) => String(v ?? "").toLowerCase().includes(s))
    );
  }, [policies, q]);

  if (isLoading) return <Loading text="Loading SLA policies..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-6 w-6" /> SLA Policies
          </h1>
          <p className="text-muted-foreground text-sm">Define response and resolution time targets by priority.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New SLA Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric title="Total Policies" value={policies.length} icon={<ShieldCheck className="h-4 w-4" />} color="text-primary" />
        <Metric
          title="Compliance Rate"
          value={`${complianceRate}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend="avg across policies"
          color={complianceRate >= 90 ? "text-emerald-400" : "text-amber-400"}
        />
        <Metric
          title="Avg Response Target"
          value={`${avgResponseTime.toFixed(1)}h`}
          icon={<Timer className="h-4 w-4" />}
          color="text-cyan-400"
        />
        <Metric
          title="Policies Breaching"
          value={breachingCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend="> 10% breach rate"
          color={breachingCount > 0 ? "text-destructive" : "text-emerald-400"}
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search policies..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-12 w-12" />}
              title="No SLA policies found"
              description={q ? "Try adjusting your search." : "Create your first SLA policy to enforce response times."}
              action={<Button onClick={() => setIsCreateOpen(true)}>New SLA Policy</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((policy: any) => (
                <div key={policy.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{policy.name}</p>
                        {policy.isDefault && <Badge variant="primary" className="text-xs">Default</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 md:grid-cols-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">First Response</p>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {policy.firstResponseHours ?? "—"}h
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Resolution</p>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <Timer className="h-3 w-3" /> {policy.resolutionHours ?? "—"}h
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Breach Rate</p>
                          <p className={`text-sm font-semibold ${(Number(policy.breachPercent) || 0) > 10 ? "text-destructive" : "text-emerald-400"}`}>
                            {policy.breachPercent != null ? `${policy.breachPercent}%` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Business Hours</p>
                          <p className="text-sm font-semibold text-foreground">
                            {policy.businessHoursOnly ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={(PRIORITY_COLORS[policy.priority] ?? "outline") as any}>
                        {policy.priority ?? "medium"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New SLA Policy"
        submitText="Create Policy"
        loading={createPolicy.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newPolicy.name.trim()) {
            toast.error("Policy name is required");
            return;
          }
          createPolicy.mutate({
            name: newPolicy.name.trim(),
            priority: newPolicy.priority,
            firstResponseHours: Number(newPolicy.firstResponseHours) || undefined,
            resolutionHours: Number(newPolicy.resolutionHours) || undefined,
            businessHoursOnly: newPolicy.businessHoursOnly,
            isDefault: newPolicy.isDefault,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Policy Name" required>
            <Input
              value={newPolicy.name}
              onChange={(e) => setNewPolicy((p) => ({ ...p, name: e.target.value }))}
              placeholder="Standard Support SLA"
              required
            />
          </FormField>
          <FormField label="Priority Level">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newPolicy.priority}
              onChange={(e) => setNewPolicy((p) => ({ ...p, priority: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Response (hours)">
              <Input
                type="number"
                min="1"
                value={newPolicy.firstResponseHours}
                onChange={(e) => setNewPolicy((p) => ({ ...p, firstResponseHours: e.target.value }))}
                placeholder="4"
              />
            </FormField>
            <FormField label="Resolution Time (hours)">
              <Input
                type="number"
                min="1"
                value={newPolicy.resolutionHours}
                onChange={(e) => setNewPolicy((p) => ({ ...p, resolutionHours: e.target.value }))}
                placeholder="24"
              />
            </FormField>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={newPolicy.businessHoursOnly}
                onChange={(e) => setNewPolicy((p) => ({ ...p, businessHoursOnly: e.target.checked }))}
                className="rounded"
              />
              Business hours only
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={newPolicy.isDefault}
                onChange={(e) => setNewPolicy((p) => ({ ...p, isDefault: e.target.checked }))}
                className="rounded"
              />
              Set as default
            </label>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <ShieldCheck className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
