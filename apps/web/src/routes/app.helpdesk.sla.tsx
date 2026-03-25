import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/sla")({
  component: SlaPage,
});

function SlaPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    firstResponseHours: 4,
    resolutionHours: 24,
    businessHoursOnly: false,
    isDefault: false,
  });
  const queryClient = useQueryClient();

  const { data: policiesData, isLoading, refetch, isError} = useQuery({
    queryKey: ["helpdesk", "sla"],
    queryFn: () => helpdeskApi.sla.list({ page: 1, limit: 50 }),
    retry: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ["helpdesk", "stats"],
    queryFn: () => helpdeskApi.stats(),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => helpdeskApi.sla.create(data),
    onSuccess: () => {
      toast.success("SLA policy created");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "sla"] });
      setIsCreateOpen(false);
      setForm({
        name: "",
        priority: "medium",
        firstResponseHours: 4,
        resolutionHours: 24,
        businessHoursOnly: false,
        isDefault: false,
      });
    },
    onError: () => toast.error("Failed to create SLA policy"),
  });

  if (isLoading) return <Loading text="Loading SLA policies..." />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const policies: any[] = policiesData?.data ?? [];
  const stats = statsData ?? null;

  const overallCompliance =
    stats?.slaBreached != null && stats?.open != null
      ? Math.max(
          0,
          Math.round(
            ((stats.open + stats.pending + stats.resolved - stats.slaBreached) /
              Math.max(1, stats.open + stats.pending + stats.resolved)) *
              100,
          ),
        )
      : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">SLA Policies</h1>
          <p className="text-muted-foreground">
            Service level agreement targets by ticket priority.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Policy
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Overall Compliance
              </p>
              <p className="text-3xl font-black text-emerald-400 mt-1">
                {overallCompliance}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                based on open + pending + resolved tickets
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                SLA Breached
              </p>
              <p className="text-3xl font-black text-destructive mt-1">
                {stats.slaBreached ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                tickets past SLA target
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Avg First Response
              </p>
              <p className="text-3xl font-black text-foreground mt-1">
                {stats.avgResponseTimeHours ?? 0}h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                average across all tickets
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {policies.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-12 w-12" />}
          title="No SLA policies yet"
          description="Create SLA policies to set response and resolution time targets by priority."
          action={<Button onClick={() => setIsCreateOpen(true)}>Create Policy</Button>}
        />
      ) : (
        <div className="space-y-4">
          {policies.map((policy: any) => (
            <Card key={policy.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{policy.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">
                      Priority: {policy.priority}
                      {policy.businessHoursOnly
                        ? " · Business hours only"
                        : " · 24/7"}
                      {policy.isDefault && " · Default"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      policy.priority === "urgent" || policy.priority === "high"
                        ? "danger"
                        : policy.priority === "medium"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {policy.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      First Response
                    </p>
                    <p className="font-semibold text-foreground">
                      {policy.firstResponseHours}h target
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resolution</p>
                    <p className="font-semibold text-foreground">
                      {policy.resolutionHours}h target
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About SLA Policies</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            SLA targets are calculated based on ticket priority. Tickets are
            considered breached when they exceed the resolution target while
            still open.
          </p>
          <p>
            Business hours only policies only count time during configured
            working hours when calculating SLA compliance.
          </p>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create SLA Policy"
        submitText="Create Policy"
        loading={createMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim()) {
            toast.error("Policy name is required");
            return;
          }
          createMutation.mutate(form);
        }}
      >
        <div className="space-y-4">
          <FormField label="Policy Name" required>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Critical Response"
            />
          </FormField>
          <FormField label="Priority">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={form.priority}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  priority: e.target.value as typeof form.priority,
                }))
              }
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
                min={1}
                value={form.firstResponseHours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    firstResponseHours: Number(e.target.value),
                  }))
                }
              />
            </FormField>
            <FormField label="Resolution (hours)">
              <Input
                type="number"
                min={1}
                value={form.resolutionHours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    resolutionHours: Number(e.target.value),
                  }))
                }
              />
            </FormField>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="business-hours"
                checked={form.businessHoursOnly}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    businessHoursOnly: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <label
                htmlFor="business-hours"
                className="text-sm text-foreground cursor-pointer"
              >
                Business hours only
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-default"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isDefault: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <label
                htmlFor="is-default"
                className="text-sm text-foreground cursor-pointer"
              >
                Set as default
              </label>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
