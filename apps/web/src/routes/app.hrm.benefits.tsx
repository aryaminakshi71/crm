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
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Briefcase,
  CheckCircle2,
  DollarSign,
  GraduationCap,
  Heart,
  Plus,
  Shield,
  Smile,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/hrm/benefits")({
  component: HrmBenefitsPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type BenefitType =
  | "health"
  | "dental"
  | "vision"
  | "retirement"
  | "wellness"
  | "education"
  | "other";

interface Benefit {
  id: string;
  name: string;
  type: BenefitType;
  description: string;
  cost: number;
  enrolledCount?: number;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const typeIcon: Record<BenefitType, React.ReactNode> = {
  health: <Heart className="h-5 w-5 text-red-500" />,
  dental: <Smile className="h-5 w-5 text-blue-500" />,
  vision: <Activity className="h-5 w-5 text-purple-500" />,
  retirement: <DollarSign className="h-5 w-5 text-green-500" />,
  wellness: <Zap className="h-5 w-5 text-yellow-500" />,
  education: <GraduationCap className="h-5 w-5 text-indigo-500" />,
  other: <Briefcase className="h-5 w-5 text-gray-500" />,
};

const DEMO_BENEFITS: Benefit[] = [
  {
    id: "1",
    name: "Comprehensive Health Insurance",
    type: "health",
    description:
      "Full medical, hospitalization, and specialist coverage for employees and dependents.",
    cost: 450,
    enrolledCount: 142,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Dental & Orthodontic Plan",
    type: "dental",
    description: "Covers routine cleanings, fillings, and orthodontic treatment.",
    cost: 80,
    enrolledCount: 118,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Vision Care",
    type: "vision",
    description: "Annual eye exams, prescription glasses, and contact lenses.",
    cost: 30,
    enrolledCount: 95,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "401(k) Retirement Plan",
    type: "retirement",
    description:
      "Company matches up to 4% of salary contributions. Vesting after 2 years.",
    cost: 0,
    enrolledCount: 178,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Wellness Stipend",
    type: "wellness",
    description:
      "$100/month toward gym memberships, fitness apps, or mental health services.",
    cost: 100,
    enrolledCount: 73,
    createdAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Learning & Development Budget",
    type: "education",
    description:
      "$2,000/year for courses, certifications, conferences, and books.",
    cost: 167,
    enrolledCount: 56,
    createdAt: "2025-06-01T00:00:00Z",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

function HrmBenefitsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "health" as BenefitType,
    description: "",
    cost: "",
  });

  // ── Data ─────────────────────────────────────────────────────────────────

  const { data: benefits = [], isLoading } = useQuery<Benefit[]>({
    queryKey: ["hrm", "benefits"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/hrm/benefits`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch benefits");
      const json = await res.json();
      return (json as any).data ?? json;
    },
    placeholderData: DEMO_BENEFITS,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createBenefitMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/hrm/benefits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm", "benefits"] });
      toast.success("Benefit plan added successfully");
      setShowCreate(false);
      setForm({ name: "", type: "health", description: "", cost: "" });
    },
    onError: () => {
      toast.error("Failed to create benefit plan");
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/hrm/benefits/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm", "benefits"] });
      toast.success("Enrolled in benefit successfully");
    },
    onError: () => {
      toast.error("Failed to enroll in benefit");
    },
  });

  const deleteBenefitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/hrm/benefits/${id}`, {
        method: "DELETE",
        headers: getOrgHeader(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm", "benefits"] });
      toast.success("Benefit plan removed");
    },
    onError: () => {
      toast.error("Failed to remove benefit plan");
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleCreateSubmit() {
    createBenefitMutation.mutate({
      name: form.name.trim() || "New Benefit",
      type: form.type,
      description: form.description.trim(),
      cost: Number(form.cost) || 0,
    });
  }

  // ── Summary stats ─────────────────────────────────────────────────────────

  const totalEnrolled = benefits.reduce(
    (s, b) => s + (b.enrolledCount ?? 0),
    0,
  );
  const totalMonthlyCost = benefits.reduce((s, b) => s + (b.cost ?? 0), 0);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Benefits & Perks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee benefit plans and enrollment
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={createBenefitMutation.isPending}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Benefit
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Plans",
            value: String(benefits.length),
            icon: <Shield className="h-5 w-5 text-blue-500" />,
          },
          {
            label: "Total Enrolled",
            value: String(totalEnrolled),
            icon: <Users className="h-5 w-5 text-green-500" />,
          },
          {
            label: "Monthly Cost / Employee",
            value: `$${totalMonthlyCost.toLocaleString()}`,
            icon: <DollarSign className="h-5 w-5 text-purple-500" />,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benefits list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Benefit Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : benefits.length === 0 ? (
            <EmptyState
              icon={<Shield className="h-8 w-8 text-gray-400" />}
              title="No benefit plans yet"
              description="Add your first benefit plan to get started"
              action={
                <Button
                  onClick={() => setShowCreate(true)}
                  disabled={createBenefitMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Benefit
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex flex-col gap-3 p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {typeIcon[benefit.type]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {benefit.name}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          {benefit.type}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteBenefitMutation.mutate(benefit.id)}
                      disabled={deleteBenefitMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    {benefit.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        {benefit.cost === 0
                          ? "Free"
                          : `$${benefit.cost}/mo`}
                      </span>
                      {benefit.enrolledCount != null && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {benefit.enrolledCount} enrolled
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => enrollMutation.mutate(benefit.id)}
                      disabled={enrollMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Enroll
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Benefit Modal */}
      {showCreate && (
        <FormModal
          isOpen={showCreate}
          title="Add Benefit Plan"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSubmit}
          isLoading={createBenefitMutation.isPending}
          submitText="Add Benefit"
        >
          <FormField label="Benefit Name" required>
            <Input
              placeholder="e.g. Comprehensive Health Insurance"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </FormField>
          <FormField label="Type">
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as BenefitType }))
              }
            >
              <option value="health">Health</option>
              <option value="dental">Dental</option>
              <option value="vision">Vision</option>
              <option value="retirement">Retirement</option>
              <option value="wellness">Wellness</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Description">
            <Textarea
              placeholder="Describe what this benefit covers..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
          </FormField>
          <FormField label="Monthly Cost per Employee ($)">
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            />
          </FormField>
        </FormModal>
      )}
    </div>
  );
}
