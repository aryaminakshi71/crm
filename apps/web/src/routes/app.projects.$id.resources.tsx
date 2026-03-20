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
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/$id/resources")({
  component: ResourcesPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Resource = {
  id: string;
  projectId: string;
  name: string;
  email?: string;
  role: string;
  allocation: number;
  startDate?: string;
  endDate?: string;
  costPerHour?: number;
  avatar?: string;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function ResourcesPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [newResource, setNewResource] = useState({
    name: "",
    email: "",
    role: "",
    allocation: "100",
    startDate: "",
    endDate: "",
    costPerHour: "",
  });

  // Fetch resources
  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ["nucleo-project-resources", id],
    queryFn: () => nucleoApi.projects.resources.list(id),
    enabled: !!id,
  });

  const resources = (resourcesData?.data || []) as Resource[];

  // Calculate totals
  const totalAllocation = resources.reduce((sum, r) => sum + r.allocation, 0);
  const avgAllocation = resources.length > 0 ? totalAllocation / resources.length : 0;
  const overAllocatedCount = resources.filter((r) => r.allocation > 100).length;

  // Cost calculations
  const totalCostPerWeek = resources.reduce(
    (sum, r) => sum + (r.costPerHour || 0) * 40 * r.allocation / 100,
    0
  );

  // Mutations
  const createResourceMut = useMutation({
    mutationFn: (data: any) => nucleoApi.projects.resources.create(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-resources", id] });
      toast.success("Resource added");
      setIsCreateModalOpen(false);
      setNewResource({
        name: "",
        email: "",
        role: "",
        allocation: "100",
        startDate: "",
        endDate: "",
        costPerHour: "",
      });
    },
    onError: () => toast.error("Failed to add resource"),
  });

  const deleteResourceMut = useMutation({
    mutationFn: (resourceId: string) =>
      nucleoApi.projects.resources.delete(id, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-resources", id] });
      toast.success("Resource removed");
      setSelectedResource(null);
    },
    onError: () => toast.error("Failed to remove resource"),
  });

  const handleCreateResource = () => {
    if (!newResource.name.trim() || !newResource.role.trim()) return;
    createResourceMut.mutate({
      name: newResource.name,
      email: newResource.email || undefined,
      role: newResource.role,
      allocation: Number(newResource.allocation) || 100,
      startDate: newResource.startDate
        ? new Date(newResource.startDate).toISOString()
        : undefined,
      endDate: newResource.endDate
        ? new Date(newResource.endDate).toISOString()
        : undefined,
      costPerHour: newResource.costPerHour
        ? Number(newResource.costPerHour)
        : undefined,
    });
  };

  // Get allocation color
  const getAllocationColor = (allocation: number) => {
    if (allocation > 100) return "text-destructive";
    if (allocation > 80) return "text-warning";
    return "text-success";
  };

  const getAllocationBgColor = (allocation: number) => {
    if (allocation > 100) return "bg-destructive";
    if (allocation > 80) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Resources</h2>
          <p className="text-muted-foreground text-sm">
            Manage team allocation and assignments
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add Resource
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resources.length}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <User className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgAllocation.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Avg Allocation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={overAllocatedCount > 0 ? "border-warning/30 bg-warning/5" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                overAllocatedCount > 0 ? "bg-warning/10" : "bg-muted"
              }`}>
                <AlertTriangle className={`h-5 w-5 ${overAllocatedCount > 0 ? "text-warning" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{overAllocatedCount}</p>
                <p className="text-xs text-muted-foreground">Over-allocated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalCostPerWeek.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Cost/Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource List */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading resources...
        </div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No resources assigned</p>
            <p className="text-muted-foreground text-sm mt-1">
              Add team members to track their allocation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className={`hover:border-primary/40 transition-colors ${
                resource.allocation > 100 ? "border-destructive/30" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                    {resource.avatar ? (
                      <img
                        src={resource.avatar}
                        alt={resource.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      resource.name.charAt(0)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{resource.name}</p>
                    <p className="text-sm text-muted-foreground">{resource.role}</p>
                    {resource.email && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {resource.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Allocation */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Allocation</span>
                    <span className={`font-bold ${getAllocationColor(resource.allocation)}`}>
                      {resource.allocation}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getAllocationBgColor(resource.allocation)} transition-all`}
                      style={{ width: `${Math.min(100, resource.allocation)}%` }}
                    />
                  </div>
                  {resource.allocation > 100 && (
                    <p className="text-[10px] text-destructive mt-1">
                      Over-allocated by {resource.allocation - 100}%
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  {resource.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(resource.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {resource.costPerHour && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${resource.costPerHour}/hr
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedResource(resource)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteResourceMut.mutate(resource.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Allocation Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Allocation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center gap-4">
                <div className="w-32 truncate text-sm">
                  {resource.name}
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-muted rounded-md overflow-hidden relative">
                    <div
                      className={`h-full transition-all ${
                        resource.allocation > 100
                          ? "bg-destructive"
                          : resource.allocation > 80
                            ? "bg-warning"
                            : "bg-success"
                      }`}
                      style={{ width: `${Math.min(100, resource.allocation)}%` }}
                    />
                    {resource.allocation > 100 && (
                      <div
                        className="absolute top-0 h-full bg-destructive/50"
                        style={{
                          left: "100%",
                          width: `${Math.min(50, resource.allocation - 100)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="w-12 text-right text-sm font-medium">
                  {resource.allocation}%
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-success" />
              <span>Under 80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-warning" />
              <span>80-100%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-destructive" />
              <span>Over 100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Resource"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateResource();
        }}
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <Input
              value={newResource.name}
              onChange={(e) =>
                setNewResource((r) => ({ ...r, name: e.target.value }))
              }
              placeholder="Enter name..."
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={newResource.email}
              onChange={(e) =>
                setNewResource((r) => ({ ...r, email: e.target.value }))
              }
              placeholder="Enter email..."
            />
          </FormField>
          <FormField label="Role" required>
            <Input
              value={newResource.role}
              onChange={(e) =>
                setNewResource((r) => ({ ...r, role: e.target.value }))
              }
              placeholder="e.g., Developer, Designer..."
            />
          </FormField>
          <FormField label="Allocation %">
            <Input
              type="number"
              min="0"
              max="200"
              value={newResource.allocation}
              onChange={(e) =>
                setNewResource((r) => ({ ...r, allocation: e.target.value }))
              }
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input
                type="date"
                value={newResource.startDate}
                onChange={(e) =>
                  setNewResource((r) => ({ ...r, startDate: e.target.value }))
                }
              />
            </FormField>
            <FormField label="End Date">
              <Input
                type="date"
                value={newResource.endDate}
                onChange={(e) =>
                  setNewResource((r) => ({ ...r, endDate: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Cost per Hour">
            <Input
              type="number"
              min="0"
              value={newResource.costPerHour}
              onChange={(e) =>
                setNewResource((r) => ({ ...r, costPerHour: e.target.value }))
              }
              placeholder="$0.00"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
