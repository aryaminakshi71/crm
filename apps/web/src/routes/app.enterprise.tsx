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
  LoadingSkeleton,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Fingerprint,
  History,
  KeyRound,
  Lock,
  Network,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck2,
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
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/enterprise")({
  component: EnterpriseControlsPage,
});

function relativeTime(value: unknown) {
  if (!value) return "-";
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().replace("T", " ").slice(0, 16);
}

function EnterpriseControlsPage() {
  const queryClient = useQueryClient();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isIdpModalOpen, setIsIdpModalOpen] = useState(false);

  const [newRole, setNewRole] = useState({
    name: "",
    scope: "",
    riskLevel: "low" as "low" | "medium" | "high",
  });
  const [newApproval, setNewApproval] = useState({
    title: "",
    ownerTeam: "Finance",
    stageCount: "2",
    notes: "",
  });
  const [newIdp, setNewIdp] = useState({
    providerName: "",
    providerType: "oidc",
  });

  const summaryQuery = useQuery({
    queryKey: ["enterprise-summary"],
    queryFn: () => nucleoApi.enterprise.summary(),
  });

  const rolesQuery = useQuery({
    queryKey: ["enterprise-roles"],
    queryFn: () => nucleoApi.enterprise.roles.list({ page: 1, limit: 100 }),
  });

  const workflowsQuery = useQuery({
    queryKey: ["enterprise-workflows"],
    queryFn: () => nucleoApi.enterprise.workflows.list({ page: 1, limit: 100 }),
  });

  const auditQuery = useQuery({
    queryKey: ["enterprise-audit-events"],
    queryFn: () =>
      nucleoApi.enterprise.auditEvents.list({ page: 1, limit: 100 }),
  });

  const providersQuery = useQuery({
    queryKey: ["enterprise-sso-providers"],
    queryFn: () =>
      nucleoApi.enterprise.ssoProviders.list({ page: 1, limit: 50 }),
  });

  const createRole = useMutation({
    mutationFn: (payload: {
      name: string;
      scope: string;
      riskLevel: "low" | "medium" | "high";
    }) => nucleoApi.enterprise.roles.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enterprise-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["enterprise-roles"] }),
      ]);
      toast.success("Role created");
    },
    onError: () => toast.error("Failed to create role"),
  });

  const createWorkflow = useMutation({
    mutationFn: (payload: {
      title: string;
      ownerTeam: string;
      stageCount: number;
      notes?: string;
    }) => nucleoApi.enterprise.workflows.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enterprise-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["enterprise-workflows"] }),
      ]);
      toast.success("Approval workflow created");
    },
    onError: () => toast.error("Failed to create workflow"),
  });

  const updateRoleRisk = useMutation({
    mutationFn: ({
      id,
      riskLevel,
    }: { id: string; riskLevel: "low" | "medium" | "high" }) =>
      nucleoApi.enterprise.roles.update(id, { riskLevel }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enterprise-roles"] });
      toast.success("Role updated");
    },
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => nucleoApi.enterprise.roles.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enterprise-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["enterprise-roles"] }),
      ]);
      toast.success("Role deleted");
    },
  });

  const updateWorkflowStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.enterprise.workflows.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["enterprise-workflows"],
      });
      toast.success("Workflow updated");
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: (id: string) => nucleoApi.enterprise.workflows.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enterprise-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["enterprise-workflows"] }),
      ]);
      toast.success("Workflow deleted");
    },
  });

  const createIdp = useMutation({
    mutationFn: (payload: { providerName: string; providerType: string }) =>
      nucleoApi.enterprise.ssoProviders.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enterprise-summary"] }),
        queryClient.invalidateQueries({
          queryKey: ["enterprise-sso-providers"],
        }),
      ]);
      toast.success("SSO provider created");
    },
    onError: () => toast.error("Failed to create provider"),
  });

  const updateIdpStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.enterprise.ssoProviders.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["enterprise-sso-providers"],
      });
      toast.success("Provider updated");
    },
  });

  const deleteIdp = useMutation({
    mutationFn: (id: string) => nucleoApi.enterprise.ssoProviders.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enterprise-summary"] }),
        queryClient.invalidateQueries({
          queryKey: ["enterprise-sso-providers"],
        }),
      ]);
      toast.success("Provider deleted");
    },
  });

  const roles = useMemo(() => rolesQuery.data?.data || [], [rolesQuery.data]);
  const approvals = useMemo(
    () => workflowsQuery.data?.data || [],
    [workflowsQuery.data],
  );
  const auditEvents = useMemo(
    () => auditQuery.data?.data || [],
    [auditQuery.data],
  );
  const identityProviders = useMemo(
    () => providersQuery.data?.data || [],
    [providersQuery.data],
  );
  const summary = summaryQuery.data || {
    roles: roles.length,
    workflows: approvals.length,
    auditEvents: auditEvents.length,
    ssoProviders: identityProviders.length,
  };

  const isLoadingAny =
    summaryQuery.isLoading ||
    rolesQuery.isLoading ||
    workflowsQuery.isLoading ||
    auditQuery.isLoading ||
    providersQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Enterprise Controls
          </h1>
          <p className="text-muted-foreground">
            RBAC, approvals, audit trails, and identity federation (SSO/SCIM).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsRoleModalOpen(true)}
          >
            Add Role
          </Button>
          <Button
            variant="primary"
            leftIcon={<UserCheck2 className="h-4 w-4" />}
            onClick={() => setIsApprovalModalOpen(true)}
          >
            Add Approval Flow
          </Button>
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsIdpModalOpen(true)}
          >
            Add SSO
          </Button>
        </div>
      </div>

      {isLoadingAny ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Metric
            title="Active Roles"
            value={summary.roles || 0}
            icon={<KeyRound className="h-4 w-4" />}
            trend="Secured"
            color="text-primary"
          />
          <Metric
            title="Governance Flows"
            value={summary.workflows || 0}
            icon={<UserCheck2 className="h-4 w-4" />}
            trend="Active"
            color="text-cyan-400"
          />
          <Metric
            title="Audit Velocity"
            value={summary.auditEvents || 0}
            icon={<History className="h-4 w-4" />}
            trend="+12% /wk"
            color="text-amber-400"
          />
          <Metric
            title="Identity Links"
            value={summary.ssoProviders || 0}
            icon={<Fingerprint className="h-4 w-4" />}
            trend="Encrypted"
            color="text-emerald-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Access Distribution
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Global Identity Map
              </p>
            </div>
            <Network className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { time: "00:00", requests: 120, threats: 2 },
                    { time: "04:00", requests: 80, threats: 0 },
                    { time: "08:00", requests: 450, threats: 5 },
                    { time: "12:00", requests: 890, threats: 12 },
                    { time: "16:00", requests: 1200, threats: 8 },
                    { time: "20:00", requests: 600, threats: 3 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="time"
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
                    dataKey="requests"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorReq)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Shield className="h-32 w-32 text-primary" />
          </div>
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              Security Posture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted/20"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-primary transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.94)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">94%</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Compliance
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                {
                  label: "MFA Enforcement",
                  status: "Active",
                  color: "text-emerald-400",
                },
                {
                  label: "RBAC Integrity",
                  status: "Verified",
                  color: "text-emerald-400",
                },
                {
                  label: "SSO Syncing",
                  status: "Healthy",
                  color: "text-emerald-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> RBAC Matrix
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] font-bold uppercase tracking-widest px-2"
              onClick={() => setIsRoleModalOpen(true)}
            >
              New Role
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role: any) => (
              <div
                key={role.id}
                className="rounded-xl border border-border/50 bg-muted/5 p-4 flex items-center justify-between group hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${role.riskLevel === "high" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
                  >
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground leading-none">
                      {role.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium tracking-tight">
                      Scope: {role.scope}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
                      Risk Profile
                    </p>
                    <Badge
                      variant={
                        role.riskLevel === "high"
                          ? "danger"
                          : role.riskLevel === "medium"
                            ? "warning"
                            : "success"
                      }
                      className="text-[9px] font-black uppercase"
                    >
                      {role.riskLevel}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteRole.mutate(role.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck2 className="h-4 w-4 text-cyan-400" /> Approvals Engine
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] font-bold uppercase tracking-widest px-2"
              onClick={() => setIsApprovalModalOpen(true)}
            >
              Add Flow
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvals.map((approval: any) => (
              <div
                key={approval.id}
                className="rounded-xl border border-border/50 bg-muted/5 p-4 flex items-center justify-between group hover:border-cyan-400/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground leading-none">
                      {approval.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium tracking-tight">
                      Owner: {approval.ownerTeam} · {approval.stageCount} Stages
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      approval.status === "active" ? "success" : "warning"
                    }
                    className="text-[9px] font-black uppercase"
                  >
                    {approval.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteWorkflow.mutate(approval.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditEvents.map((event: any) => (
              <div
                key={event.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-medium text-foreground">{event.action}</p>
                <p className="text-muted-foreground text-xs">
                  {event.actor || "system"} | {relativeTime(event.eventTime)}
                </p>
                <Badge
                  variant={
                    event.severity === "high"
                      ? "danger"
                      : event.severity === "medium"
                        ? "warning"
                        : "outline"
                  }
                >
                  {event.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSO / SCIM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {identityProviders.map((idp: any) => (
              <div key={idp.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {idp.providerName}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Last sync: {relativeTime(idp.lastSyncAt)}
                    </p>
                  </div>
                  <Badge
                    variant={idp.status === "connected" ? "success" : "outline"}
                  >
                    {idp.status}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    className="flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={idp.status || "connected"}
                    onChange={(e) =>
                      updateIdpStatus.mutate({
                        id: idp.id,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="connected">connected</option>
                    <option value="degraded">degraded</option>
                    <option value="disconnected">disconnected</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteIdp.mutate(idp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-muted-foreground text-xs">
              `/api/enterprise/audit/ingest` and `/api/enterprise/scim/sync` are
              active for external webhook ingestion.
            </p>
          </CardContent>
        </Card>
      </div>

      <FormModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Create Custom Role"
        submitText="Create Role"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newRole.name.trim() || !newRole.scope.trim()) {
            toast.error("Role name and scope are required");
            return;
          }
          createRole.mutate(
            {
              name: newRole.name.trim(),
              scope: newRole.scope.trim(),
              riskLevel: newRole.riskLevel,
            },
            {
              onSuccess: () => {
                setNewRole({ name: "", scope: "", riskLevel: "low" });
                setIsRoleModalOpen(false);
              },
            },
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Role Name" required>
            <Input
              value={newRole.name}
              onChange={(e) =>
                setNewRole((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Permission Scope" required>
            <Input
              value={newRole.scope}
              onChange={(e) =>
                setNewRole((prev) => ({ ...prev, scope: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Risk Tier">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newRole.riskLevel}
              onChange={(e) =>
                setNewRole((prev) => ({
                  ...prev,
                  riskLevel: e.target.value as "low" | "medium" | "high",
                }))
              }
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Create Approval Workflow"
        submitText="Create Workflow"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newApproval.title.trim()) {
            toast.error("Workflow title is required");
            return;
          }
          const stageCount = Number(newApproval.stageCount);
          if (!Number.isFinite(stageCount) || stageCount < 1) {
            toast.error("Stage count must be at least 1");
            return;
          }
          createWorkflow.mutate(
            {
              title: newApproval.title.trim(),
              ownerTeam: newApproval.ownerTeam,
              stageCount,
              notes: newApproval.notes || undefined,
            },
            {
              onSuccess: () => {
                setNewApproval({
                  title: "",
                  ownerTeam: "Finance",
                  stageCount: "2",
                  notes: "",
                });
                setIsApprovalModalOpen(false);
              },
            },
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Workflow Title" required>
            <Input
              value={newApproval.title}
              onChange={(e) =>
                setNewApproval((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Owner Team">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newApproval.ownerTeam}
                onChange={(e) =>
                  setNewApproval((prev) => ({
                    ...prev,
                    ownerTeam: e.target.value,
                  }))
                }
              >
                <option value="Finance">Finance</option>
                <option value="Procurement">Procurement</option>
                <option value="Security">Security</option>
                <option value="Legal">Legal</option>
              </select>
            </FormField>
            <FormField label="Stages">
              <Input
                type="number"
                min="1"
                value={newApproval.stageCount}
                onChange={(e) =>
                  setNewApproval((prev) => ({
                    ...prev,
                    stageCount: e.target.value,
                  }))
                }
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              rows={3}
              value={newApproval.notes}
              onChange={(e) =>
                setNewApproval((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        isOpen={isIdpModalOpen}
        onClose={() => setIsIdpModalOpen(false)}
        title="Add SSO Provider"
        submitText="Create Provider"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newIdp.providerName.trim()) {
            toast.error("Provider name is required");
            return;
          }
          createIdp.mutate(
            {
              providerName: newIdp.providerName.trim(),
              providerType: newIdp.providerType,
            },
            {
              onSuccess: () => {
                setNewIdp({ providerName: "", providerType: "oidc" });
                setIsIdpModalOpen(false);
              },
            },
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Provider Name" required>
            <Input
              value={newIdp.providerName}
              onChange={(e) =>
                setNewIdp((prev) => ({ ...prev, providerName: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Provider Type">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newIdp.providerType}
              onChange={(e) =>
                setNewIdp((prev) => ({ ...prev, providerType: e.target.value }))
              }
            >
              <option value="oidc">oidc</option>
              <option value="saml">saml</option>
            </select>
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
