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
import { CalendarClock, FileSignature, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/contracts")({
  component: ContractsPage,
});

function ContractsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [newContract, setNewContract] = useState({
    title: "",
    counterparty: "",
    ownerTeam: "Legal",
    status: "draft",
    renewalDate: "",
    complianceNotes: "",
  });

  const contractsQuery = useQuery({
    queryKey: ["ops-contracts"],
    queryFn: () => nucleoApi.operations.contracts.list({ page: 1, limit: 200 }),
  });

  const createContract = useMutation({
    mutationFn: (payload: any) => nucleoApi.operations.contracts.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ops-contracts"] });
      toast.success("Contract added to lifecycle workflow");
      setIsModalOpen(false);
      setNewContract({
        title: "",
        counterparty: "",
        ownerTeam: "Legal",
        status: "draft",
        renewalDate: "",
        complianceNotes: "",
      });
    },
    onError: () => toast.error("Failed to create contract"),
  });

  const updateContract = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.operations.contracts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-contracts"] });
      toast.success("Contract updated");
    },
    onError: () => toast.error("Failed to update contract"),
  });

  const deleteContract = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.contracts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-contracts"] });
      toast.success("Contract deleted");
    },
    onError: () => toast.error("Failed to delete contract"),
  });

  const contracts = useMemo(() => contractsQuery.data?.data || [], [contractsQuery.data]);

  const filteredContracts = useMemo(() => {
    if (statusFilter === "all") return contracts;
    return contracts.filter((contract: any) => contract.status === statusFilter);
  }, [contracts, statusFilter]);

  const renewalSoon = contracts.filter((contract: any) => {
    if (!contract.renewalDate) return false;
    const diff = new Date(contract.renewalDate).getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 90;
  }).length;

  const activeContracts = contracts.filter((contract: any) => contract.status === "active").length;
  const reviewQueue = contracts.filter((contract: any) => contract.status === "review").length;

  if (contractsQuery.isLoading) {
    return <Loading text="Loading contract lifecycle..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Contract Lifecycle</h1>
          <p className="text-muted-foreground">
            Manage draft, review, activation, renewals, and legal/compliance controls.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
          New Contract
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat title="Active Contracts" value={activeContracts} icon={<FileSignature className="h-4 w-4 text-success" />} />
        <Stat title="Review Queue" value={reviewQueue} icon={<ShieldAlert className="h-4 w-4 text-warning" />} />
        <Stat title="Renewals in 90 Days" value={renewalSoon} icon={<CalendarClock className="h-4 w-4 text-primary" />} />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="active">Active</option>
          <option value="renewal">Renewal</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredContracts.map((contract: any) => (
              <div key={contract.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{contract.title}</p>
                    <p className="text-muted-foreground text-sm">
                      Counterparty: {contract.counterparty} | Owner: {contract.ownerTeam}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Renewal: {contract.renewalDate ? new Date(contract.renewalDate).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        contract.status === "active"
                          ? "success"
                          : contract.status === "review"
                            ? "warning"
                            : contract.status === "expired"
                              ? "danger"
                              : "outline"
                      }
                    >
                      {contract.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                        value={contract.status}
                        onChange={(e) => {
                          updateContract.mutate({
                            id: contract.id,
                            data: { status: e.target.value },
                          });
                        }}
                      >
                        <option value="draft">draft</option>
                        <option value="review">review</option>
                        <option value="active">active</option>
                        <option value="renewal">renewal</option>
                        <option value="expired">expired</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteContract.mutate(contract.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
                {contract.complianceNotes ? (
                  <p className="mt-2 text-muted-foreground text-xs">
                    Compliance: {contract.complianceNotes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Contract"
        submitText="Create Contract"
        loading={createContract.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newContract.title.trim() || !newContract.counterparty.trim()) {
            toast.error("Title and counterparty are required");
            return;
          }

          createContract.mutate({
            title: newContract.title.trim(),
            counterparty: newContract.counterparty.trim(),
            ownerTeam: newContract.ownerTeam,
            status: newContract.status,
            renewalDate: newContract.renewalDate
              ? new Date(newContract.renewalDate).toISOString()
              : undefined,
            complianceNotes: newContract.complianceNotes.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Contract Title" required>
            <Input value={newContract.title} onChange={(e) => setNewContract((prev) => ({ ...prev, title: e.target.value }))} />
          </FormField>
          <FormField label="Counterparty" required>
            <Input value={newContract.counterparty} onChange={(e) => setNewContract((prev) => ({ ...prev, counterparty: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Owner Team">
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newContract.ownerTeam} onChange={(e) => setNewContract((prev) => ({ ...prev, ownerTeam: e.target.value }))}>
                <option value="Legal">Legal</option>
                <option value="Procurement">Procurement</option>
                <option value="Finance">Finance</option>
                <option value="Security">Security</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" value={newContract.status} onChange={(e) => setNewContract((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="draft">draft</option>
                <option value="review">review</option>
                <option value="active">active</option>
                <option value="renewal">renewal</option>
              </select>
            </FormField>
          </div>
          <FormField label="Renewal Date">
            <Input type="date" value={newContract.renewalDate} onChange={(e) => setNewContract((prev) => ({ ...prev, renewalDate: e.target.value }))} />
          </FormField>
          <FormField label="Compliance Notes">
            <Textarea rows={3} value={newContract.complianceNotes} onChange={(e) => setNewContract((prev) => ({ ...prev, complianceNotes: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: number | string; icon: ReactNode }) {
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
