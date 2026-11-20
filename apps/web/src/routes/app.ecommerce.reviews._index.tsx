/**
 * eCommerce Reviews Index
 *
 * Moderate and manage product reviews.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Search,
  Star,
  XCircle,
} from "lucide-react";
import { z } from "zod";
import { ecommerceApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  rating: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/ecommerce/reviews/_index")({
  validateSearch: searchSchema,
  component: ReviewsIndexPage,
});

interface Review {
  id: string;
  productName?: string;
  product?: string | { name?: string; title?: string };
  customerName?: string;
  customer?: string | { name?: string };
  rating?: number;
  stars?: number;
  body?: string;
  text?: string;
  comment?: string;
  date?: string;
  createdAt?: string;
  status?: string;
  isPublished?: boolean;
}

const _MOCK_REVIEWS: Review[] = [
  { id: "R1", productName: '55" 4K Smart TV', customerName: "Michael Torres", rating: 5, body: "Amazing picture quality, exactly what I needed.", date: "Mar 20, 2024", status: "published" },
  { id: "R2", productName: 'Laptop 15" Pro', customerName: "Sarah Chen", rating: 4, body: "Great performance but a bit heavy.", date: "Mar 18, 2024", status: "published" },
  { id: "R3", productName: "Mountain Bike", customerName: "Emily Zhang", rating: 3, body: "Decent bike, took a while to assemble.", date: "Mar 15, 2024", status: "pending" },
  { id: "R4", productName: "Winter Jacket", customerName: "David Park", rating: 2, body: "Not as warm as advertised.", date: "Mar 12, 2024", status: "pending" },
  { id: "R5", productName: "3-Seater Sofa", customerName: "Lisa Wang", rating: 5, body: "Very comfortable and stylish. Highly recommend!", date: "Mar 10, 2024", status: "published" },
  { id: "R6", productName: "Wireless Headphones", customerName: "Robert Kim", rating: 1, body: "Broke after 2 weeks of use.", date: "Mar 8, 2024", status: "rejected" },
];

function getProductName(r: Review) {
  if (r.productName) return r.productName;
  if (typeof r.product === "string") return r.product;
  if (r.product && typeof r.product === "object") return r.product.name ?? r.product.title ?? "Unknown";
  return "Unknown Product";
}
function getCustomerName(r: Review) {
  if (r.customerName) return r.customerName;
  if (typeof r.customer === "string") return r.customer;
  if (r.customer && typeof r.customer === "object") return r.customer.name ?? "Unknown";
  return "Anonymous";
}
function getRating(r: Review) { return r.rating ?? r.stars ?? 0; }
function getText(r: Review) { return r.body ?? r.text ?? r.comment ?? ""; }
function getDate(r: Review) {
  if (r.date) return r.date;
  if (r.createdAt) return new Date(r.createdAt).toLocaleDateString();
  return "—";
}
function getStatus(r: Review) {
  if (r.status) return r.status;
  if (r.isPublished === true) return "published";
  if (r.isPublished === false) return "pending";
  return "pending";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "danger" | "default"> = {
    published: "success",
    pending: "warning",
    rejected: "danger",
  };
  return <Badge variant={map[status] ?? "default"} size="sm">{status}</Badge>;
}

function ReviewsIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", rating: filterRating = "all", status: filterStatus = "all", page = 1 } = useSearch({ from: "/app/ecommerce/reviews/_index" });
  const navigate = useNavigate({ from: "/app/ecommerce/reviews/_index" });

  const searchQuery = q;
  const setSearchQuery = (val: string) => navigate({ search: (prev) => ({ ...prev, q: val }) });
  const setFilterRating = (val: string) => navigate({ search: (prev) => ({ ...prev, rating: val, page: 1 }) });
  const setFilterStatus = (val: string) => navigate({ search: (prev) => ({ ...prev, status: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ecommerce-reviews-index", filterStatus, page],
    queryFn: () =>
      ecommerceApi.reviews.list({
        page,
        limit: PAGE_SIZE,
        ...(filterStatus !== "all" ? { status: filterStatus } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => ecommerceApi.reviews.update(id, { status: "published" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-reviews-index"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => ecommerceApi.reviews.update(id, { status: "rejected" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ecommerce-reviews-index"] }),
  });

  const reviews: Review[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = reviews.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      getProductName(r).toLowerCase().includes(q) ||
      getCustomerName(r).toLowerCase().includes(q) ||
      getText(r).toLowerCase().includes(q);
    const matchRating = filterRating === "all" || getRating(r) === parseInt(filterRating);
    const matchStatus = filterStatus === "all" || getStatus(r) === filterStatus;
    return matchSearch && matchRating && matchStatus;
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + getRating(r), 0) / reviews.length
      : 0;
  const pendingModeration = reviews.filter((r) => getStatus(r) === "pending").length;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load reviews. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Product Reviews</h2>
        <p className="text-sm text-muted-foreground">{reviews.length} total reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-black text-foreground">{avgRating.toFixed(1)}</p>
                  <StarRating rating={Math.round(avgRating)} />
                </div>
              </div>
              <div className="rounded-xl bg-yellow-100 p-2.5 text-yellow-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{reviews.length}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Moderation</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{pendingModeration}</p>
              </div>
              <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search product, customer, text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Reviews List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <Card key={review.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StarRating rating={getRating(review)} />
                      <span className="text-sm font-medium text-foreground">{getProductName(review)}</span>
                      <StatusBadge status={getStatus(review)} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{getText(review)}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{getCustomerName(review)}</span>
                      <span>·</span>
                      <span>{getDate(review)}</span>
                    </div>
                  </div>
                  {getStatus(review) === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(review.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<XCircle className="h-3.5 w-3.5 text-red-600" />}
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(review.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
