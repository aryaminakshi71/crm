/**
 * Deals Route
 *
 * Deal pipeline with kanban view.
 */

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
  Textarea,
  cn,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar, DollarSign, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { dealsApi } from "../lib/api";

export const Route = createFileRoute("/app/deals")({
  component: DealsPage,
});

const DEAL_STAGES = [
  { key: "lead", label: "Lead", color: "bg-muted" },
  { key: "qualified", label: "Qualified", color: "bg-primary/10" },
  { key: "proposal", label: "Proposal", color: "bg-warning/15" },
  { key: "negotiation", label: "Negotiation", color: "bg-warning/15" },
  { key: "won", label: "Won", color: "bg-success/15" },
  { key: "lost", label: "Lost", color: "bg-destructive/10" },
];

function DealsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    stage: "lead",
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: () => dealsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newDeal) => {
      // Validate required fields
      if (!data.name.trim()) {
        throw new Error("Deal name is required");
      }
      const value = parseFloat(data.value);
      if (isNaN(value) || value <= 0) {
        throw new Error("Deal value must be a positive number");
      }
      return dealsApi.create({
        name: data.name.trim(),
        value: value,
        stage: data.stage,
        notes: data.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Deal created successfully");
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setIsModalOpen(false);
      setNewDeal({ name: "", value: "", stage: "lead", notes: "" });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to create deal";
      toast.error(errorMessage);
      console.error("Deal creation error:", error);
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      dealsApi.updateStage(id, stage),
    onSuccess: () => {
      toast.success("Deal stage updated");
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  const deals = data?.data || [];

  // Pagination
  const totalPages = Math.ceil(deals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeals = deals.slice(startIndex, endIndex);

  // Group deals by stage
  const dealsByStage = DEAL_STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = deals.filter((d: any) => d.stage === stage.key);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  // Calculate totals
  const totalValue = deals.reduce(
    (sum: number, d: any) => sum + Number(d.value || 0),
    0,
  );
  const wonValue = deals
    .filter((d: any) => d.stage === "won")
    .reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);

  if (isLoading) {
    return <Loading text="Loading deals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Deal
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Pipeline</p>
                <p className="font-bold text-foreground text-xl">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Closed Won</p>
                <p className="font-bold text-foreground text-xl">
                  ${wonValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Deals</p>
                <p className="font-bold text-foreground text-xl">
                  {deals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      {deals.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="No deals yet"
          description="Start your pipeline by creating your first deal."
          action={{ label: "Create Deal", onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage.key] || [];
            const stageValue = stageDeals.reduce(
              (sum: number, d: any) => sum + Number(d.value || 0),
              0,
            );
            return (
              <div key={stage.key} className="w-72 flex-shrink-0">
                <div className={cn("rounded-t-lg px-3 py-2", stage.color)}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {stage.label}
                    </span>
                    <Badge variant="outline">{stageDeals.length}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    ${stageValue.toLocaleString()}
                  </p>
                </div>
                <div className="min-h-[400px] space-y-2 rounded-b-lg bg-muted p-2">
                  {stageDeals.map((deal: any) => (
                    <Card key={deal.id} hover className="p-3">
                      <p className="font-medium text-foreground">{deal.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold text-sm text-success">
                          ${Number(deal.value).toLocaleString()}
                        </span>
                        <select
                          className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                          value={deal.stage}
                          onChange={(e) =>
                            updateStageMutation.mutate({
                              id: deal.id,
                              stage: e.target.value,
                            })
                          }
                        >
                          {DEAL_STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Deal Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(newDeal);
        }}
        title="Create New Deal"
        submitText="Create Deal"
        loading={createMutation.isPending}
      >
        <div className="space-y-4">
          <FormField label="Deal Name" required>
            <Input
              value={newDeal.name}
              onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Value ($)" required>
            <Input
              type="number"
              value={newDeal.value}
              onChange={(e) =>
                setNewDeal({ ...newDeal, value: e.target.value })
              }
              required
            />
          </FormField>
          <FormField label="Stage">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newDeal.stage}
              onChange={(e) =>
                setNewDeal({ ...newDeal, stage: e.target.value })
              }
            >
              {DEAL_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes">
            <Textarea
              value={newDeal.notes}
              onChange={(e) =>
                setNewDeal({ ...newDeal, notes: e.target.value })
              }
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
