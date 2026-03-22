/**
 * HRM Performance Route
 *
 * Performance reviews, 360 feedback, and competency tracking.
 * Data is fetched from the API with mock fallbacks.
 */

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
  LoadingSkeleton,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Plus,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/hrm/performance")({
  component: HrmPerformancePage,
});

// ─── Mock fallbacks ──────────────────────────────────────────────────────────

const MOCK_REVIEWS = [
  {
    id: "mock-1",
    employee: "Alice Chen",
    employeeId: null,
    reviewCycle: "Q1 2025",
    rating: "exceeds_expectations",
    goalsProgress: 92,
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-2",
    employee: "Bob Martinez",
    employeeId: null,
    reviewCycle: "Q1 2025",
    rating: "meets_expectations",
    goalsProgress: 74,
    status: "in_review",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-3",
    employee: "Carol Singh",
    employeeId: null,
    reviewCycle: "Q1 2025",
    rating: "not_rated",
    goalsProgress: 0,
    status: "draft",
    createdAt: new Date().toISOString(),
  },
];

const MOCK_FEEDBACK360 = [
  {
    id: "fb-1",
    subject: "Alice Chen",
    reviewer: "Team Lead",
    score: 4.5,
    comment: "Excellent collaboration and delivery.",
  },
  {
    id: "fb-2",
    subject: "Bob Martinez",
    reviewer: "Peer",
    score: 3.8,
    comment: "Good technical skills, growing in leadership.",
  },
];

const MOCK_COMPETENCIES = [
  { name: "Leadership", score: 78, max: 100 },
  { name: "Technical Skills", score: 85, max: 100 },
  { name: "Communication", score: 72, max: 100 },
  { name: "Problem Solving", score: 90, max: 100 },
  { name: "Collaboration", score: 88, max: 100 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RATING_LABEL: Record<string, string> = {
  exceeds_expectations: "Exceeds",
  meets_expectations: "Meets",
  below_expectations: "Below",
  not_rated: "Not Rated",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "outline" | "warning" | "success" | "destructive"
> = {
  completed: "success",
  in_review: "warning",
  draft: "outline",
};

function formatDate(value: unknown): string {
  if (!value) return "-";
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────

function HrmPerformancePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    employeeId: "",
    reviewCycle: "",
    rating: "not_rated",
    goalsProgress: "0",
    summary: "",
  });

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["hrm-reviews"],
    queryFn: () => nucleoApi.hrm.reviews.list({ page: 1, limit: 100 }),
  });

  const reviews: any[] = reviewsData?.data ?? MOCK_REVIEWS;

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createReview = useMutation({
    mutationFn: (payload: {
      employeeId: string;
      reviewCycle: string;
      rating?: string;
      goalsProgress?: number;
      summary?: string;
    }) =>
      nucleoApi.hrm.reviews.create({
        ...payload,
        status: "draft",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hrm-reviews"] });
      setIsModalOpen(false);
      setNewReview({
        employeeId: "",
        reviewCycle: "",
        rating: "not_rated",
        goalsProgress: "0",
        summary: "",
      });
      toast.success("Review created");
    },
    onError: () => toast.error("Failed to create review"),
  });

  const completeReview = useMutation({
    mutationFn: (id: string) =>
      nucleoApi.hrm.reviews.update(id, { status: "completed" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hrm-reviews"] });
      toast.success("Review marked as completed");
    },
    onError: () => toast.error("Failed to complete review"),
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.reviews.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hrm-reviews"] });
      toast.success("Review deleted");
    },
    onError: () => toast.error("Failed to delete review"),
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const completedCount = reviews.filter((r) => r.status === "completed").length;
  const inReviewCount = reviews.filter((r) => r.status === "in_review").length;
  const avgProgress =
    reviews.length > 0
      ? Math.round(
          reviews.reduce((acc, r) => acc + Number(r.goalsProgress || 0), 0) /
            reviews.length,
        )
      : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateReview = () => {
    if (!newReview.reviewCycle.trim()) {
      toast.error("Review cycle is required");
      return;
    }
    createReview.mutate({
      employeeId: newReview.employeeId || "00000000-0000-0000-0000-000000000000",
      reviewCycle: newReview.reviewCycle,
      rating: newReview.rating,
      goalsProgress: Number(newReview.goalsProgress),
      summary: newReview.summary || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Performance Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Track employee reviews, ratings, and goal progress
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Review
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Users className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inReviewCount}</p>
                <p className="text-sm text-muted-foreground">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgProgress}%</p>
                <p className="text-sm text-muted-foreground">
                  Avg Goal Progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<Star className="w-8 h-8" />}
              title="No reviews yet"
              description="Create the first performance review to get started."
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {review.employee || "Unknown Employee"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cycle: {review.reviewCycle} &nbsp;·&nbsp; Rating:{" "}
                      {RATING_LABEL[review.rating] ?? review.rating}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Goals progress: {Number(review.goalsProgress || 0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={STATUS_VARIANT[review.status] ?? "outline"}
                    >
                      {review.status}
                    </Badge>
                    {review.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completeReview.mutate(review.id)}
                        disabled={completeReview.isPending}
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteReview.mutate(review.id)}
                      disabled={deleteReview.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 360 Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">360° Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_FEEDBACK360.map((fb) => (
              <div
                key={fb.id}
                className="flex items-start justify-between p-4 rounded-lg border border-border"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{fb.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Reviewer: {fb.reviewer}
                  </p>
                  <p className="text-xs text-muted-foreground">{fb.comment}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{fb.score}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competencies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Competency Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_COMPETENCIES.map((comp) => (
              <div key={comp.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{comp.name}</span>
                  <span className="text-muted-foreground">
                    {comp.score}/{comp.max}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(comp.score / comp.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Review Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Performance Review"
        onSubmit={handleCreateReview}
        isSubmitting={createReview.isPending}
      >
        <FormField label="Review Cycle" required>
          <Input
            placeholder="e.g. Q2 2025"
            value={newReview.reviewCycle}
            onChange={(e) =>
              setNewReview((prev) => ({
                ...prev,
                reviewCycle: e.target.value,
              }))
            }
          />
        </FormField>
        <FormField label="Goals Progress (%)">
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={newReview.goalsProgress}
            onChange={(e) =>
              setNewReview((prev) => ({
                ...prev,
                goalsProgress: e.target.value,
              }))
            }
          />
        </FormField>
        <FormField label="Summary">
          <Input
            placeholder="Brief summary..."
            value={newReview.summary}
            onChange={(e) =>
              setNewReview((prev) => ({ ...prev, summary: e.target.value }))
            }
          />
        </FormField>
      </FormModal>
    </div>
  );
}
