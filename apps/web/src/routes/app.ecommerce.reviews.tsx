/**
 * Product Reviews
 *
 * Moderate and manage product reviews.
 */

import { Badge, Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  Flag,
  ThumbsUp,
  Package,
  Eye,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { ecommerceApi } from "@/lib/api";

export const Route = createFileRoute("/app/ecommerce/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");

  const queryClient = useQueryClient();

  const { data: apiData, isLoading, isError, refetch} = useQuery({
    queryKey: ["ecommerce-reviews", filterStatus],
    queryFn: () => ecommerceApi.reviews.list(),
    placeholderData: (prev) => prev,
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(orgId ? { "x-organization-id": orgId } : {}) };
      const res = await fetch(`/api/ecommerce/reviews/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ id: String(id), status }),
      });
      if (!res.ok) throw new Error("Failed to update review");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-reviews"] }),
  });

  const reviews = (apiData as any)?.data ?? [];

  const filteredReviews = reviews.filter((review: any) => {
    const matchesSearch =
      review.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || review.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
          />
        ))}
      </div>
    );
  };

  const summary = {
    total: reviews.length,
    approved: reviews.filter((r: any) => r.status === "approved").length,
    pending: reviews.filter((r: any) => r.status === "pending").length,
    averageRating: (reviews.reduce((sum: any, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1),
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Product Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Moderate and manage customer reviews
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{summary.averageRating}</p>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Reviews</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review: any) => (
          <Card key={review.id} className={`border-border/60 ${
            review.status === "pending" ? "border-yellow-200" : ""
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{review.author}</span>
                    {renderStars(review.rating)}
                    <Badge variant={review.status === "approved" ? "success" : review.status === "pending" ? "warning" : "default"} size="sm">
                      {review.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{review.title}</p>
                  <p className="text-sm text-muted-foreground mb-2">{review.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Product: {review.product}</span>
                    <span>SKU: {review.sku}</span>
                    <span>{review.date}</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {review.helpful} helpful
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {review.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        leftIcon={<CheckCircle2 className="h-3 w-3" />}
                        onClick={() => updateReviewMutation.mutate({ id: review.id, status: "approved" })}
                        disabled={updateReviewMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        leftIcon={<XCircle className="h-3 w-3" />}
                        onClick={() => updateReviewMutation.mutate({ id: review.id, status: "rejected" })}
                        disabled={updateReviewMutation.isPending}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
