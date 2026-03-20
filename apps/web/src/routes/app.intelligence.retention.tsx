import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/retention")({
  component: Retention,
});

const retentionMatrix = [
  { week: "Week 0", day0: 100, day7: 85, day14: 72, day30: 65, day60: 58, day90: 52 },
  { week: "Week 4", day0: 100, day7: 88, day14: 76, day30: 68, day60: 62, day90: null },
  { week: "Week 8", day0: 100, day7: 90, day14: 78, day30: 70, day60: null, day90: null },
  { week: "Week 12", day0: 100, day7: 87, day14: 74, day30: 66, day60: null, day90: null },
];

const retentionBySegment = [
  { segment: "Enterprise", retention: 92, change: "+3%" },
  { segment: "Professional", retention: 84, change: "+1%" },
  { segment: "Starter", retention: 68, change: "-2%" },
  { segment: "Free Trial", retention: 45, change: "+5%" },
];

function Retention() {
  const getColor = (value: number | null) => {
    if (value === null) return "bg-muted";
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-green-400";
    if (value >= 40) return "bg-amber-400";
    if (value >= 20) return "bg-amber-300";
    return "bg-red-300";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Retention Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Track customer retention over time
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">52%</p>
            <p className="text-xs text-muted-foreground">90-Day Retention</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">+4%</p>
            <p className="text-xs text-muted-foreground">vs Last Quarter</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">68%</p>
            <p className="text-xs text-muted-foreground">30-Day Retention</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">2.4x</p>
            <p className="text-xs text-muted-foreground">Avg User Lifetime</p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Matrix */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Cohort Retention Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cohort</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Day 0</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Day 7</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Day 14</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Day 30</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Day 60</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Day 90</th>
                </tr>
              </thead>
              <tbody>
                {retentionMatrix.map((row) => (
                  <tr key={row.week} className="border-b border-border/40">
                    <td className="px-4 py-3 text-sm font-medium">{row.week}</td>
                    {[row.day0, row.day7, row.day14, row.day30, row.day60, row.day90].map((val, idx) => (
                      <td key={idx} className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          {val !== null ? (
                            <div className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-medium ${getColor(val)}`}>
                              {val}%
                            </div>
                          ) : (
                            <div className="w-12 h-8 rounded flex items-center justify-center text-xs text-muted-foreground">-</div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Retention by Segment */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Retention by Customer Segment</h3>
          <div className="space-y-3">
            {retentionBySegment.map((segment) => (
              <div key={segment.segment} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium">{segment.segment}</span>
                <div className="flex-1">
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${segment.retention >= 80 ? "bg-green-500" : segment.retention >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${segment.retention}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-sm font-medium text-right">{segment.retention}%</span>
                <span className={`w-12 text-xs ${
                  segment.change.startsWith("+") ? "text-green-500" : "text-red-500"
                }`}>{segment.change}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
