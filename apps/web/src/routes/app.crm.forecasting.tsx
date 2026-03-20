/**
 * CRM Sales Forecasting
 *
 * Sales forecasting visualization and pipeline predictions.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  DollarSign,
  Filter,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/crm/forecasting")({
  component: SalesForecasting,
});

function SalesForecasting() {
  const [forecastPeriod, setForecastPeriod] = useState<"quarterly" | "monthly">("quarterly");

  const pipelineData = [
    { month: "Jan", actual: 65000, predicted: 60000, committed: 55000 },
    { month: "Feb", actual: 72000, predicted: 70000, committed: 65000 },
    { month: "Mar", actual: 68000, predicted: 75000, committed: 70000 },
    { month: "Apr", predicted: 80000, committed: 72000 },
    { month: "May", predicted: 85000, committed: 75000 },
    { month: "Jun", predicted: 90000, committed: 80000 },
  ];

  const stageConversionData = [
    { stage: "Leads", count: 450, value: 0, color: "#818cf8" },
    { stage: "Qualified", count: 180, value: 0, color: "#a78bfa" },
    { stage: "Proposal", count: 90, value: 4500000, color: "#22d3ee" },
    { stage: "Negotiation", count: 45, value: 3800000, color: "#fbbf24" },
    { stage: "Closed Won", count: 23, value: 2100000, color: "#22c55e" },
  ];

  const repPerformanceData = [
    { name: "Sarah Chen", quota: 150000, actual: 165000, deals: 12 },
    { name: "David Park", quota: 120000, actual: 118000, deals: 9 },
    { name: "Emily Zhang", quota: 130000, actual: 142000, deals: 11 },
    { name: "Mike Lee", quota: 100000, actual: 95000, deals: 7 },
    { name: "Lisa Wang", quota: 110000, actual: 121000, deals: 10 },
  ];

  const dealSourceData = [
    { source: "Inbound", value: 35, color: "#818cf8" },
    { source: "Outbound", value: 28, color: "#22d3ee" },
    { source: "Partner", value: 22, color: "#34d399" },
    { source: "Referral", value: 15, color: "#fbbf24" },
  ];

  const forecastStats = {
    totalPipeline: 4850000,
    weightedPipeline: 3200000,
    committedRevenue: 2800000,
    bestCaseRevenue: 4200000,
    quotaAttainment: 87,
    dealsAtRisk: 8,
    dealsInProgress: 45,
    avgDealSize: 85000,
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${(entry.value / 1000).toFixed(0)}K
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Sales Forecast</h2>
          <p className="text-sm text-muted-foreground">Q1-Q2 2024 Revenue Projections</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setForecastPeriod("quarterly")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                forecastPeriod === "quarterly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setForecastPeriod("monthly")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                forecastPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Total Pipeline</p>
                <p className="font-bold text-2xl mt-1">
                  ${(forecastStats.totalPipeline / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {forecastStats.dealsInProgress} deals in progress
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Weighted Pipeline</p>
                <p className="font-bold text-2xl mt-1 text-blue-600">
                  ${(forecastStats.weightedPipeline / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground mt-1">66% of total</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Committed Revenue</p>
                <p className="font-bold text-2xl mt-1 text-green-600">
                  ${(forecastStats.committedRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ready to close</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Best Case</p>
                <p className="font-bold text-2xl mt-1 text-purple-600">
                  ${(forecastStats.bestCaseRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground mt-1">If all deals close</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Forecast Chart */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelineData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#818cf8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorPredicted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="committed"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-400" />
                <span className="text-xs text-muted-foreground">Predicted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="text-xs text-muted-foreground">Committed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline by Stage */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageConversionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {stageConversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {stageConversionData.map((item) => (
                <div key={item.stage} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.stage}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rep Performance */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Rep Performance</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" tickFormatter={(v) => `$${v / 1000}k`} />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="quota" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <span className="text-xs text-muted-foreground">Quota</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Actual</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Source */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Deal Source Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dealSourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dealSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {dealSourceData.map((item) => (
                <div key={item.source} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk & Alerts */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Deals Requiring Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-sm text-red-900">{forecastStats.dealsAtRisk} Deals at Risk</p>
                <p className="text-xs text-red-700">Stalled for 14+ days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-sm text-yellow-900">12 Deals Declining</p>
                <p className="text-xs text-yellow-700">Probability decreased</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm text-blue-900">6 Deals Past Due</p>
                <p className="text-xs text-blue-700">Expected close date passed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
