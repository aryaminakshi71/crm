import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Award,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/rfm")({
  component: RFM,
});

const rfmSegments = [
  { name: "Champions", count: 1245, revenue: "$285,000", avgOrder: "$228", color: "bg-green-500", recency: "Recent", frequency: "High", monetary: "High" },
  { name: "Loyal", count: 2134, revenue: "$198,000", avgOrder: "$92", color: "bg-blue-500", recency: "Medium", frequency: "High", monetary: "Medium" },
  { name: "Potential", count: 3421, revenue: "$156,000", avgOrder: "$45", color: "bg-purple-500", recency: "Recent", frequency: "Medium", monetary: "Medium" },
  { name: "At Risk", count: 892, revenue: "$89,000", avgOrder: "$99", color: "bg-amber-500", recency: "Old", frequency: "Medium", monetary: "Medium" },
  { name: "Lost", count: 456, revenue: "$12,000", avgOrder: "$26", color: "bg-red-500", recency: "Old", frequency: "Low", monetary: "Low" },
];

const topChampions = [
  { rank: 1, name: "Acme Corporation", segment: "Champions", ltv: "$12,450", orders: 54 },
  { rank: 2, name: "TechStart Inc", segment: "Champions", ltv: "$9,820", orders: 42 },
  { rank: 3, name: "Metro Hospital", segment: "Champions", ltv: "$8,340", orders: 38 },
];

function RFM() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">RFM Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Recency, Frequency, Monetary segmentation
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">8,148</p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">$740K</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Award className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">1,245</p>
            <p className="text-xs text-muted-foreground">Champions</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">$91</p>
            <p className="text-xs text-muted-foreground">Avg Order Value</p>
          </CardContent>
        </Card>
      </div>

      {/* RFM Segments */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Customer Segments</h3>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {rfmSegments.map((segment) => (
              <div
                key={segment.name}
                className={`p-4 rounded-lg border border-border/40 bg-gradient-to-b from-${segment.color}/10 to-${segment.color}/5`}
              >
                <div className={`w-3 h-3 rounded-full ${segment.color} mb-2`} />
                <p className="font-bold text-foreground">{segment.name}</p>
                <p className="text-2xl font-bold mt-2">{segment.count}</p>
                <p className="text-xs text-muted-foreground">customers</p>
                <p className="text-lg font-bold text-green-600 mt-2">{segment.revenue}</p>
                <p className="text-xs text-muted-foreground">revenue</p>
                <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                  <p className="text-xs"><span className="text-muted-foreground">R:</span> {segment.recency}</p>
                  <p className="text-xs"><span className="text-muted-foreground">F:</span> {segment.frequency}</p>
                  <p className="text-xs"><span className="text-muted-foreground">M:</span> {segment.monetary}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Champions */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Top Champions</h3>
            <button className="text-xs text-primary hover:underline">View All Champions</button>
          </div>
          <div className="space-y-3">
            {topChampions.map((customer) => (
              <div
                key={customer.rank}
                className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
                  {customer.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{customer.ltv}</p>
                  <p className="text-xs text-muted-foreground">Lifetime Value</p>
                </div>
                <Award className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
