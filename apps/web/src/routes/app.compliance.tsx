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
  Activity,
  AlertTriangle,
  History,
  Plus,
  Scale,
  ShieldCheck,
  Trash2,
  Zap,
  AlertCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/compliance")({
  component: CompliancePage,
});

function CompliancePage() {
  const queryClient = useQueryClient();
  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  const [newControl, setNewControl] = useState({
    framework: "SOC2",
    control: "",
    owner: "Security",
    evidenceDue: "",
  });

  const [newRisk, setNewRisk] = useState({
    title: "",
    severity: "medium",
    owner: "Security",
    mitigation: "",
  });

  const controlsQuery = useQuery({
    queryKey: ["ops-compliance-controls"],
    queryFn: () =>
      nucleoApi.operations.complianceControls.list({ page: 1, limit: 200 }),
  });
  if (controlsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => controlsQuery.refetch()}>Retry</Button>
    </div>
  );

  const risksQuery = useQuery({
    queryKey: ["ops-compliance-risks"],
    queryFn: () =>
      nucleoApi.operations.complianceRisks.list({ page: 1, limit: 200 }),
  });

  const createControl = useMutation({
    mutationFn: (payload: any) =>
      nucleoApi.operations.complianceControls.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-controls"] });
      toast.success("Control added");
      setIsControlModalOpen(false);
      setNewControl({
        framework: "SOC2",
        control: "",
        owner: "Security",
        evidenceDue: "",
      });
    },
    onError: () => toast.error("Failed to add control"),
  });

  const updateControl = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.complianceControls.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-controls"] });
      toast.success("Control updated");
    },
    onError: () => toast.error("Failed to update control"),
  });

  const deleteControl = useMutation({
    mutationFn: (id: string) =>
      nucleoApi.operations.complianceControls.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-controls"] });
      toast.success("Control deleted");
    },
    onError: () => toast.error("Failed to delete control"),
  });

  const createRisk = useMutation({
    mutationFn: (payload: any) =>
      nucleoApi.operations.complianceRisks.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-risks"] });
      toast.success("Risk logged");
      setIsRiskModalOpen(false);
      setNewRisk({
        title: "",
        severity: "medium",
        owner: "Security",
        mitigation: "",
      });
    },
    onError: () => toast.error("Failed to log risk"),
  });

  const updateRisk = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.complianceRisks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-risks"] });
      toast.success("Risk updated");
    },
    onError: () => toast.error("Failed to update risk"),
  });

  const deleteRisk = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.complianceRisks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-risks"] });
      toast.success("Risk deleted");
    },
    onError: () => toast.error("Failed to delete risk"),
  });

  const controls = useMemo(
    () => controlsQuery.data?.data || [],
    [controlsQuery.data],
  );
  const risks = useMemo(() => risksQuery.data?.data || [], [risksQuery.data]);

  const implemented = controls.filter(
    (control: any) => control.status === "implemented",
  ).length;
  const inProgress = controls.filter(
    (control: any) => control.status === "in_progress",
  ).length;
  const openHighRisks = risks.filter(
    (risk: any) => risk.severity === "high" && risk.status !== "closed",
  ).length;

  const complianceScore = useMemo(() => {
    if (!controls.length) return 0;
    return Math.round((implemented / controls.length) * 100);
  }, [implemented, controls.length]);

  if (controlsQuery.isLoading || risksQuery.isLoading) {
    return <Loading text="Loading compliance center..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Policy & Compliance Center
          </h1>
          <p className="text-muted-foreground">
            SOC2 and ISO control tracking, evidence pipeline, and risk register.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsControlModalOpen(true)}
          >
            Add Control
          </Button>
          <Button
            variant="primary"
            leftIcon={<AlertTriangle className="h-4 w-4" />}
            onClick={() => setIsRiskModalOpen(true)}
          >
            Log Risk
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Compliance Score"
          value={`${complianceScore}%`}
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="On Target"
          color="text-primary"
        />
        <Metric
          title="Active Audits"
          value="2"
          icon={<Activity className="h-4 w-4" />}
          trend="+1 scheduled"
          color="text-cyan-400"
        />
        <Metric
          title="High Risks"
          value={openHighRisks}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend="Requires action"
          color="text-rose-400"
        />
        <Metric
          title="Policy Drift"
          value="-1.2%"
          icon={<Scale className="h-4 w-4" />}
          trend="Stable"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Framework Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "SOC2", val: 82, color: "#22d3ee" },
                    { name: "ISO27k", val: 65, color: "#a78bfa" },
                    { name: "HIPAA", val: 45, color: "#f472b6" },
                    { name: "GDPR", val: 92, color: "#34d399" },
                  ]}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={20}>
                    {[
                      { name: "SOC2", val: 82, color: "#22d3ee" },
                      { name: "ISO27k", val: 65, color: "#a78bfa" },
                      { name: "HIPAA", val: 45, color: "#f472b6" },
                      { name: "GDPR", val: 92, color: "#34d399" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-bold">
                Audit Timeline
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                date: "Oct 12",
                event: "Internal SOC2 Dry Run",
                status: "Done",
              },
              { date: "Nov 05", event: "Vendor Assessment", status: "Pending" },
              {
                date: "Dec 15",
                event: "External Audit Window",
                status: "Scheduled",
              },
            ].map((item) => (
              <div
                key={item.event}
                className="flex gap-4 border-l border-border/40 pl-4 py-1 relative"
              >
                <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-primary" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    {item.date}
                  </p>
                  <p className="text-xs font-bold leading-none">{item.event}</p>
                  <p className="text-[10px] text-primary font-medium">
                    {item.status}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Control Implementation Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {controls.map((control: any) => (
              <div
                key={control.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {control.control}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {control.framework} | Owner: {control.owner} | Evidence
                      Due:{" "}
                      {control.evidenceDue
                        ? new Date(control.evidenceDue).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        control.status === "implemented"
                          ? "success"
                          : control.status === "in_progress"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {control.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                        value={control.status}
                        onChange={(e) =>
                          updateControl.mutate({
                            id: control.id,
                            data: { status: e.target.value },
                          })
                        }
                      >
                        <option value="planned">planned</option>
                        <option value="in_progress">in_progress</option>
                        <option value="implemented">implemented</option>
                        <option value="needs_review">needs_review</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteControl.mutate(control.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Register</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {risks.map((risk: any) => (
              <div
                key={risk.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{risk.title}</p>
                    <p className="text-muted-foreground text-sm">
                      Owner: {risk.owner}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {risk.mitigation || "Mitigation pending"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        risk.severity === "high"
                          ? "danger"
                          : risk.severity === "medium"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {risk.severity}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                        value={risk.status}
                        onChange={(e) =>
                          updateRisk.mutate({
                            id: risk.id,
                            data: { status: e.target.value },
                          })
                        }
                      >
                        <option value="open">open</option>
                        <option value="mitigating">mitigating</option>
                        <option value="closed">closed</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteRisk.mutate(risk.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <FormModal
        isOpen={isControlModalOpen}
        onClose={() => setIsControlModalOpen(false)}
        title="Add Control"
        submitText="Add Control"
        loading={createControl.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newControl.control.trim()) {
            toast.error("Control title is required");
            return;
          }
          createControl.mutate({
            framework: newControl.framework,
            control: newControl.control.trim(),
            owner: newControl.owner,
            status: "planned",
            evidenceDue: newControl.evidenceDue
              ? new Date(newControl.evidenceDue).toISOString()
              : undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Framework">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newControl.framework}
              onChange={(e) =>
                setNewControl((prev) => ({
                  ...prev,
                  framework: e.target.value,
                }))
              }
            >
              <option value="SOC2">SOC2</option>
              <option value="ISO27001">ISO27001</option>
              <option value="GDPR">GDPR</option>
            </select>
          </FormField>
          <FormField label="Control" required>
            <Input
              value={newControl.control}
              onChange={(e) =>
                setNewControl((prev) => ({ ...prev, control: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Owner">
            <Input
              value={newControl.owner}
              onChange={(e) =>
                setNewControl((prev) => ({ ...prev, owner: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Evidence Due Date">
            <Input
              type="date"
              value={newControl.evidenceDue}
              onChange={(e) =>
                setNewControl((prev) => ({
                  ...prev,
                  evidenceDue: e.target.value,
                }))
              }
            />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        title="Log Compliance Risk"
        submitText="Log Risk"
        loading={createRisk.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newRisk.title.trim()) {
            toast.error("Risk title is required");
            return;
          }
          createRisk.mutate({
            title: newRisk.title.trim(),
            severity: newRisk.severity,
            owner: newRisk.owner,
            mitigation: newRisk.mitigation.trim() || undefined,
            status: "open",
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Risk Title" required>
            <Input
              value={newRisk.title}
              onChange={(e) =>
                setNewRisk((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Severity">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newRisk.severity}
                onChange={(e) =>
                  setNewRisk((prev) => ({ ...prev, severity: e.target.value }))
                }
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </FormField>
            <FormField label="Owner">
              <Input
                value={newRisk.owner}
                onChange={(e) =>
                  setNewRisk((prev) => ({ ...prev, owner: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Mitigation Plan">
            <Textarea
              rows={3}
              value={newRisk.mitigation}
              onChange={(e) =>
                setNewRisk((prev) => ({ ...prev, mitigation: e.target.value }))
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
