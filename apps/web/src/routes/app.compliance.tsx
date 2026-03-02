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
import { CheckCircle2, Plus, ShieldCheck, ShieldX, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

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

  const risksQuery = useQuery({
    queryKey: ["ops-compliance-risks"],
    queryFn: () => nucleoApi.operations.complianceRisks.list({ page: 1, limit: 200 }),
  });

  const createControl = useMutation({
    mutationFn: (payload: any) =>
      nucleoApi.operations.complianceControls.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-controls"] });
      toast.success("Control added");
      setIsControlModalOpen(false);
      setNewControl({ framework: "SOC2", control: "", owner: "Security", evidenceDue: "" });
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
    mutationFn: (id: string) => nucleoApi.operations.complianceControls.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-controls"] });
      toast.success("Control deleted");
    },
    onError: () => toast.error("Failed to delete control"),
  });

  const createRisk = useMutation({
    mutationFn: (payload: any) => nucleoApi.operations.complianceRisks.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-risks"] });
      toast.success("Risk logged");
      setIsRiskModalOpen(false);
      setNewRisk({ title: "", severity: "medium", owner: "Security", mitigation: "" });
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

  const controls = useMemo(() => controlsQuery.data?.data || [], [controlsQuery.data]);
  const risks = useMemo(() => risksQuery.data?.data || [], [risksQuery.data]);

  const implemented = controls.filter((control: any) => control.status === "implemented").length;
  const inProgress = controls.filter((control: any) => control.status === "in_progress").length;
  const openHighRisks = risks.filter((risk: any) => risk.severity === "high" && risk.status !== "closed").length;

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
          <h1 className="font-bold text-2xl text-foreground">Policy & Compliance Center</h1>
          <p className="text-muted-foreground">
            SOC2 and ISO control tracking, evidence pipeline, and risk register.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsControlModalOpen(true)}>
            Add Control
          </Button>
          <Button variant="primary" leftIcon={<TriangleAlert className="h-4 w-4" />} onClick={() => setIsRiskModalOpen(true)}>
            Log Risk
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Tile title="Compliance Score" value={`${complianceScore}%`} icon={<ShieldCheck className="h-4 w-4 text-primary" />} />
        <Tile title="Implemented Controls" value={implemented} icon={<CheckCircle2 className="h-4 w-4 text-success" />} />
        <Tile title="In Progress Controls" value={inProgress} icon={<ShieldX className="h-4 w-4 text-warning" />} />
        <Tile title="High Risks" value={openHighRisks} icon={<TriangleAlert className="h-4 w-4 text-destructive" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Control Implementation Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {controls.map((control: any) => (
              <div key={control.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{control.control}</p>
                    <p className="text-muted-foreground text-sm">
                      {control.framework} | Owner: {control.owner} | Evidence Due: {control.evidenceDue ? new Date(control.evidenceDue).toLocaleDateString() : "-"}
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
              <div key={risk.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{risk.title}</p>
                    <p className="text-muted-foreground text-sm">Owner: {risk.owner}</p>
                    <p className="mt-1 text-muted-foreground text-xs">{risk.mitigation || "Mitigation pending"}</p>
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
            <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newControl.framework} onChange={(e) => setNewControl((prev) => ({ ...prev, framework: e.target.value }))}>
              <option value="SOC2">SOC2</option>
              <option value="ISO27001">ISO27001</option>
              <option value="GDPR">GDPR</option>
            </select>
          </FormField>
          <FormField label="Control" required>
            <Input value={newControl.control} onChange={(e) => setNewControl((prev) => ({ ...prev, control: e.target.value }))} />
          </FormField>
          <FormField label="Owner">
            <Input value={newControl.owner} onChange={(e) => setNewControl((prev) => ({ ...prev, owner: e.target.value }))} />
          </FormField>
          <FormField label="Evidence Due Date">
            <Input type="date" value={newControl.evidenceDue} onChange={(e) => setNewControl((prev) => ({ ...prev, evidenceDue: e.target.value }))} />
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
            <Input value={newRisk.title} onChange={(e) => setNewRisk((prev) => ({ ...prev, title: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Severity">
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newRisk.severity} onChange={(e) => setNewRisk((prev) => ({ ...prev, severity: e.target.value }))}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </FormField>
            <FormField label="Owner">
              <Input value={newRisk.owner} onChange={(e) => setNewRisk((prev) => ({ ...prev, owner: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Mitigation Plan">
            <Textarea rows={3} value={newRisk.mitigation} onChange={(e) => setNewRisk((prev) => ({ ...prev, mitigation: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function Tile({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="font-bold text-2xl text-foreground">{value}</p>
          </div>
          <div className="rounded-md bg-muted p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
