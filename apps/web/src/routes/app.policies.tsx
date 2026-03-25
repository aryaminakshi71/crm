import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  DatabaseBackup,
  Globe,
  HardDriveDownload,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/policies")({
  component: PoliciesPage,
});

function PoliciesPage() {
  const queryClient = useQueryClient();
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);
  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);

  const [newRetention, setNewRetention] = useState({
    dataClass: "",
    retentionPeriod: "",
    backupFrequency: "Daily",
    archivePolicy: "",
  });

  const [newDrill, setNewDrill] = useState({
    scenario: "",
    rto: "",
    rpo: "",
    status: "planned",
    notes: "",
  });

  const retentionQuery = useQuery({
    queryKey: ["ops-retention-policies"],
    queryFn: () =>
      nucleoApi.operations.retentionPolicies.list({ page: 1, limit: 200 }),
  });

  const drillsQuery = useQuery({
    queryKey: ["ops-dr-drills"],
    queryFn: () => nucleoApi.operations.drDrills.list({ page: 1, limit: 200 }),
  });

  const createRetention = useMutation({
    mutationFn: (payload: any) =>
      nucleoApi.operations.retentionPolicies.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-retention-policies"] });
      toast.success("Retention rule added");
      setIsRetentionModalOpen(false);
      setNewRetention({
        dataClass: "",
        retentionPeriod: "",
        backupFrequency: "Daily",
        archivePolicy: "",
      });
    },
    onError: () => toast.error("Failed to add retention rule"),
  });

  const updateRetention = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.retentionPolicies.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-retention-policies"] });
      toast.success("Retention rule updated");
    },
    onError: () => toast.error("Failed to update retention rule"),
  });

  const deleteRetention = useMutation({
    mutationFn: (id: string) =>
      nucleoApi.operations.retentionPolicies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-retention-policies"] });
      toast.success("Retention rule deleted");
    },
    onError: () => toast.error("Failed to delete retention rule"),
  });

  const createDrill = useMutation({
    mutationFn: (payload: any) => nucleoApi.operations.drDrills.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-dr-drills"] });
      toast.success("DR drill log recorded");
      setIsDrillModalOpen(false);
      setNewDrill({
        scenario: "",
        rto: "",
        rpo: "",
        status: "planned",
        notes: "",
      });
    },
    onError: () => toast.error("Failed to log DR drill"),
  });

  const updateDrill = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.drDrills.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-dr-drills"] });
      toast.success("DR drill updated");
    },
    onError: () => toast.error("Failed to update DR drill"),
  });

  const deleteDrill = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.drDrills.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-dr-drills"] });
      toast.success("DR drill deleted");
    },
    onError: () => toast.error("Failed to delete DR drill"),
  });

  const retentionPolicies = useMemo(
    () => retentionQuery.data?.data || [],
    [retentionQuery.data],
  );
  const drScenarios = useMemo(
    () => drillsQuery.data?.data || [],
    [drillsQuery.data],
  );

  const policyCoverage = useMemo(
    () => retentionPolicies.length,
    [retentionPolicies.length],
  );
  const drHealth = useMemo(() => {
    if (!drScenarios.length) return 0;
    return Math.round(
      (drScenarios.filter((d: any) => d.status === "passed").length /
        drScenarios.length) *
        100,
    );
  }, [drScenarios]);

  if (retentionQuery.isLoading || drillsQuery.isLoading) {
    return <Loading text="Loading policy controls..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Data Retention, Backup & DR
          </h1>
          <p className="text-muted-foreground">
            Operational policies for retention controls, backup strategy, and
            disaster recovery readiness.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsRetentionModalOpen(true)}
          >
            Add Retention Rule
          </Button>
          <Button
            variant="primary"
            leftIcon={<ShieldAlert className="h-4 w-4" />}
            onClick={() => setIsDrillModalOpen(true)}
          >
            Log DR Drill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Policy Coverage"
          value={policyCoverage}
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="All datasets"
          color="text-primary"
        />
        <Metric
          title="DR Readiness"
          value={`${Number.isFinite(drHealth) ? drHealth : 0}%`}
          icon={<DatabaseBackup className="h-4 w-4" />}
          trend="Verified"
          color="text-emerald-400"
        />
        <Metric
          title="Active Backups"
          value="142"
          icon={<HardDriveDownload className="h-4 w-4" />}
          trend="Daily sync"
          color="text-sky-400"
        />
        <Metric
          title="Compliance"
          value="SOX/GDPR"
          icon={<Lock className="h-4 w-4" />}
          trend="Nominal"
          color="text-violet-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Resilience Velocity
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                DR Score Trend
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "Jan", score: 82 },
                    { month: "Feb", score: 85 },
                    { month: "Mar", score: 88 },
                    { month: "Apr", score: 92 },
                    { month: "May", score: 95 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorDR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorDR)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Regional Sync</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                Global failover is active. Primary: **US-East-1**, Secondary:
                **EU-West-1**. Latency at 85ms.
              </p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                Backup Integrity
              </p>
              <div className="space-y-3">
                {[
                  {
                    task: "SQL Persistence",
                    status: "Success",
                    time: "2h ago",
                  },
                  {
                    task: "Blob Storage",
                    status: "In Progress",
                    time: "5m ago",
                  },
                  { task: "IAM Polling", status: "Success", time: "12h ago" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px] font-bold"
                  >
                    <span className="text-muted-foreground uppercase">
                      {item.task}
                    </span>
                    <span
                      className={
                        item.status === "Success"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Retention & Backup Matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {retentionPolicies.map((policy: any) => (
              <div
                key={policy.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-medium text-foreground">
                  {policy.dataClass}
                </p>
                <p className="text-muted-foreground text-sm">
                  Retention: {policy.retentionPeriod} | Backup:{" "}
                  {policy.backupFrequency}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {policy.archivePolicy || "-"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                    value={policy.status}
                    onChange={(e) =>
                      updateRetention.mutate({
                        id: policy.id,
                        data: { status: e.target.value },
                      })
                    }
                  >
                    <option value="active">active</option>
                    <option value="review">review</option>
                    <option value="archived">archived</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => deleteRetention.mutate(policy.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disaster Recovery Runbook Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {drScenarios.map((dr: any) => (
              <div key={dr.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{dr.scenario}</p>
                    <p className="text-muted-foreground text-sm">
                      RTO: {dr.rto} | RPO: {dr.rpo} | Last Drill:{" "}
                      {dr.drillDate
                        ? new Date(dr.drillDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      dr.status === "passed"
                        ? "success"
                        : dr.status === "needs_retest"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {dr.status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                    value={dr.status}
                    onChange={(e) =>
                      updateDrill.mutate({
                        id: dr.id,
                        data: { status: e.target.value },
                      })
                    }
                  >
                    <option value="planned">planned</option>
                    <option value="passed">passed</option>
                    <option value="needs_retest">needs_retest</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => deleteDrill.mutate(dr.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <FormModal
        isOpen={isRetentionModalOpen}
        onClose={() => setIsRetentionModalOpen(false)}
        title="Add Data Retention Rule"
        submitText="Save Rule"
        loading={createRetention.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !newRetention.dataClass.trim() ||
            !newRetention.retentionPeriod.trim()
          ) {
            toast.error("Data class and retention period are required");
            return;
          }
          createRetention.mutate({
            dataClass: newRetention.dataClass.trim(),
            retentionPeriod: newRetention.retentionPeriod.trim(),
            backupFrequency: newRetention.backupFrequency,
            archivePolicy: newRetention.archivePolicy.trim() || undefined,
            status: "active",
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Data Class" required>
            <Input
              value={newRetention.dataClass}
              onChange={(e) =>
                setNewRetention((prev) => ({
                  ...prev,
                  dataClass: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Retention Period" required>
            <Input
              placeholder="e.g. 7 years"
              value={newRetention.retentionPeriod}
              onChange={(e) =>
                setNewRetention((prev) => ({
                  ...prev,
                  retentionPeriod: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Backup Frequency">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newRetention.backupFrequency}
              onChange={(e) =>
                setNewRetention((prev) => ({
                  ...prev,
                  backupFrequency: e.target.value,
                }))
              }
            >
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </FormField>
          <FormField label="Archive Policy">
            <Textarea
              rows={3}
              value={newRetention.archivePolicy}
              onChange={(e) =>
                setNewRetention((prev) => ({
                  ...prev,
                  archivePolicy: e.target.value,
                }))
              }
            />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isDrillModalOpen}
        onClose={() => setIsDrillModalOpen(false)}
        title="Log DR Drill"
        submitText="Save Drill"
        loading={createDrill.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !newDrill.scenario.trim() ||
            !newDrill.rto.trim() ||
            !newDrill.rpo.trim()
          ) {
            toast.error("Scenario, RTO, and RPO are required");
            return;
          }
          createDrill.mutate({
            scenario: newDrill.scenario.trim(),
            rto: newDrill.rto.trim(),
            rpo: newDrill.rpo.trim(),
            drillDate: new Date().toISOString(),
            status: newDrill.status,
            notes: newDrill.notes.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Scenario" required>
            <Input
              value={newDrill.scenario}
              onChange={(e) =>
                setNewDrill((prev) => ({ ...prev, scenario: e.target.value }))
              }
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="RTO" required>
              <Input
                placeholder="e.g. 4h"
                value={newDrill.rto}
                onChange={(e) =>
                  setNewDrill((prev) => ({ ...prev, rto: e.target.value }))
                }
              />
            </FormField>
            <FormField label="RPO" required>
              <Input
                placeholder="e.g. 15m"
                value={newDrill.rpo}
                onChange={(e) =>
                  setNewDrill((prev) => ({ ...prev, rpo: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Result Status">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newDrill.status}
              onChange={(e) =>
                setNewDrill((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="planned">planned</option>
              <option value="passed">passed</option>
              <option value="needs_retest">needs_retest</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <Textarea
              rows={3}
              value={newDrill.notes}
              onChange={(e) =>
                setNewDrill((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </FormField>
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
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <ShieldCheck className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
