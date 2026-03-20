import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  ArrowLeft,
  Download,
  Share2,
  Calendar,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/intelligence/reports/$id")({
  component: ReportDetail,
});

const reportData = {
  id: "1",
  name: "Monthly Revenue Summary",
  type: "financial",
  schedule: "Monthly",
  lastRun: "Mar 1, 2026",
  createdBy: "John Smith",
  description: "Comprehensive overview of monthly revenue including trends, breakdowns, and comparisons.",
  chartType: "area",
  data: [
    { month: "Jan", revenue: 85000, expenses: 45000, profit: 40000 },
    { month: "Feb", revenue: 92000, expenses: 48000, profit: 44000 },
    { month: "Mar", revenue: 88000, expenses: 46000, profit: 42000 },
    { month: "Apr", revenue: 105000, expenses: 52000, profit: 53000 },
    { month: "May", revenue: 112000, expenses: 55000, profit: 57000 },
    { month: "Jun", revenue: 118000, expenses: 58000, profit: 60000 },
  ],
};

function ReportDetail() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/intelligence/reports" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{reportData.name}</h2>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs capitalize">{reportData.type}</span>
          </div>
          <p className="text-sm text-muted-foreground">{reportData.description}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Configure
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Meta Info */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Schedule: {reportData.schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last run: {reportData.lastRun}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Created by: {reportData.createdBy}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Revenue Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={reportData.data}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888" />
              <YAxis tick={{ fontSize: 12 }} stroke="#888" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f620" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="#ef444420" name="Expenses" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b98120" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">$590K</p>
            <p className="text-xs text-muted-foreground">Total Revenue (6mo)</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">$296K</p>
            <p className="text-xs text-muted-foreground">Total Profit (6mo)</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">50.2%</p>
            <p className="text-xs text-muted-foreground">Profit Margin</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
