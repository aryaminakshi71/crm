import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/surveys")({
  component: SurveysPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.companyId) return { "x-organization-id": user.companyId };
    } catch {}
  }
  return {};
}

async function fetchSurveys() {
  const res = await fetch(`${API_BASE}/v1/helpdesk/surveys`, {
    headers: { ...getOrgHeader() },
  });
  if (!res.ok) throw new Error("No survey endpoint");
  return res.json();
}

function SurveysPage() {
  // Fetch closed tickets to derive satisfaction proxy data
  const { data: ticketsData } = useQuery({
    queryKey: ["nucleo-tickets", "closed", "all"],
    queryFn: () =>
      nucleoApi.tickets.list({ page: 1, limit: 500, status: "closed" }),
  });

  // Attempt to fetch survey endpoint — expected to 404 for now
  const { data: surveyData, error: surveyError } = useQuery({
    queryKey: ["helpdesk", "surveys"],
    queryFn: fetchSurveys,
    retry: false,
  });

  const closedTickets: any[] = ticketsData?.data ?? [];
  const surveys: any[] = surveyData?.data ?? [];
  const hasRealSurveys = !surveyError && surveys.length > 0;

  // Derive simple stats from closed tickets as proxy
  const totalClosed = closedTickets.length;
  const highPriorityClosed = closedTickets.filter(
    (t: any) => t.priority === "high",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">
          Customer Satisfaction
        </h1>
        <p className="text-muted-foreground">
          CSAT survey results and satisfaction trends.
        </p>
      </div>

      {hasRealSurveys ? (
        <div className="space-y-4">
          {surveys.map((survey: any) => (
            <Card key={survey.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {survey.title || `Survey #${survey.id.slice(-4)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {survey.createdAt
                        ? new Date(survey.createdAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                  {survey.score != null && (
                    <div className="flex items-center gap-1 text-warning">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{survey.score}/5</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {totalClosed > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Resolved Tickets
                  </p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">
                    {totalClosed}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Critical Resolved
                  </p>
                  <p className="text-3xl font-black text-foreground mt-1">
                    {highPriorityClosed}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Survey Response Rate
                  </p>
                  <p className="text-3xl font-black text-muted-foreground mt-1">
                    —
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <EmptyState
            icon={<Star className="h-12 w-12" />}
            title="No survey data yet"
            description="Customer satisfaction surveys will appear here once the survey endpoint is configured. Surveys are sent automatically after tickets are resolved."
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Customer satisfaction (CSAT) surveys are automatically sent to
                customers when their tickets are resolved.
              </p>
              <p>
                Once configured, you will see ratings, comments, and satisfaction
                trends here.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
