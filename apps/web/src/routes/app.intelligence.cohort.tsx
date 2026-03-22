import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_COHORT = {
  cohorts: [
    { cohort: "Jan 2025", size: 120 },
    { cohort: "Feb 2025", size: 98 },
    { cohort: "Mar 2025", size: 145 },
    { cohort: "Apr 2025", size: 112 },
  ],
  retentionMatrix: [
    { cohort: "Jan 2025", m0: 100, m1: 78, m2: 62, m3: 54, m4: 48 },
    { cohort: "Feb 2025", m0: 100, m1: 81, m2: 67, m3: 59, m4: null },
    { cohort: "Mar 2025", m0: 100, m1: 76, m2: 61, m3: null, m4: null },
    { cohort: "Apr 2025", m0: 100, m1: 83, m2: null, m3: null, m4: null },
  ],
};

export const Route = createFileRoute("/app/intelligence/cohort")({
  component: CohortPage,
});

function retentionColor(value: number | null) {
  if (value === null) return "bg-muted text-muted-foreground";
  if (value >= 80) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
  if (value >= 60) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  if (value >= 40) return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
  return "bg-rose-500/20 text-rose-700 dark:text-rose-400";
}

function CohortPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "cohort"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/cohort`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_COHORT;
      return res.json();
    },
  });

  const cohort = data ?? MOCK_COHORT;

  const months = ["Month 0", "Month 1", "Month 2", "Month 3", "Month 4"];
  const monthKeys = ["m0", "m1", "m2", "m3", "m4"] as const;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cohort Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Track how customer groups retain over time.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Retention Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 font-semibold">Cohort</th>
                    <th className="text-left p-2 font-semibold">Size</th>
                    {months.map((m) => (
                      <th key={m} className="text-center p-2 font-semibold">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohort.retentionMatrix?.map((row: any, i: number) => {
                    const cohortInfo = cohort.cohorts?.[i];
                    return (
                      <tr key={row.cohort} className="border-t">
                        <td className="p-2 font-medium">{row.cohort}</td>
                        <td className="p-2 text-muted-foreground">{cohortInfo?.size ?? "-"}</td>
                        {monthKeys.map((key) => {
                          const val = row[key];
                          return (
                            <td key={key} className="p-2 text-center">
                              {val !== null && val !== undefined ? (
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${retentionColor(val)}`}>
                                  {val}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">–</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
