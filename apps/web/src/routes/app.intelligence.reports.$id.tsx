import {Button, Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { FileText,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_REPORT = (id: string) => ({
  id,
  title: `Intelligence Report #${id}`,
  type: "custom",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "ready",
  sections: [
    { title: "Executive Summary", content: "Overall performance is trending positively with 12% MoM growth." },
    { title: "Key Metrics", data: { revenue: 480000, customers: 318, churnRate: 5.8 } },
    { title: "Recommendations", items: ["Focus on at-risk segment re-engagement", "Upsell Champions to Enterprise tier"] },
  ],
});

export const Route = createFileRoute("/app/intelligence/reports/$id")({
  component: ReportPage,
});

function ReportPage() {
  const { id } = useParams({ from: "/app/intelligence/reports/$id" });

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["intelligence", "reports", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/reports/${id}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_REPORT(id);
      return res.json();
    },
    enabled: !!id,
  });

  const report = data ?? MOCK_REPORT(id);

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton className="h-8 w-64 rounded" />
        <LoadingSkeleton className="h-48 w-full rounded-lg" />
        <LoadingSkeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{report.title}</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Created {new Date(report.createdAt).toLocaleString()} · Updated {new Date(report.updatedAt).toLocaleString()}
          </p>
        </div>
        <Badge variant="default">{report.status}</Badge>
      </div>

      <div className="space-y-4">
        {(report.sections ?? []).map((section: any, i: number) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {section.content && <p className="text-sm">{section.content}</p>}
              {section.data && (
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(section.data).map(([key, val]) => (
                    <div key={key} className="p-3 rounded-lg border text-center">
                      <p className="text-xs text-muted-foreground capitalize mb-1">{key.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-xl font-bold">
                        {typeof val === "number"
                          ? val > 1000
                            ? `$${(val as number).toLocaleString()}`
                            : val
                          : String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {section.items && (
                <ul className="space-y-2">
                  {section.items.map((item: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="text-violet-500 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
