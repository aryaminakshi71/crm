import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { intelligenceApi } from "@/lib/api";

const MOCK_RFM = {
  segments: [
    { name: "Champions", recency: 5, frequency: 5, monetary: 5, count: 42, percentage: 13.2, color: "#10b981" },
    { name: "Loyal Customers", recency: 4, frequency: 4, monetary: 4, count: 118, percentage: 37.1, color: "#3b82f6" },
    { name: "Potential Loyalists", recency: 5, frequency: 2, monetary: 3, count: 56, percentage: 17.6, color: "#8b5cf6" },
    { name: "At Risk", recency: 2, frequency: 3, monetary: 3, count: 67, percentage: 21.1, color: "#f59e0b" },
    { name: "Lost", recency: 1, frequency: 1, monetary: 1, count: 35, percentage: 11.0, color: "#6b7280" },
  ],
  totalCustomers: 318,
};

export const Route = createFileRoute("/app/intelligence/rfm")({
  component: RfmPage,
});

function ScoreDot({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i < score ? "bg-violet-500" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function RfmPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "rfm"],
    queryFn: () => intelligenceApi.rfm.get(),
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const rfm = data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RFM Segments</h1>
        <p className="text-muted-foreground mt-1">
          Segment customers by Recency, Frequency, and Monetary value.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Segment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={(rfm as any).segments}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    labelLine={false}
                  >
                    {(rfm as any).segments?.map((seg: any, i: number) => (
                      <Cell key={i} fill={seg.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, "Customers"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segments Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(rfm as any).segments?.map((segment: any) => (
                  <div key={segment.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: segment.color }}>{segment.name}</p>
                      <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">R</span>
                          <ScoreDot score={segment.recency} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">F</span>
                          <ScoreDot score={segment.frequency} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">M</span>
                          <ScoreDot score={segment.monetary} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{segment.count}</p>
                      <p className="text-xs text-muted-foreground">{segment.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
