import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/cohort")({
  component: Cohort,
});

const cohortData = [
  { cohort: "Jan 2026", users: 420, month1: 85, month2: 72, month3: 65, month4: 58 },
  { cohort: "Feb 2026", users: 480, month1: 88, month2: 75, month3: 68 },
  { cohort: "Mar 2026", users: 510, month1: 82, month2: 70 },
  { cohort: "Apr 2026", users: 580, month1: 86 },
];

function Cohort() {
  const getColor = (value: number) => {
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
          <h2 className="text-xl font-bold text-foreground">Cohort Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Analyze customer behavior by acquisition cohort
          </p>
        </div>
      </div>

      {/* Cohort Retention Matrix */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Retention by Cohort</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cohort</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Users</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Month 1</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Month 2</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Month 3</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Month 4</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={row.cohort} className="border-b border-border/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{row.cohort}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{row.users}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <div className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-medium ${getColor(row.month1)}`}>
                          {row.month1}%
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.month2 ? (
                        <div className="flex items-center justify-center">
                          <div className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-medium ${getColor(row.month2)}`}>
                            {row.month2}%
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-8 rounded flex items-center justify-center text-xs text-muted-foreground">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.month3 ? (
                        <div className="flex items-center justify-center">
                          <div className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-medium ${getColor(row.month3)}`}>
                            {row.month3}%
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-8 rounded flex items-center justify-center text-xs text-muted-foreground">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.month4 ? (
                        <div className="flex items-center justify-center">
                          <div className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-medium ${getColor(row.month4)}`}>
                            {row.month4}%
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-8 rounded flex items-center justify-center text-xs text-muted-foreground">-</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/40">
            <span className="text-xs text-muted-foreground">Retention Rate:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-300" />
              <span className="text-xs text-muted-foreground">&lt;20%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-amber-300" />
              <span className="text-xs text-muted-foreground">20-40%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-amber-400" />
              <span className="text-xs text-muted-foreground">40-60%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-400" />
              <span className="text-xs text-muted-foreground">60-80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-xs text-muted-foreground">&gt;80%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">72%</p>
                <p className="text-xs text-muted-foreground">Avg Month 2 Retention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">1,990</p>
                <p className="text-xs text-muted-foreground">Total Cohort Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowRight className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">+5%</p>
                <p className="text-xs text-muted-foreground">Retention vs Last Quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
