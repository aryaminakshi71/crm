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
import { KeyRound, Plus, ShieldCheck, Trash2, UserCheck2 } from "lucide-react";
import { useMemo, useState } from "react";
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

  const [newRole, setNewRole] = useState({ name: "", scope: "", riskLevel: "low" as "low" | "medium" | "high" });
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
    queryFn: () => nucleoApi.enterprise.auditEvents.list({ page: 1, limit: 100 }),
  });

  const providersQuery = useQuery({
    queryKey: ["enterprise-sso-providers"],
    queryFn: () => nucleoApi.enterprise.ssoProviders.list({ page: 1, limit: 50 }),
  });

  const createRole = useMutation({
    mutationFn: (payload: { name: string; scope: string; riskLevel: "low" | "medium" | "high" }) =>
      nucleoApi.enterprise.roles.create(payload),
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
    mutationFn: ({ id, riskLevel }: { id: string; riskLevel: "low" | "medium" | "high" }) =>
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
      await queryClient.invalidateQueries({ queryKey: ["enterprise-workflows"] });
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
        queryClient.invalidateQueries({ queryKey: ["enterprise-sso-providers"] }),
      ]);
      toast.success("SSO provider created");
    },
    onError: () => toast.error("Failed to create provider"),
  });

  const updateIdpStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.enterprise.ssoProviders.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enterprise-sso-providers"] });
      toast.success("Provider updated");
    },
  });

  const deleteIdp = useMutation({
    mutationFn: (id: string) => nucleoApi.enterprise.ssoProviders.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["enterprise-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["enterprise-sso-providers"] }),
      ]);
      toast.success("Provider deleted");
    },
  });

  const roles = useMemo(() => rolesQuery.data?.data || [], [rolesQuery.data]);
  const approvals = useMemo(() => workflowsQuery.data?.data || [], [workflowsQuery.data]);
  const auditEvents = useMemo(() => auditQuery.data?.data || [], [auditQuery.data]);
  const identityProviders = useMemo(() => providersQuery.data?.data || [], [providersQuery.data]);
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
          <h1 className="font-bold text-2xl text-foreground">Enterprise Controls</h1>
          <p className="text-muted-foreground">
            RBAC, approvals, audit trails, and identity federation (SSO/SCIM).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsRoleModalOpen(true)}>
            Add Role
          </Button>
          <Button variant="primary" leftIcon={<UserCheck2 className="h-4 w-4" />} onClick={() => setIsApprovalModalOpen(true)}>
            Add Approval Flow
          </Button>
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsIdpModalOpen(true)}>
            Add SSO
          </Button>
        </div>
      </div>

      {isLoadingAny ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Stat title="Custom Roles" value={summary.roles || 0} />
          <Stat title="Approval Flows" value={summary.workflows || 0} />
          <Stat title="Audit Events" value={summary.auditEvents || 0} />
          <Stat title="SSO Providers" value={summary.ssoProviders || 0} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>RBAC Matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role: any) => (
              <div key={role.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{role.name}</p>
                    <p className="text-muted-foreground text-sm">Scope: {role.scope}</p>
                    <p className="text-muted-foreground text-xs">Assigned users: {role.assignedUsers || 0}</p>
                  </div>
                  <Badge variant={role.riskLevel === "high" ? "danger" : role.riskLevel === "medium" ? "warning" : "success"}>
                    {role.riskLevel}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    className="flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={role.riskLevel || "low"}
                    onChange={(e) =>
                      updateRoleRisk.mutate({
                        id: role.id,
                        riskLevel: e.target.value as "low" | "medium" | "high",
                      })
                    }
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteRole.mutate(role.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approvals Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvals.map((approval: any) => (
              <div key={approval.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{approval.title}</p>
                    <p className="text-muted-foreground text-sm">Owner: {approval.ownerTeam} | Stages: {approval.stageCount}</p>
                  </div>
                  <Badge variant={approval.status === "active" ? "success" : "outline"}>{approval.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    className="flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={approval.status || "draft"}
                    onChange={(e) => updateWorkflowStatus.mutate({ id: approval.id, status: e.target.value })}
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteWorkflow.mutate(approval.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
              <div key={event.id} className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground">{event.action}</p>
                <p className="text-muted-foreground text-xs">{event.actor || "system"} | {relativeTime(event.eventTime)}</p>
                <Badge variant={event.severity === "high" ? "danger" : event.severity === "medium" ? "warning" : "outline"}>
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
                    <p className="font-medium text-foreground">{idp.providerName}</p>
                    <p className="text-muted-foreground text-sm">Last sync: {relativeTime(idp.lastSyncAt)}</p>
                  </div>
                  <Badge variant={idp.status === "connected" ? "success" : "outline"}>{idp.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    className="flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={idp.status || "connected"}
                    onChange={(e) => updateIdpStatus.mutate({ id: idp.id, status: e.target.value })}
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
              `/api/enterprise/audit/ingest` and `/api/enterprise/scim/sync` are active for external webhook ingestion.
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
            <Input value={newRole.name} onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))} />
          </FormField>
          <FormField label="Permission Scope" required>
            <Input value={newRole.scope} onChange={(e) => setNewRole((prev) => ({ ...prev, scope: e.target.value }))} />
          </FormField>
          <FormField label="Risk Tier">
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newRole.riskLevel} onChange={(e) => setNewRole((prev) => ({ ...prev, riskLevel: e.target.value as "low" | "medium" | "high" }))}>
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
                setNewApproval({ title: "", ownerTeam: "Finance", stageCount: "2", notes: "" });
                setIsApprovalModalOpen(false);
              },
            },
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Workflow Title" required>
            <Input value={newApproval.title} onChange={(e) => setNewApproval((prev) => ({ ...prev, title: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Owner Team">
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newApproval.ownerTeam} onChange={(e) => setNewApproval((prev) => ({ ...prev, ownerTeam: e.target.value }))}>
                <option value="Finance">Finance</option>
                <option value="Procurement">Procurement</option>
                <option value="Security">Security</option>
                <option value="Legal">Legal</option>
              </select>
            </FormField>
            <FormField label="Stages">
              <Input type="number" min="1" value={newApproval.stageCount} onChange={(e) => setNewApproval((prev) => ({ ...prev, stageCount: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea rows={3} value={newApproval.notes} onChange={(e) => setNewApproval((prev) => ({ ...prev, notes: e.target.value }))} />
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

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            {title.includes("Roles") ? (
              <KeyRound className="h-4 w-4 text-primary" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
