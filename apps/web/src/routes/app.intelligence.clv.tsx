import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/intelligence/clv")({
  component: CLV,
});

const clvDistribution = [
  { range: "$0-100", count: 2340 },
  { range: "$100-500", count: 1890 },
  { range: "$500-1K", count: 1245 },
  { range: "$1K-5K", count: 890 },
  { range: "$5K-10K", count: 345 },
  { range: "$10K+", count: 89 },
];

const topCLV = [
  { rank: 1, name: "Acme Corporation", clv: "$12,450", orders: 54, avgOrder: "$230" },
  { rank: 2, name: "TechStart Inc", clv: "$9,820", orders: 42, avgOrder: "$233" },
  { rank: 3, name: "Metro Hospital", clv: "$8,340", orders: 38, avgOrder: "$219" },
  { rank: 4, name: "Harbor View Hotel", clv: "$7,120", orders: 35, avgOrder: "$203" },
  { rank: 5, name: "Green Valley Clinic", clv: "$6,890", orders: 31, avgOrder: "$222" },
];

const clvStats = [
  { label: "Avg CLV", value: "$1,245", change: "+12%", icon: DollarSign },
  { label: "Median CLV", value: "$580", change: "+8%", icon: Target },
  { label: "Total Customer Value", value: "$10.1M", change: "+15%", icon: TrendingUp },
  { label: "High Value Customers", value: "1,324", change: "+22", icon: Users },
];

function CLV() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Customer Lifetime Value</h2>
          <p className="text-sm text-muted-foreground">
            Analyze and predict customer lifetime value
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {clvStats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-green-500 mt-1">{stat.change}</p>
                </div>
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CLV Distribution */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">CLV Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={clvDistribution}>
              <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#888" />
              <YAxis tick={{ fontSize: 12 }} stroke="#888" />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top CLV Customers */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Top Customers by Lifetime Value</h3>
            <button className="text-xs text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {topCLV.map((customer) => (
              <div
                key={customer.rank}
                className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {customer.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.orders} orders - Avg ${customer.avgOrder}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{customer.clv}</p>
                  <p className="text-xs text-muted-foreground">Lifetime Value</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CLV Insights */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-3">AI Insights</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Your top 5% of customers generate 35% of total revenue. Focus retention efforts on this segment.
            </p>
            <p className="text-sm text-muted-foreground">
              Customers with CLV above $5,000 have 78% higher retention rate than average.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
