/**
 * CSAT Surveys
 *
 * Customer satisfaction surveys and feedback management.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  MessageSquare,
  Plus,
  Smile,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
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

export const Route = createFileRoute("/app/helpdesk/surveys")({
  component: CSATSurveys,
});

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

const satisfactionData = [
  { month: "Jan", score: 91.2, responses: 234 },
  { month: "Feb", score: 89.5, responses: 267 },
  { month: "Mar", score: 93.1, responses: 289 },
  { month: "Apr", score: 94.2, responses: 312 },
  { month: "May", score: 92.8, responses: 298 },
  { month: "Jun", score: 94.5, responses: 345 },
];

const ratingDistribution = [
  { rating: "5 - Excellent", count: 456, percentage: 45 },
  { rating: "4 - Good", count: 312, percentage: 31 },
  { rating: "3 - Average", count: 156, percentage: 15 },
  { rating: "2 - Poor", count: 67, percentage: 7 },
  { rating: "1 - Very Poor", count: 23, percentage: 2 },
];

const recentResponses = [
  { id: "1", ticket: "TKT-001", rating: 5, comment: "John was extremely helpful and resolved my issue quickly!", date: "2 hours ago" },
  { id: "2", ticket: "TKT-003", rating: 4, comment: "Good support, but took a bit longer than expected.", date: "5 hours ago" },
  { id: "3", ticket: "TKT-005", rating: 5, comment: "Excellent service! Very professional.", date: "1 day ago" },
  { id: "4", ticket: "TKT-008", rating: 3, comment: "Issue was resolved but communication could be better.", date: "2 days ago" },
];

const surveyTemplates = [
  { id: "1", name: "Post-Ticket Resolution", description: "Sent automatically after ticket is resolved", active: true },
  { id: "2", name: "Weekly CSAT", description: "Weekly survey to random customers", active: false },
  { id: "3", name: "Quarterly NPS", description: "Quarterly Net Promoter Score survey", active: false },
];

function CSATSurveys() {
  const [activeTab, setActiveTab] = useState<"overview" | "responses" | "templates">("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/helpdesk">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">CSAT Surveys</h2>
            <p className="text-sm text-muted-foreground">Customer satisfaction surveys and feedback</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Create Survey
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="CSAT Score" value="94.5%" trend="+2.1%" icon={<Smile className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Responses" value="1,014" trend="+12%" icon={<MessageSquare className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Response Rate" value="34%" trend="+3%" icon={<TrendingUp className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Promoters" value="76%" trend="+5%" icon={<ThumbsUp className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "overview", label: "Overview" },
            { id: "responses", label: "Responses" },
            { id: "templates", label: "Templates" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  CSAT Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={satisfactionData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                      <YAxis domain={[80, 100]} axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "none",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#22d3ee" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ratingDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {ratingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "none",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {ratingDistribution.map((item, index) => (
                    <div key={item.rating} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-xs text-muted-foreground">{item.rating}</span>
                      </div>
                      <span className="text-xs font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Recent Responses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Ticket</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rating</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Comment</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResponses.map((response) => (
                    <tr key={response.id} className="border-b border-border">
                      <td className="px-4 py-3 text-sm font-medium">{response.ticket}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= response.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{response.comment}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{response.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Responses Tab */}
      {activeTab === "responses" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              All Responses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Ticket</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Comment</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Agent</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentResponses.map((response) => (
                  <tr key={response.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{response.ticket}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= response.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{response.comment}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">John Doe</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{response.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {surveyTemplates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant={template.active ? "success" : "outline"}>
                        {template.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">
                      {template.active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string; value: string; trend: string; icon: React.ReactNode; color: string }) {
  const trendPositive = trend.startsWith("+");
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
            <div className="mt-1 flex items-center gap-1">
              {trendPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              )}
              <span className={`text-[10px] font-bold ${trendPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {trend}
              </span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
