import {Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Star,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/surveys")({
  component: SurveysPage,
});

function SurveysPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ ticketId: "", rating: 5, comment: "" });

  const { data: surveyData, isLoading, refetch, isError} = useQuery({
    queryKey: ["helpdesk", "surveys"],
    queryFn: () => helpdeskApi.surveys.list({ page: 1, limit: 200 }),
    retry: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ["helpdesk", "stats"],
    queryFn: () => helpdeskApi.stats(),
    retry: false,
  });

  const createSurveyMutation = useMutation({
    mutationFn: (data: { ticketId?: string; rating: number; comment?: string }) =>
      helpdeskApi.surveys.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "surveys"] });
      toast.success("Survey response recorded");
      setIsModalOpen(false);
      setForm({ ticketId: "", rating: 5, comment: "" });
    },
    onError: () => toast.error("Failed to record survey response"),
  });

  if (isLoading) return <Loading text="Loading surveys..." />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const surveys: any[] = surveyData?.data ?? [];
  const stats = statsData ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Customer Satisfaction
          </h1>
          <p className="text-muted-foreground">
            CSAT survey results and satisfaction trends.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Survey
        </Button>
      </div>

      {/* New Survey Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border border-border p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Record Survey Response</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ticket ID (optional)</label>
                <Input
                  className="mt-1"
                  placeholder="Ticket ID"
                  value={form.ticketId}
                  onChange={(e) => setForm((f) => ({ ...f, ticketId: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rating (1–5) *</label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: r }))}
                      className={`text-warning transition-colors ${r <= form.rating ? "opacity-100" : "opacity-30"}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                  <span className="text-sm font-medium ml-1">{form.rating}/5</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comment</label>
                <Input
                  className="mt-1"
                  placeholder="Customer comment or feedback"
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={createSurveyMutation.isPending}
                onClick={() =>
                  createSurveyMutation.mutate({
                    ticketId: form.ticketId || undefined,
                    rating: form.rating,
                    comment: form.comment || undefined,
                  })
                }
              >
                {createSurveyMutation.isPending ? "Saving..." : "Save Response"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Resolved Tickets
              </p>
              <p className="text-3xl font-black text-emerald-400 mt-1">
                {stats.resolved ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Avg Satisfaction
              </p>
              <p className="text-3xl font-black text-warning mt-1 flex items-center gap-1">
                <Star className="h-6 w-6 fill-current" />
                {stats.satisfactionScore > 0 ? stats.satisfactionScore : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Survey Responses
              </p>
              <p className="text-3xl font-black text-foreground mt-1">
                {surveys.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {surveys.length === 0 ? (
        <>
          <EmptyState
            icon={<Star className="h-12 w-12" />}
            title="No survey data yet"
            description="Customer satisfaction surveys will appear here once tickets are resolved and customers respond."
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">About CSAT Surveys</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Customer satisfaction (CSAT) surveys are sent to customers when
                their tickets are resolved.
              </p>
              <p>
                Once customers respond, ratings and comments will appear here
                along with satisfaction trends over time.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey: any) => (
            <Card key={survey.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {survey.ticketId
                        ? `Ticket #${survey.ticketId.slice(-6).toUpperCase()}`
                        : `Survey #${survey.id.slice(-4).toUpperCase()}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {survey.createdAt
                        ? new Date(survey.createdAt).toLocaleString()
                        : "-"}
                    </p>
                    {survey.comment && (
                      <p className="text-sm text-foreground mt-1 italic">
                        "{survey.comment}"
                      </p>
                    )}
                  </div>
                  {survey.rating != null && (
                    <div className="flex items-center gap-1 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < survey.rating ? "fill-current" : "opacity-30"}`}
                        />
                      ))}
                      <span className="ml-1 font-semibold text-foreground">
                        {survey.rating}/5
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
