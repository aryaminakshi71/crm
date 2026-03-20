import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Send,
  Sparkles,
  Database,
  Clock,
  CheckCircle2,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/intelligence/queries")({
  component: Queries,
});

const suggestedQueries = [
  "What was our revenue trend last quarter?",
  "Which customers are at risk of churning?",
  "Show me the top 10 products by sales",
  "What is our customer acquisition cost?",
];

const recentQueries = [
  { id: 1, query: "Monthly revenue by region", result: "chart", time: "2 min ago" },
  { id: 2, query: "Customer lifetime value distribution", result: "table", time: "15 min ago" },
  { id: 3, query: "Churn rate by subscription tier", result: "chart", time: "1 hour ago" },
];

const sampleResponse = {
  type: "chart",
  chartType: "line",
  title: "Revenue Trend - Last 6 Months",
  summary: "Revenue has grown consistently, with a 12% increase from Q4 to Q1. The highest growth was in February at 8.2%.",
  data: [
    { month: "Oct", value: 78000 },
    { month: "Nov", value: 82000 },
    { month: "Dec", value: 85000 },
    { month: "Jan", value: 92000 },
    { month: "Feb", value: 99500 },
    { month: "Mar", value: 118000 },
  ],
  insights: [
    "Strong upward trend with 51% growth over 6 months",
    "February showed exceptional growth of 8.2% month-over-month",
    "On track to exceed Q1 target by 12%",
  ],
};

function Queries() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Natural Language Query Interface</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about your data in plain English
          </p>
        </div>
      </div>

      {/* Query Input */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <p className="font-medium text-foreground">Ask a question about your data</p>
          </div>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What was our revenue last quarter?"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 pr-12 text-sm"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Suggested Queries */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Suggested queries:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggested, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(suggested)}
                  className="px-3 py-1.5 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Response */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="font-medium text-foreground">{sampleResponse.title}</p>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{sampleResponse.summary}</p>

          {/* Chart Preview */}
          <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Line chart showing revenue trend</p>
            </div>
          </div>

          {/* Data Points */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            {sampleResponse.data.map((point) => (
              <div key={point.month} className="text-center p-2 rounded bg-muted/30">
                <p className="text-xs text-muted-foreground">{point.month}</p>
                <p className="text-sm font-bold">${(point.value / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>

          {/* AI Insights */}
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">AI Insights</p>
            </div>
            <ul className="space-y-1">
              {sampleResponse.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Queries */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Recent Queries</h3>
          <div className="space-y-3">
            {recentQueries.map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <Database className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{q.query}</p>
                  <p className="text-xs text-muted-foreground">{q.time}</p>
                </div>
                <span className="px-2 py-1 rounded bg-muted text-xs capitalize">{q.result}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
