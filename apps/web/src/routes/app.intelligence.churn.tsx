import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  AlertTriangle,
  Users,
  TrendingDown,
  Calendar,
  ArrowRight,
  Heart,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/churn")({
  component: Churn,
});

const churnStats = [
  { label: "Churn Rate", value: "2.1%", change: "-0.3%", trend: "down", icon: TrendingDown },
  { label: "At-Risk Customers", value: "156", change: "+12", trend: "up", icon: AlertTriangle },
  { label: "Revenue at Risk", value: "$89K", change: "+8%", trend: "up", icon: AlertTriangle },
  { label: "Avg Customer Tenure", value: "18mo", change: "+2mo", trend: "up", icon: Calendar },
];

const atRiskCustomers = [
  { id: 1, name: "Downtown Office Solutions", risk: "High", reason: "Declining usage", lastActive: "15 days ago", revenue: "$4,200/mo" },
  { id: 2, name: "Cityview Properties", risk: "High", reason: "Support ticket spike", lastActive: "12 days ago", revenue: "$3,800/mo" },
  { id: 3, name: "Metro Tech Services", risk: "Medium", reason: "Competitor interest", lastActive: "8 days ago", revenue: "$2,900/mo" },
  { id: 4, name: "Harbor Financial Group", risk: "Medium", reason: "Low feature adoption", lastActive: "10 days ago", revenue: "$5,100/mo" },
];

const churnReasons = [
  { reason: "Price too high", percentage: 28, count: 142 },
  { reason: "Competitor offering", percentage: 24, count: 121 },
  { reason: "Not using enough features", percentage: 18, count: 91 },
  { reason: "Poor support experience", percentage: 12, count: 61 },
  { reason: "No longer needed", percentage: 10, count: 51 },
  { reason: "Switched platforms", percentage: 8, count: 41 },
];

function Churn() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Churn Prediction</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered churn risk detection and analysis
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Heart className="h-4 w-4" />
          Create Retention Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {churnStats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.trend === "down" ? "text-green-500" : "text-red-500"}`}>
                    {stat.change} vs last month
                  </p>
                </div>
                <stat.icon className={`h-5 w-5 ${
                  stat.trend === "down" ? "text-green-500" : "text-red-500"
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* At-Risk Customers */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-foreground">At-Risk Customers</h3>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">
              {atRiskCustomers.length} customers
            </span>
          </div>
          <div className="space-y-3">
            {atRiskCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-amber-500/20 bg-background"
              >
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{customer.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      customer.risk === "High" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {customer.risk} Risk
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{customer.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{customer.lastActive}</p>
                  <p className="text-xs text-muted-foreground">Last active</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{customer.revenue}</p>
                  <p className="text-xs text-muted-foreground">MRR</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                  Retain
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Churn Reasons */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Top Churn Reasons</h3>
          <div className="space-y-3">
            {churnReasons.map((item, idx) => (
              <div key={item.reason} className="flex items-center gap-4">
                <span className="w-6 text-center text-sm text-muted-foreground">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.reason}</span>
                    <span className="text-sm text-muted-foreground">{item.count} customers</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
